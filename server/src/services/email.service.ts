import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/error.js";

let cachedTransporter: nodemailer.Transporter | null = null;

function getSenderAddress(): string {
  // If explicitly specified in env and not a placeholder, use it
  if (env.smtpFrom && !env.smtpFrom.includes("noreply@pinkcityhomes.com")) {
    return env.smtpFrom;
  }
  // For Gmail SMTP, sending from the authenticated user address avoids alias rejection
  if (env.smtpUser) {
    return `PinkCityHomes <${env.smtpUser}>`;
  }
  return env.smtpFrom || "PinkCityHomes <noreply@pinkcityhomes.com>";
}

export function getEmailTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  if (env.smtpHost && env.smtpUser && env.smtpPass) {
    const isPort465 = Number(env.smtpPort) === 465;
    cachedTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: Number(env.smtpPort) || 587,
      // false for 587 (uses STARTTLS), true only for 465 (SMTPS)
      secure: isPort465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
      tls: {
        rejectUnauthorized: true,
      },
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    return cachedTransporter;
  }

  return null;
}

export async function verifySmtpConnection(): Promise<boolean> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log("[EMAIL] SMTP credentials not set. Running in development console mode for OTP.");
    return false;
  }

  try {
    console.log(`[EMAIL] Verifying SMTP connection to ${env.smtpHost}:${env.smtpPort} (user: ${env.smtpUser})...`);
    await transporter.verify();
    console.log("[EMAIL] SMTP server connection verified successfully. Ready to send emails.");
    return true;
  } catch (err: any) {
    console.warn("[EMAIL WARN] SMTP connection verification failed during startup:");
    console.warn(`[EMAIL ERROR] code: ${err.code ?? "UNKNOWN"}`);
    if (err.responseCode) console.warn(`[EMAIL ERROR] responseCode: ${err.responseCode}`);
    if (err.response) console.warn(`[EMAIL ERROR] response: ${err.response}`);
    console.warn(`[EMAIL ERROR] message: ${err.message ?? "Unknown SMTP error"}`);
    console.warn("[EMAIL WARN] Application will continue running. Please verify your Gmail App Password on Render.");
    return false;
  }
}

export async function sendVerificationEmail(
  to: string,
  otp: string,
): Promise<{ success: boolean; messageId?: string; isDevFallback?: boolean }> {
  const transporter = getEmailTransporter();
  const from = getSenderAddress();

  console.log("[EMAIL] Attempting to send verification email");
  console.log(`[EMAIL] SMTP host: ${env.smtpHost || "none (dev mode)"}`);
  console.log(`[EMAIL] SMTP user: ${env.smtpUser || "none"}`);
  console.log(`[EMAIL] Sending verification email to: ${to}`);

  if (!transporter) {
    // Development fallback when no SMTP credentials are provided
    if (env.nodeEnv !== "production") {
      console.log(`\n========================================`);
      console.log(`[PinkCityHomes DEV OTP] Recipient: ${to}`);
      console.log(`========================================\n`);
      return { success: true, isDevFallback: true };
    }
    throw new HttpError(500, "Email delivery service is not configured on this server.");
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Your PinkCityHomes Verification Code",
      text: `Your PinkCityHomes verification code is ${otp}. It expires in 15 minutes. Do not share this code with anyone.`,
      html: `
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
      `,
    });

    console.log(`[EMAIL] Verification email sent successfully (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`);
    console.error(`[EMAIL ERROR] code: ${err.code ?? "UNKNOWN"}`);
    if (err.responseCode) console.error(`[EMAIL ERROR] responseCode: ${err.responseCode}`);
    if (err.response) console.error(`[EMAIL ERROR] response: ${err.response}`);
    console.error(`[EMAIL ERROR] message: ${err.message ?? "Unknown SMTP error"}`);

    if (env.nodeEnv === "development") {
      console.log(`\n========================================`);
      console.log(`[PinkCityHomes DEV OTP Fallback] Recipient: ${to}`);
      console.log(`========================================\n`);
    }

    throw new HttpError(
      502,
      "Unable to send verification email. Please check your email address or try again in a few moments.",
    );
  }
}

