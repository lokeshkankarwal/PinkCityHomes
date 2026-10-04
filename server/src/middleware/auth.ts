import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma, type Role } from "../config/prisma.js";
import { HttpError } from "./error.js";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, env.jwtSecret, { expiresIn: "7d" });
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readToken(req);
    if (token) req.user = await hydrate(token);
  } catch {
    /* ignore */
  }
  next();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readToken(req);
    if (!token) throw new HttpError(401, "Authentication required");
    req.user = await hydrate(token);
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Forbidden"));
    next();
  };
}

function readToken(req: Request) {
  const cookie = req.cookies?.token as string | undefined;
  const header = req.headers.authorization;
  if (cookie) return cookie;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return undefined;
}

async function hydrate(token: string): Promise<AuthUser> {
  const payload = jwt.verify(token, env.jwtSecret) as AuthUser;
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { sellerProfile: true },
  });
  if (!user) throw new HttpError(401, "Invalid session");
  if ((user as any).isDisabled) {
    throw new HttpError(403, "Your account has been disabled by PinkCityHomes administration.");
  }
  if (user.role === "SELLER") {
    const sp = user.sellerProfile;
    if (!sp || sp.status !== "APPROVED" || (sp as any).isDisabled || sp.status === "DISABLED" || sp.status === "SUSPENDED") {
      throw new HttpError(403, "Your seller account has been disabled by PinkCityHomes administration.");
    }
  }
  return { id: user.id, email: user.email, role: user.role, name: user.name };
}
