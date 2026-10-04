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
  // Supports a comma-separated list of allowed frontend origins
  clientOrigin: (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL ?? "",
  superadminEmail: process.env.SUPERADMIN_EMAIL ?? "lokeshkankarwal456@gmail.com",
  superadminPassword: process.env.SUPERADMIN_PASSWORD ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "PinkCityHomes <noreply@pinkcityhomes.com>",
  emailVerificationUrl: process.env.EMAIL_VERIFICATION_URL ?? "http://localhost:5173",
  // Rate limiting (configurable via env)
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 30),
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10),
  registrationRateLimitMax: Number(process.env.REGISTRATION_RATE_LIMIT_MAX ?? 5),
  verificationRateLimitMax: Number(process.env.VERIFICATION_RATE_LIMIT_MAX ?? 3),
  passwordResetRateLimitMax: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX ?? 5),
};
