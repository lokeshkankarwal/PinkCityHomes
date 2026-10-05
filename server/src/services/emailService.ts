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

function extractEmailAddress(raw: string): string {
  const m = raw.match(/<([^>]+)>/);
  return (m ? m[1] : raw).trim().toLowerCase();
}

function isResendAllowedFrom(fromRaw: string): boolean {
  const addr = extractEmailAddress(fromRaw);
  const domain = addr.split("@")[1] || "";
  return domain !== "gmail.com" && domain !== "outlook.com" && domain !== "yahoo.com" && domain !== "hotmail.com";
}

function getResendFromAddress(): { from: string; wasSanitized: boolean } {
  const configuredFrom = env.emailFrom;
  if (isResendAllowedFrom(configuredFrom)) {
    return { from: configuredFrom, wasSanitized: false };
  }
  console.warn(
    `[EMAIL WARN] Resend sender "${configuredFrom}" uses a non-verifiable domain (gmail/outlook/yahoo). Automatically switching sender to "onboarding@resend.dev". FREE TIER LIMITATION: onboarding@resend.dev only DELIVERS TO THE EMAIL YOU SIGNED UP AT RESEND.COM WITH — all other recipients are silently dropped by Resend on the free plan. To send to arbitrary users, add & verify a paid custom domain at resend.com/domains (e.g., pinkcityhomes.com).`,
  );
  return { from: "PinkCityHomes <onboarding@resend.dev>", wasSanitized: true };
}

const SMTP_CANDIDATES: Array<{ port: number; secure: boolean }> = [
  { port: 2525, secure: false },
  { port: 587, secure: false },
  { port: 465, secure: true },
];

async function tryCreateSmtpTransporter(): Promise<Transporter | null> {
  if (smtpTransporter) return smtpTransporter;
  if (!env.smtpUser || !env.smtpPass) return null;

  let lastErr: unknown = null;
  for (const { port, secure } of SMTP_CANDIDATES) {
    try {
      const t = nodemailer.createTransport({
        host: env.smtpHost,
        port,
        secure,
        requireTLS: port !== 465,
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 12000,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      });
      await t.verify();
      smtpTransporter = t;
      console.log(`[EMAIL] Gmail SMTP connected on port ${port} (secure=${String(secure)})`);
      return smtpTransporter;
    } catch (err) {
      lastErr = err;
      console.warn(`[EMAIL WARN] Gmail SMTP port ${port} failed: ${(err as Error)?.message || String(err)}`);
    }
  }
  console.error(`[EMAIL ERROR] All Gmail SMTP ports exhausted. Last error: ${(lastErr as Error)?.message || String(lastErr)}`);
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
  const transporter = await tryCreateSmtpTransporter();
  if (!transporter) {
    throw new HttpError(502, "Unable to send verification email (SMTP unavailable). Please try Resend Code or use a different email.");
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
    throw new HttpError(502, "Unable to send verification email (no Resend API key configured). Please try again.");
  }

  const { from: effectiveFrom, wasSanitized } = getResendFromAddress();
  if (wasSanitized) {
    console.warn(
      `[EMAIL WARN] Resend FREE tier delivery restriction active for ${maskEmail(to)}. If ${maskEmail(to)} is NOT your Resend.com account email, this message will be ACCEPTED by Resend API with status 200 but SILENTLY NOT DELIVERED (onboarding@resend.dev constraint). If delivery to ${maskEmail(to)} is required, verify a custom paid domain at resend.com/domains.`,
    );
  }

  const recipientEmail = to;
  const { data, error } = await resend.emails.send({
    from: effectiveFrom,
    to: [recipientEmail],
    subject: SUBJECT,
    text: TEXT_CONTENT(otp),
    html: getVerificationHtml(otp),
  });

  if (!error && data?.id) {
    console.log(
      `[EMAIL RESEND] Accepted id=${data.id} to=${maskEmail(to)} from=${effectiveFrom}. NOTE: 202/200 OK from Resend with onboarding@resend.dev DOES NOT GUARANTEE DELIVERY if recipient != Resend account owner email.`,
    );
    return { success: true, messageId: data.id, provider: "resend" };
  }

  const errorMsg = error?.message || "Unknown Resend API error";
  console.error(`[EMAIL ERROR] Resend API rejected request for ${maskEmail(to)} (from=${effectiveFrom}): ${errorMsg}`);
  if (
    errorMsg.toLowerCase().includes("from") ||
    errorMsg.toLowerCase().includes("domain") ||
    errorMsg.toLowerCase().includes("verified") ||
    (typeof (error as any)?.statusCode === "number" && (error as any).statusCode === 403)
  ) {
    console.error(
      `[EMAIL HINT] Resend 403 Domain not verified. FIX: Either (A) verify a custom paid domain at resend.com/domains and update EMAIL_FROM, or (B) for localhost-only testing with Gmail sender, switch EMAIL_PROVIDER=gmail and ensure SMTP ports are not blocked by your network.`,
    );
  }
  throw new HttpError(502, "Unable to send verification email. Please try again.");
}

