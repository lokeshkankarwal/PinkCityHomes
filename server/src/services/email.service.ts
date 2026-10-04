import nodemailer from "nodemailer";
import { env } from "../config/env.js";

function transport() {
  if (env.smtpHost) {
    return nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    });
  }
  // Development fallback: log OTP to console (no real email sent)
  return nodemailer.createTransport({ jsonTransport: true });
}

export async function sendVerificationEmail(to: string, otp: string) {
  const t = transport();
  const info = await t.sendMail({
    from: env.smtpFrom,
    to,
    subject: "Verify your PinkCityHomes account",
    text: `Your PinkCityHomes verification code is ${otp}. It expires in 15 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1a1a1a;margin-bottom:8px;">PinkCityHomes</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Find your home in Jaipur</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:24px;" />
        <p style="color:#1a1a1a;font-size:15px;">Your email verification code is:</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;text-align:center;margin:16px 0;">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1a1a1a;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;">This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:24px;" />
        <p style="color:#9ca3af;font-size:12px;margin-top:16px;">
          If you did not create a PinkCityHomes account, please ignore this email.
        </p>
      </div>
    `,
  });
  if (!env.smtpHost) {
    // Development: OTP is logged to console (not production)
    console.log(`[email:dev] OTP for ${to}: ${otp}`);
    console.log("[email:dev] json transport", (info as unknown as { message?: string }).message || info.messageId);
  }
  return { otpLogged: !env.smtpHost };
}
