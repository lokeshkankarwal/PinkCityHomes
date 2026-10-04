import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "node:fs";
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

/** OTP verification limiter */
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.verificationRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts. Please wait before trying again." },
});

/** OTP resend limiter */
const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.resendRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP resend requests. Please wait a few minutes before trying again." },
});

/** Password reset limiter */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: env.passwordResetRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please wait before trying again." },
});

export { loginLimiter, registrationLimiter, verificationLimiter, resendLimiter, passwordResetLimiter };

export function createApp() {
  ensureUploadDir();
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, "");
        if (
          env.clientOrigin.includes("*") ||
          env.clientOrigin.includes(cleanOrigin) ||
          env.clientOrigin.includes(origin) ||
          (env.nodeEnv !== "production" && (cleanOrigin.includes("localhost") || cleanOrigin.includes("127.0.0.1")))
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
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
  app.use("/api/auth/resend-otp", resendLimiter);
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
  app.use("/api/sellers", sellersRouter);
  app.use("/api/projects", projectsRouter);

  // Serve production client build when available (unified single-service deployment)
  const clientDistCandidates = [
    path.resolve(process.cwd(), "client/dist"),
    path.resolve(process.cwd(), "../client/dist"),
    path.resolve(here, "../../client/dist"),
    path.resolve(here, "../../../client/dist"),
  ];
  const clientDist = clientDistCandidates.find((p) => fs.existsSync(p));
  if (clientDist) {
    app.use(
      express.static(clientDist, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("sw.js")) {
            res.setHeader("Service-Worker-Allowed", "/");
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          } else if (filePath.endsWith("manifest.json") || filePath.endsWith("manifest.webmanifest")) {
            res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
          }
        },
      }),
    );
    app.use((req, res, next) => {
      if (
        req.method !== "GET" ||
        req.path.startsWith("/api") ||
        req.path.startsWith("/uploads") ||
        req.path.startsWith("/defaults")
      ) {
        return next();
      }
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
}
