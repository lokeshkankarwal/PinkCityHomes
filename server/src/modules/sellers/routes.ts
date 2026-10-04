import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { sellerDashboard } from "../admin/admin.controller.js";
import { HttpError } from "../../middleware/error.js";
import { prisma } from "../../config/prisma.js";
import { getPropertiesCollection, formatMongoProperty } from "../../config/mongo.js";

export const sellersRouter = Router();

// Seller private routes
sellersRouter.get("/dashboard", requireAuth, requireRole("SELLER"), sellerDashboard);

// Seller attempting to mark SOLD — always 403 (backend enforcement)
sellersRouter.post(
  "/properties/:id/sold",
  requireAuth,
  async (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.role === "SUPERADMIN") return next();
    return next(new HttpError(403, "Forbidden"));
  },
);

sellersRouter.get("/me", requireAuth, requireRole("SELLER"), async (req, res) => {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.user!.id } });
  res.json(profile);
});

// Public Seller Profile & Listings
sellersRouter.get("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const profile = await prisma.sellerProfile.findFirst({
    where: { OR: [{ id }, { userId: id }] },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          isDisabled: true,
        },
      },
    },
  });

  if (!profile) throw new HttpError(404, "Seller not found");
  if (profile.status !== "APPROVED" || profile.isDisabled || profile.user?.isDisabled) {
    throw new HttpError(404, "Seller profile is currently unavailable");
  }

  const col = getPropertiesCollection();
  const docs = await col
    .find({
      sellerId: profile.userId,
      status: "ACTIVE",
      sellerDisabled: { $ne: true },
    })
    .sort({ createdAt: -1 })
    .toArray();

  const properties = docs.map(formatMongoProperty);

  res.json({
    seller: {
      id: profile.id,
      userId: profile.userId,
      name: profile.user?.name,
      companyName: profile.companyName,
      email: profile.user?.email,
      phone: profile.user?.phone,
      avatarUrl: profile.user?.avatarUrl,
      status: profile.status,
      memberSince: profile.user?.createdAt,
      totalProperties: properties.length,
    },
    properties,
    stats: {
      total: properties.length,
      buyCount: properties.filter((p) => p.listingType === "BUY").length,
      rentCount: properties.filter((p) => p.listingType === "RENT").length,
    },
  });
});

