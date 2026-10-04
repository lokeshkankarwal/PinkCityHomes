import { Resend } from "resend";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/error.js";

let resendClient: Resend | null = null;

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
): Promise<{ success: boolean; messageId?: string; isDevFallback?: boolean }> {
  const masked = maskEmail(to);
  const client = getResendClient();

  if (!client) {
    if (env.nodeEnv !== "production") {
      console.log(`[EMAIL] Running in development mode without EMAIL_API_KEY. Simulated verification email to ${masked}.`);
      return { success: true, isDevFallback: true };
    }
    console.error("[EMAIL ERROR] EMAIL_API_KEY / RESEND_API_KEY is not configured in production environment.");
    throw new HttpError(500, "Email delivery service is not configured on this server.");
  }

  console.log(`[EMAIL] Sending verification email to ${masked}`);

  try {
    const { data, error } = await client.emails.send({
      from: env.emailFrom,
      to: [to],
      subject: "Your PinkCityHomes Verification Code",
      text: `Your PinkCityHomes verification code is ${otp}. It expires in 15 minutes. Do not share this code with anyone.`,
      html: getVerificationHtml(otp),
    });

    if (error) {
      console.error(`[EMAIL ERROR] Email provider request failed: ${error.name || "Error"} - ${error.message}`);
      throw new HttpError(
        502,
        "Unable to send verification email. Please check your email address or try again in a few moments.",
      );
    }

    console.log(`[EMAIL] Verification email sent successfully (id: ${data?.id ?? "unknown"})`);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    if (err instanceof HttpError) throw err;

    console.error(`[EMAIL ERROR] Email provider request failed: ${err?.message || "Unknown error"}`);
    throw new HttpError(
      502,
      "Unable to send verification email. Please check your email address or try again in a few moments.",
    );
  }
}

export const sendOTPEmail = sendVerificationEmail;

export function checkEmailServiceConfigured(): boolean {
  return Boolean(env.emailApiKey);
}
