import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { getPropertiesCollection, formatMongoProperty } from "../../config/mongo.js";

export async function mine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const orders = await prisma.order.findMany({
    where: { customerId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  const propIds = orders.map((o) => o.propertyId);
  const col = getPropertiesCollection();
  const docs = await col.find({ propertyId: { $in: propIds } }).toArray();
  const propMap = new Map(docs.map((p) => [p.propertyId, formatMongoProperty(p)]));

  res.json({
    results: orders.map((o) => ({
      ...o,
      property: propMap.get(o.propertyId) || null,
    })),
  });
}

export async function all(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    include: { customer: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const propIds = orders.map((o) => o.propertyId);
  const col = getPropertiesCollection();
  const docs = await col.find({ propertyId: { $in: propIds } }).toArray();
  const propMap = new Map(docs.map((p) => [p.propertyId, formatMongoProperty(p)]));

  res.json({
    results: orders.map((o) => ({
      ...o,
      property: propMap.get(o.propertyId) || null,
    })),
  });
}

