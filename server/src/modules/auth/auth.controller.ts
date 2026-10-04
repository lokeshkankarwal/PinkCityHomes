import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, type Role } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { signToken } from "../../middleware/auth.js";
import { sendVerificationEmail } from "../../services/email.service.js";
import { env } from "../../config/env.js";
import { saveFile, deleteLocalFile } from "../../services/storage.service.js";
import type { Request, Response } from "express";

const registerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.string().optional(),
  companyName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  loginAs: z.string().optional(),
  role: z.string().optional(),
});

function cookieOpts() {
  const prod = env.nodeEnv === "production";
  return {
    httpOnly: true,
    sameSite: prod ? ("none" as const) : ("lax" as const),
    secure: prod,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

function otp() {
  // Cryptographically random 6-digit integer
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function issueVerification(userId: string, email: string) {
  // 1. Invalidate any previous pending OTPs for this user
  await prisma.emailVerification.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  }).catch(() => {});

  // 2. Generate secure 6-digit OTP
  const code = otp();
  const otpHash = await bcrypt.hash(code, 10);

  // 3. Create database record with 15-minute expiration
  const rec = await prisma.emailVerification.create({
    data: {
      userId,
      otpHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  // 4. Send email. If sending fails, invalidate the record and rethrow error
  try {
    const mailResult = await sendVerificationEmail(email, code);
    return { code, mailResult };
  } catch (err) {
    await prisma.emailVerification.update({
      where: { id: rec.id },
      data: { usedAt: new Date() },
    }).catch(() => {});
    throw err;
  }
}

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);
  const isSeller = body.role && (body.role.toUpperCase() === "SELLER" || body.role.toUpperCase() === "AGENCY");

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) {
    throw new HttpError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  if (isSeller) {
    // Seller registration: No OTP. Goes to Superadmin for review and approval.
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        name: body.name,
        phone: body.phone,
        role: "SELLER",
        emailVerifiedAt: null,
      },
    });

    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        companyName: body.companyName || body.name,
        status: "PENDING",
        isDisabled: false,
      },
    });

    return res.status(201).json({
      message: "Seller application submitted successfully! Your account is awaiting Superadmin approval. You can log in once approved.",
      email: user.email,
      role: "SELLER",
      pendingApproval: true,
    });
  }

  // Normal Customer/Buyer registration: Requires OTP verification
  const user = await prisma.user.create({
    data: {
      email: body.email.toLowerCase(),
      passwordHash,
      name: body.name,
      phone: body.phone,
      role: "CUSTOMER",
      emailVerifiedAt: null,
    },
  });

  try {
    const { mailResult } = await issueVerification(user.id, user.email);

    res.status(201).json({
      message: "Registration successful. Please enter the 6-digit verification code sent to your email.",
      email: user.email,
      role: "CUSTOMER",
      pendingApproval: false,
      devOtpHint: env.nodeEnv !== "production" && Boolean(mailResult.isDevFallback),
    });
  } catch (err: any) {
    throw new HttpError(
      502,
      "Account registered, but we could not deliver the verification email. Please log in and click 'Resend OTP' to receive your code.",
    );
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const { email, otp } = z.object({ email: z.string().email(), otp: z.string().min(4) }).parse(req.body);
  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = otp.trim();

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: { sellerProfile: true },
  });

  if (!user) throw new HttpError(404, "User not found with this email address");

  // Security rule: OTP is strictly for Users/Buyers, not Sellers
  if (user.role === "SELLER") {
    throw new HttpError(400, "Seller accounts are approved by Superadmin and do not use OTP verification.");
  }

  if (user.emailVerifiedAt) {
    return res.json({ message: "Account is already verified. You can log in.", alreadyVerified: true });
  }

  const rec = await prisma.emailVerification.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!rec) {
    throw new HttpError(400, "No pending verification found. Please request a new OTP code.");
  }

  if (rec.attempts >= 5) {
    await prisma.emailVerification.update({
      where: { id: rec.id },
      data: { usedAt: new Date() },
    }).catch(() => {});
    throw new HttpError(429, "Too many failed attempts with this code. Please request a new OTP.");
  }

  if (rec.expiresAt < new Date()) {
    await prisma.emailVerification.update({
      where: { id: rec.id },
      data: { usedAt: new Date() },
    }).catch(() => {});
    throw new HttpError(400, "Verification code has expired. Please request a fresh OTP.");
  }

  const ok = await bcrypt.compare(cleanOtp, rec.otpHash);
  await prisma.emailVerification.update({
    where: { id: rec.id },
    data: { attempts: { increment: 1 }, usedAt: ok ? new Date() : null },
  });

  if (!ok) {
    const remaining = 5 - (rec.attempts + 1);
    throw new HttpError(
      400,
      `Invalid verification code. Please check and try again.${remaining > 0 ? ` (${remaining} attempts remaining)` : ""}`,
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });

  res.json({ message: "Account verified successfully! You can now log in." });
}

