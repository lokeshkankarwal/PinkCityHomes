import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/routes.js";
import { propertiesRouter } from "./modules/properties/routes.js";
import { favouritesRouter } from "./modules/favourites/routes.js";
import { cartRouter } from "./modules/cart/routes.js";
import { clientsRouter } from "./modules/clients/routes.js";
import { interactionsRouter } from "./modules/interactions/routes.js";
import { visitsRouter } from "./modules/visits/routes.js";
import { ordersRouter } from "./modules/orders/routes.js";
import { adminRouter } from "./modules/admin/routes.js";
import { sellersRouter } from "./modules/sellers/routes.js";
import { projectsRouter } from "./modules/projects/routes.js";
import { ensureUploadDir } from "./services/storage.service.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// ── Rate limiters ─────────────────────────────────────────────────────────────

/** Global API limiter — applied to all routes */
const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/** General auth limiter — /api/auth/* */
const authLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication requests, please try again later." },
});

/** Strict login limiter — brute-force protection */
const loginLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  limit: env.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait before trying again." },
});

/** Registration limiter */
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: env.registrationRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});

/** OTP resend limiter — very strict */
const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: env.verificationRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification requests. Please wait before requesting again." },
});

/** Password reset limiter */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: env.passwordResetRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please wait before trying again." },
});

export { loginLimiter, registrationLimiter, verificationLimiter, passwordResetLimiter };

export function createApp() {
  ensureUploadDir();
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(globalLimiter);

  app.use("/uploads", express.static(path.resolve(here, "../uploads")));
  app.use("/defaults", express.static(path.resolve(here, "../public/defaults")));

  app.get("/api/health", (_req, res) => res.json({ ok: true, app: "PinkCityHomes" }));

  // Apply stricter per-route limiters before mounting auth router
  app.use("/api/auth/login", loginLimiter);
  app.use("/api/auth/register", registrationLimiter);
  app.use("/api/auth/resend-otp", verificationLimiter);
  app.use("/api/auth/verify", verificationLimiter);
  app.use("/api/auth/verify-email", verificationLimiter);

  // Auth routes — apply general auth limiter
  app.use("/api/auth", authLimiter, authRouter);

  app.use("/api/properties", propertiesRouter);
  app.use("/api/favourites", favouritesRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/interactions", interactionsRouter);
  app.use("/api/visits", visitsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/seller", sellersRouter);
  app.use("/api/projects", projectsRouter);

  app.use(errorHandler);
  return app;
}
