import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { getPropertiesCollection, formatMongoProperty } from "../../config/mongo.js";

export async function list(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const items = await prisma.clientInteraction.findMany({
    where: { sellerId: req.user.id },
    include: { client: true },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  const propIds = items.map((i) => i.propertyId).filter(Boolean) as string[];
  const col = getPropertiesCollection();
  const docs = await col.find({ propertyId: { $in: propIds } }).toArray();
  const propMap = new Map(docs.map((p) => [p.propertyId, formatMongoProperty(p)]));

  const results = items.map((i) => ({
    ...i,
    property: i.propertyId ? propMap.get(i.propertyId) || null : null,
  }));

  res.json({ results });
}

export async function create(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const body = z
    .object({
      clientId: z.string(),
      propertyId: z.string().optional(),
      type: z.enum(["CALL", "VISIT", "NOTE", "FOLLOW_UP", "WHATSAPP", "EMAIL"]),
      notes: z.string().min(1),
      timestamp: z.string().datetime().optional(),
    })
    .parse(req.body);
  const client = await prisma.client.findFirst({ where: { id: body.clientId, sellerId: req.user.id } });
  if (!client) throw new HttpError(404, "Client not found");

  if (body.propertyId) {
    const col = getPropertiesCollection();
    const p = await col.findOne({ propertyId: body.propertyId, sellerId: req.user.id });
    if (!p) throw new HttpError(404, "Property not found");
  }

  const rec = await prisma.clientInteraction.create({
    data: {
      clientId: client.id,
      propertyId: body.propertyId,
      sellerId: req.user.id,
      type: body.type,
      notes: body.notes,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    },
  });
  res.status(201).json(rec);
}

