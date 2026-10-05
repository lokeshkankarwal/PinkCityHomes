import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/error.js";

let gmailTransporter: Transporter | null = null;
let resendClient: Resend | null = null;

function getGmailTransporter(): Transporter | null {
  if (gmailTransporter) return gmailTransporter;
  if (env.smtpUser && env.smtpPass) {
    gmailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    return gmailTransporter;
  }
  return null;
}

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  if (env.emailApiKey) {
    resendClient = new Resend(env.emailApiKey);
    return resendClient;
  }
  return null;
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
      <p style="color:#64748b;font-size:13px;line-height:1.5;">This code expires in <strong style="color:#0b1d35;">15 minutes</strong>. For your security, never share this code with anyone.</p>
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f1f5f9;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">
          If you did not request this verification, please safely ignore this email.
        </p>
      </div>
    </div>
  `;
}

export async function sendVerificationEmail(
  to: string,
  otp: string,
): Promise<{ success: boolean; messageId?: string; isDevFallback?: boolean; provider?: string }> {
  const masked = maskEmail(to);
  const gmail = getGmailTransporter();
  const resend = getResendClient();

  console.log(`[EMAIL] Attempting to dispatch verification code to ${masked}...`);

  // ── Strategy 1: Gmail SMTP via Nodemailer ──────────────────────────────
  if (gmail) {
    try {
      console.log(`[EMAIL] Sending via Gmail SMTP (${env.smtpUser})...`);
      const info = await gmail.sendMail({
        from: env.smtpFrom,
        to,
        subject: "Your PinkCityHomes Verification Code",
        text: `Your PinkCityHomes verification code is ${otp}. It expires in 15 minutes. Do not share this code with anyone.`,
        html: getVerificationHtml(otp),
      });

      console.log(`[EMAIL] Verification email sent successfully via Gmail (messageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: "gmail" };
    } catch (err: any) {
      console.warn(`[EMAIL WARN] Gmail SMTP failed: ${err.message ?? "Unknown SMTP error"}`);
      // Fall through to Resend or Dev Fallback
    }
  }

  // ── Strategy 2: Resend HTTPS REST API ──────────────────────────────────
  if (resend) {
    try {
      console.log(`[EMAIL] Sending via Resend HTTPS API...`);
      const { data, error } = await resend.emails.send({
        from: env.emailFrom,
        to: [to],
        subject: "Your PinkCityHomes Verification Code",
        text: `Your PinkCityHomes verification code is ${otp}. It expires in 15 minutes. Do not share this code with anyone.`,
        html: getVerificationHtml(otp),
      });

      if (!error && data?.id) {
        console.log(`[EMAIL] Verification email sent successfully via Resend (id: ${data.id})`);
        return { success: true, messageId: data.id, provider: "resend" };
      }
      console.warn(`[EMAIL WARN] Resend API failed: ${error?.message || "Unknown error"}`);
    } catch (err: any) {
      console.warn(`[EMAIL WARN] Resend API failed: ${err.message}`);
    }
  }

  // ── Strategy 3: Development / Testing Fallback ─────────────────────────
  if (env.nodeEnv !== "production") {
    console.log(`[EMAIL] Development mode: Simulated verification email to ${masked}.`);
    return { success: true, isDevFallback: true, provider: "dev" };
  }

  throw new HttpError(
    502,
    "Unable to deliver verification email. Please check your email settings or try again.",
  );
}

export const sendOTPEmail = sendVerificationEmail;

export function checkEmailServiceConfigured(): boolean {
  return Boolean((env.smtpUser && env.smtpPass) || env.emailApiKey);
}
