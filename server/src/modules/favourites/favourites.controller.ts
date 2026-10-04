import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { getPropertiesCollection, formatMongoProperty } from "../../config/mongo.js";

export async function list(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const favs = await prisma.favourite.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  const propIds = favs.map((f) => f.propertyId);
  const col = getPropertiesCollection();
  const propDocs = await col.find({ propertyId: { $in: propIds } }).toArray();
  const propMap = new Map(propDocs.map((p) => [p.propertyId, formatMongoProperty(p)]));

  const items = favs.map((f) => ({
    ...f,
    property: propMap.get(f.propertyId) || null,
  }));

  res.json({ count: items.length, results: items });
}

export async function add(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const body = z.object({ propertyId: z.string() }).parse(req.body);
  const col = getPropertiesCollection();
  const p = await col.findOne({ propertyId: body.propertyId });
  if (!p || p.status === "SOLD") throw new HttpError(400, "Property is not available");

  const fav = await prisma.favourite.upsert({
    where: { userId_propertyId: { userId: req.user.id, propertyId: body.propertyId } },
    update: {},
    create: { userId: req.user.id, propertyId: body.propertyId },
  });
  res.status(201).json(fav);
}

export async function remove(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const id = String(req.params.id);
  await prisma.favourite.deleteMany({
    where: {
      userId: req.user.id,
      OR: [{ id }, { propertyId: id }],
    },
  });
  res.json({ ok: true });
}