export async function resendOtp(req: Request, res: Response) {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user) throw new HttpError(404, "User not found with this email address");

  if (user.role === "SELLER") {
    throw new HttpError(400, "Seller accounts are approved by Superadmin and do not use OTP verification.");
  }

  if (user.emailVerifiedAt) {
    throw new HttpError(400, "Email is already verified. You can log in.");
  }

  const recent = await prisma.emailVerification.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) throw new HttpError(429, "Please wait 60 seconds before requesting another OTP.");

  await issueVerification(user.id, user.email);
  res.json({ message: "A fresh verification code has been dispatched to your email." });
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const requestedRoleRaw = (body.loginAs || body.role || "").toUpperCase();

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
    include: { sellerProfile: true },
  });

  if (!user) throw new HttpError(401, "Invalid email or password");

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid email or password");

  // 1. Role mismatch security check
  if (requestedRoleRaw === "CUSTOMER" || requestedRoleRaw === "BUYER" || requestedRoleRaw === "USER") {
    if (user.role === "SELLER") {
      throw new HttpError(403, "This account is registered as a Seller. Please use Seller Login.");
    }
  } else if (requestedRoleRaw === "SELLER" || requestedRoleRaw === "AGENCY") {
    if (user.role === "CUSTOMER") {
      throw new HttpError(403, "This account is registered as a User. Please use User Login.");
    }
  }

  // 2. Disabled account check
  if ((user as any).isDisabled) {
    throw new HttpError(403, "Your account has been disabled by PinkCityHomes administration.");
  }

  // 3. User / Buyer verification rules
  if (user.role === "CUSTOMER") {
    if (!user.emailVerifiedAt) {
      throw new HttpError(403, "Please verify your email before logging in.");
    }
  }

  // 4. Seller approval rules (Superadmin only approves, NO OTP)
  if (user.role === "SELLER") {
    const sp = user.sellerProfile;

    if ((sp as any)?.isDisabled || sp?.status === "SUSPENDED" || sp?.status === "DISABLED") {
      throw new HttpError(403, "Your seller account has been disabled by PinkCityHomes administration.");
    }

    if (!sp || sp.status === "PENDING" || sp.status === "PENDING_APPROVAL" || sp.status === "PENDING_VERIFICATION") {
      throw new HttpError(403, "Your seller account is awaiting Superadmin approval.");
    }

    if (sp.status === "REJECTED") {
      throw new HttpError(403, "Your seller application has been rejected.");
    }

    if (sp.status !== "APPROVED") {
      throw new HttpError(403, "Your seller account is awaiting Superadmin approval.");
    }
  }

  // 5. Generate secure session token
  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  res.cookie("token", token, cookieOpts());

  res.json({
    token,
    user: publicUser(user),
  });
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { sellerProfile: true },
  });
  if (!user) throw new HttpError(404, "User not found");

  if ((user as any).isDisabled) {
    throw new HttpError(403, "Your account has been disabled by PinkCityHomes administration.");
  }

  if (
    user.role === "SELLER" &&
    ((user.sellerProfile as any)?.isDisabled ||
      user.sellerProfile?.status === "SUSPENDED" ||
      user.sellerProfile?.status === "DISABLED")
  ) {
    throw new HttpError(403, "Your seller account has been disabled by PinkCityHomes administration.");
  }

  res.json({ user: publicUser(user) });
}

export async function logout(req: Request, res: Response) {
  const opts = { ...cookieOpts(), maxAge: 0 };
  res.clearCookie("token", opts);
  res.json({ ok: true });
}

export async function updateProfile(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const body = z.object({ name: z.string().min(2).optional(), phone: z.string().optional() }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data: body, include: { sellerProfile: true } });
  res.json({ user: publicUser(user) });
}

export async function uploadAvatar(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const file = req.file;
  if (!file) throw new HttpError(400, "No file provided");

  const current = await prisma.user.findUnique({ where: { id: req.user.id }, select: { avatarUrl: true } });
  if (current?.avatarUrl) {
    await deleteLocalFile(current.avatarUrl);
  }

  const avatarUrl = await saveFile(file.originalname, file.buffer, file.mimetype, "avatars");
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl },
    include: { sellerProfile: true },
  });
  res.json({ user: publicUser(user) });
}

export async function removeAvatar(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const current = await prisma.user.findUnique({ where: { id: req.user.id }, select: { avatarUrl: true } });
  if (current?.avatarUrl) {
    await deleteLocalFile(current.avatarUrl);
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl: null },
    include: { sellerProfile: true },
  });

  res.json({ user: publicUser(updated) });
}

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl?: string | null;
  role: Role;
  emailVerifiedAt: Date | null;
  isDisabled?: boolean;
  sellerProfile?: { status: string; companyName: string | null; isDisabled?: boolean } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
    isDisabled: Boolean((user as any).isDisabled),
    sellerStatus: user.sellerProfile?.status ?? null,
    companyName: user.sellerProfile?.companyName ?? null,
  };
}
