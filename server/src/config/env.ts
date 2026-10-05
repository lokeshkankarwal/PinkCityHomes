import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../../../.env") });
dotenv.config({ path: path.resolve(here, "../../../.env") });
dotenv.config({ path: path.resolve(here, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  // Supports a comma-separated list of allowed frontend origins (strips trailing slashes)
  clientOrigin: (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean),
  superadminEmail: process.env.SUPERADMIN_EMAIL ?? "pinkcityhomes456@gmail.com",
  superadminPassword: process.env.SUPERADMIN_PASSWORD ?? "",
  // Email provider selection:
  //   - "gmail"  -> free Gmail SMTP (port 465/587) via Google App Password
  //                 Works out of the box with any Gmail account; sends to ANY recipient for FREE
  //   - "resend" -> Resend HTTPS API (requires verified domain on Render to send to arbitrary addresses)
  emailProvider: (
    (process.env.EMAIL_PROVIDER || process.env.EMAIL_TRANSPORT || "").toLowerCase().trim() ||
    (process.env.SMTP_HOST || process.env.SMTP_USER ? "gmail" : "") ||
    (process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY ? "resend" : "") ||
    "gmail"
  ).toLowerCase(),
  // Gmail SMTP (FREE — no domain needed, sends to any Gmail address worldwide)
  smtpHost: (process.env.SMTP_HOST || "").trim() || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpSecure:
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : Number(process.env.SMTP_PORT ?? 465) === 465,
  smtpUser: (process.env.SMTP_USER || "").trim(),
  smtpPass: (process.env.SMTP_PASS || "").trim(),
  // Resend HTTPS API (email delivery)
  emailApiKey: (process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || "").trim(),
  emailFrom: (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER ? `PinkCityHomes <${process.env.SMTP_USER}>` : "PinkCityHomes <onboarding@resend.dev>")
  ).trim(),
  emailVerificationUrl: (process.env.EMAIL_VERIFICATION_URL ?? "http://localhost:5173").replace(/\/+$/, ""),
  // MongoDB Geospatial Discovery
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/pinkcityhomes",
  // Cloudinary Media Storage
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  // AWS S3 Storage Architecture (fallback)
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.AWS_REGION ?? "ap-south-1",
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? "",
  // Rate limiting (configurable via env)
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "development" ? 500 : 60)),
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "development" ? 200 : 15)),
  registrationRateLimitMax: Number(process.env.REGISTRATION_RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "development" ? 200 : 30)),
  verificationRateLimitMax: Number(process.env.VERIFICATION_RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "development" ? 100 : 30)),
  resendRateLimitMax: Number(process.env.RESEND_RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "development" ? 50 : 10)),
  passwordResetRateLimitMax: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX ?? 10),
};
