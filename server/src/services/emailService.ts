import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/error.js";

let resendClient: Resend | null = null;
let smtpTransporter: Transporter | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  if (env.emailApiKey) {
    resendClient = new Resend(env.emailApiKey);
    return resendClient;
  }
  return null;
}

function getSmtpTransporter(): Transporter | null {
  if (smtpTransporter) return smtpTransporter;
  if (!env.smtpUser || !env.smtpPass) return null;
  try {
    smtpTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
    return smtpTransporter;
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to create SMTP transporter: ${(err as Error)?.message || err}`);
    return null;
  }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

function getVerificationHtml(otp: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:36px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;width:44px;height:44px;line-height:44px;background:linear-gradient(135deg, #e11d48, #f59e0b);color:#ffffff;font-size:22px;font-weight:bold;border-radius:12px;">P</div>
        <h2 style="color:#0b1d35;margin:12px 0 4px;font-size:24px;font-weight:700;">PinkCityHomes</h2>
        <p style="color:#64748b;font-size:13px;margin:0;">Verified Real Estate Marketplace • Jaipur, Rajasthan</p>
      </div>
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:20px 0;" />
      <p style="color:#1e293b;font-size:15px;line-height:1.5;">Welcome to PinkCityHomes! Please use the 6-digit verification code below to complete your registration:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#0b1d35;font-family:monospace;">${otp}</span>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.5;">This code expires in <strong style="color:#0b1d35;">10 minutes</strong>. For your security, never share this code with anyone.</p>
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f1f5f9;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">
          If you did not request this verification, please safely ignore this email.
        </p>
      </div>
    </div>
  `;
}

const TEXT_CONTENT = (otp: string) =>
  `Your PinkCityHomes verification code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`;

const SUBJECT = "PinkCityHomes - Email Verification OTP";

async function sendViaGmailSmtp(
  to: string,
  otp: string,
): Promise<{ success: boolean; messageId?: string; provider: "gmail-smtp" }> {
  const transporter = getSmtpTransporter();
  if (!transporter) {
    throw new HttpError(502, "Unable to send verification email. Please try again.");
  }

  const info = await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject: SUBJECT,
    text: TEXT_CONTENT(otp),
    html: getVerificationHtml(otp),
  });

  const accepted = Array.isArray(info.accepted) ? info.accepted.length > 0 : Boolean(info.accepted);
  if (!accepted) {
    console.error(`[EMAIL ERROR] Gmail SMTP rejected recipient ${maskEmail(to)} — accepted=${String(info.accepted)} response=${info.response || ""}`);
    throw new HttpError(502, "Unable to send verification email. Please try again.");
  }

  return { success: true, messageId: info.messageId, provider: "gmail-smtp" };
}

async function sendViaResend(
  to: string,
  otp: string,
): Promise<{ success: boolean; messageId?: string; provider: "resend" }> {
  const resend = getResendClient();
  if (!resend) {
    throw new HttpError(502, "Unable to send verification email. Please try again.");
  }

  const recipientEmail = to;
  const { data, error } = await resend.emails.send({
    from: env.emailFrom,
    to: [recipientEmail],
    subject: SUBJECT,
    text: TEXT_CONTENT(otp),
    html: getVerificationHtml(otp),
  });

  if (!error && data?.id) {
    return { success: true, messageId: data.id, provider: "resend" };
  }

  const errorMsg = error?.message || "Unknown Resend API error";
  console.error(`[EMAIL ERROR] Resend API rejected request for ${maskEmail(to)}: ${errorMsg}`);
  throw new HttpError(502, "Unable to send verification email. Please try again.");
}

export async function sendVerificationEmail(
  to: string,
  otp: string,
): Promise<{ success: boolean; messageId?: string; provider?: string }> {
  const masked = maskEmail(to);
  const provider = (env.emailProvider === "resend" || env.emailProvider === "gmail")
    ? env.emailProvider
    : env.smtpUser && env.smtpPass
      ? "gmail"
      : env.emailApiKey
        ? "resend"
        : "gmail";

  console.log(`[EMAIL] Selected provider=${provider} — dispatching OTP to ${masked}...`);

  if (provider === "gmail") {
    try {
      return await sendViaGmailSmtp(to, otp);
    } catch (errGmail: any) {
      console.warn(`[EMAIL WARN] Gmail SMTP failed for ${masked}: ${errGmail?.message || errGmail}`);
      if (env.emailApiKey) {
        console.warn(`[EMAIL WARN] Falling back to Resend for ${masked}...`);
        return await sendViaResend(to, otp);
      }
      throw errGmail instanceof HttpError
        ? errGmail
        : new HttpError(502, "Unable to send verification email. Please try again.");
    }
  }

  // Provider === "resend" (or any other string -> treat as resend)
  try {
    return await sendViaResend(to, otp);
  } catch (errResend: any) {
    console.warn(`[EMAIL WARN] Resend failed for ${masked}: ${errResend?.message || errResend}`);
    if (env.smtpUser && env.smtpPass) {
      console.warn(`[EMAIL WARN] Falling back to Gmail SMTP for ${masked}...`);
      return await sendViaGmailSmtp(to, otp);
    }
    throw errResend instanceof HttpError
      ? errResend
      : new HttpError(502, "Unable to send verification email. Please try again.");
  }
}

export const sendOTPEmail = sendVerificationEmail;

export function checkEmailServiceConfigured(): boolean {
  return Boolean(
    (env.smtpUser && env.smtpPass) || env.emailApiKey,
  );
}