export async function dispatchVerificationEmail(
  to: string,
  plaintextOtp: string,
): Promise<{ success: boolean; messageId?: string; provider?: string; warning?: string }> {
  const masked = maskEmail(to);
  const isProduction = env.nodeEnv === "production";

  console.log(`[EMAIL] ─── OTP for ${masked}:  CODE=${plaintextOtp}  (expires in 10 min) ───`);

  const hasSmtpCreds = Boolean(env.smtpUser && env.smtpPass);
  const hasResendKey = Boolean(env.emailApiKey);

  let primary: "resend" | "gmail";
  if (isProduction) {
    primary = hasResendKey ? "resend" : hasSmtpCreds ? "gmail" : "resend";
  } else {
    primary = (env.emailProvider === "resend" || env.emailProvider === "gmail")
      ? env.emailProvider
      : hasResendKey ? "resend" : hasSmtpCreds ? "gmail" : "gmail";
  }

  console.log(`[EMAIL] Using provider order: primary=${primary} (production=${isProduction} — ${isProduction && hasResendKey ? "Resend HTTPS preferred because Render blocks SMTP ports" : isProduction ? "Gmail SMTP preferred" : "local-dev provider order"})`);

  let lastErr: unknown = null;
  const order: Array<"gmail" | "resend"> = primary === "gmail"
    ? ["gmail", "resend"]
    : ["resend", "gmail"];

  for (const provider of order) {
    if (provider === "gmail" && !hasSmtpCreds) continue;
    if (provider === "resend" && !hasResendKey) continue;
    try {
      const r = provider === "gmail"
        ? await sendViaGmailSmtp(to, plaintextOtp)
        : await sendViaResend(to, plaintextOtp);
      console.log(`[EMAIL OK] Dispatched via ${r.provider} → ${masked} (messageId=${r.messageId || "n/a"})`);
      return r;
    } catch (err) {
      lastErr = err;
      console.warn(`[EMAIL WARN] ${provider.toUpperCase()} failed for ${masked}: ${(err as Error)?.message || String(err)}`);
    }
  }

  console.error(`[EMAIL FATAL] All providers failed for ${masked}. LAST ERROR=${(lastErr as Error)?.message || String(lastErr)}`);
  console.error(`[EMAIL FATAL] OTP code was still saved in DB. User can still verify IF they get the code via Resend Code retries or you share it from logs.`);

  const warning = env.nodeEnv === "production"
    ? "Email delivery delayed. If the code doesn't arrive in 1 minute, please click 'Resend Code' or check your Spam folder."
    : "Email dispatch had issues. Try Resend Code; or check server logs for the actual OTP code printed above.";

  return { success: false, warning };
}

export async function sendVerificationEmail(
  to: string,
  otp: string,
): Promise<{ success: boolean; messageId?: string; provider?: string }> {
  const r = await dispatchVerificationEmail(to, otp);
  if (!r.success) {
    throw new HttpError(502, r.warning || "Unable to send verification email. Please try again.");
  }
  return r;
}

export const sendOTPEmail = sendVerificationEmail;

export function checkEmailServiceConfigured(): boolean {
  return Boolean(
    (env.smtpUser && env.smtpPass) || env.emailApiKey,
  );
}
