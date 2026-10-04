import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { getPropertiesCollection, formatMongoProperty } from "../../config/mongo.js";

async function audit(req: Request, action: string, entityType: string, entityId?: string, metadata?: unknown) {
  await prisma.auditLog.create({
    data: {
      actorId: req.user?.id,
      action,
      entityType,
      entityId,
      metadata: metadata as object | undefined,
    },
  });
}

export async function dashboard(_req: Request, res: Response) {
  const col = getPropertiesCollection();
  const [sellers, customers, properties, sold, pending, orders] = await Promise.all([
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    col.countDocuments({}),
    col.countDocuments({ status: "SOLD" }),
    prisma.sellerProfile.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.order.count(),
  ]);
  res.json({ sellers, customers, properties, sold, pendingSellerApprovals: pending, orders });
}

export async function sellerRequests(_req: Request, res: Response) {
  const requests = await prisma.sellerProfile.findMany({
    where: { status: { in: ["PENDING_APPROVAL", "PENDING_VERIFICATION"] } },
    include: { user: { select: { id: true, email: true, name: true, phone: true, createdAt: true, emailVerifiedAt: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json({ results: requests });
}

export async function sellers(_req: Request, res: Response) {
  const results = await prisma.sellerProfile.findMany({
    include: { user: { select: { id: true, email: true, name: true, phone: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ results });
}

export async function users(_req: Request, res: Response) {
  const results = await prisma.user.findMany({
    where: { role: { in: ["CUSTOMER", "SELLER"] } },
    select: { id: true, email: true, name: true, role: true, phone: true, createdAt: true, emailVerifiedAt: true, sellerProfile: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ results });
}

export async function properties(_req: Request, res: Response) {
  const col = getPropertiesCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();

  const sellerIds = [...new Set(docs.map((d) => d.sellerId))];
  const sellersList = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, email: true, name: true },
  });
  const sellerMap = new Map(sellersList.map((s) => [s.id, s]));

  const results = docs.map((doc) => ({
    ...formatMongoProperty(doc),
    seller: sellerMap.get(doc.sellerId),
  }));

  res.json({ results });
}

export async function reviewSeller(req: Request, res: Response) {
  const id = String(req.params.id);
  const { action, reason } = z.object({ action: z.enum(["APPROVE", "REJECT", "SUSPEND"]), reason: z.string().optional() }).parse(req.body);
  const profile = await prisma.sellerProfile.findFirst({
    where: { OR: [{ id }, { userId: id }] },
  });
  if (!profile) throw new HttpError(404, "Seller not found");
  const status = action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "SUSPENDED";
  const updated = await prisma.sellerProfile.update({
    where: { id: profile.id },
    data: {
      status,
      rejectionReason: reason,
      approvedAt: action === "APPROVE" ? new Date() : profile.approvedAt,
      approvedById: req.user?.id,
    },
  });
  await audit(req, `SELLER_${action}`, "SellerProfile", profile.id, { reason });
  res.json(updated);
}

export async function markSold(req: Request, res: Response) {
  if (req.user?.role !== "SUPERADMIN") throw new HttpError(403, "Forbidden");
  const id = String(req.params.id);
  const { customerId } = z.object({ customerId: z.string().optional() }).parse(req.body ?? {});
  const col = getPropertiesCollection();

  const property = await col.findOne({ propertyId: id });
  if (!property) throw new HttpError(404, "Property not found");
  if (property.status === "SOLD") throw new HttpError(400, "Already sold");

  await col.updateOne({ propertyId: id }, { $set: { status: "SOLD", updatedAt: new Date() } });
  await prisma.cartItem.deleteMany({ where: { propertyId: property.propertyId } });

  const order = await prisma.order.create({
    data: {
      propertyId: property.propertyId,
      customerId: customerId ?? null,
      status: "SOLD",
      soldPrice: property.price,
    },
  });

  await audit(req, "PROPERTY_SOLD", "Property", property.propertyId, { orderId: order.id });
  const updated = await col.findOne({ propertyId: id });
  res.json({ property: formatMongoProperty(updated!), order });
}

export async function auditLogs(_req: Request, res: Response) {
  const results = await prisma.auditLog.findMany({
    include: { actor: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ results });
}

export async function sellerDashboard(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const sellerId = req.user.id;
  const col = getPropertiesCollection();

  const [totalProperties, activeProperties, totalClients, visits, high, medium, low, propDocs, upcoming, recent] =
    await Promise.all([
      col.countDocuments({ sellerId }),
      col.countDocuments({ sellerId, status: "ACTIVE" }),
      prisma.client.count({ where: { sellerId } }),
      prisma.propertyVisit.count({ where: { sellerId } }),
      prisma.client.count({ where: { sellerId, interestLevel: "HIGH" } }),
      prisma.client.count({ where: { sellerId, interestLevel: "MEDIUM" } }),
      prisma.client.count({ where: { sellerId, interestLevel: "LOW" } }),
      col.find({ sellerId }).toArray(),
      prisma.propertyVisit.findMany({
        where: { sellerId, scheduledAt: { gte: new Date() }, status: "SCHEDULED" },
        include: { client: true },
        orderBy: { scheduledAt: "asc" },
        take: 10,
      }),
      prisma.clientInteraction.findMany({
        where: { sellerId },
        include: { client: true },
        orderBy: { timestamp: "desc" },
        take: 15,
      }),
    ]);
  const [allInterests, allVisits] = await Promise.all([
    prisma.clientPropertyInterest.findMany({ where: { sellerId } }),
    prisma.propertyVisit.findMany({ where: { sellerId } }),
  ]);

  const interestsByProp = new Map<string, typeof allInterests>();
  for (const item of allInterests) {
    const list = interestsByProp.get(item.propertyId) || [];
    list.push(item);
    interestsByProp.set(item.propertyId, list);
  }

  const visitsByProp = new Map<string, typeof allVisits>();
  for (const item of allVisits) {
    const list = visitsByProp.get(item.propertyId) || [];
    list.push(item);
    visitsByProp.set(item.propertyId, list);
  }

  res.json({
    stats: {
      totalProperties,
      activeProperties,
      totalClients,
      totalLeads: allInterests.length,
      totalVisits: visits,
      highInterest: high,
      mediumInterest: medium,
      lowInterest: low,
    },
    properties: propDocs.map((p) => {
      const pInterests = interestsByProp.get(p.propertyId) || [];
      const pVisits = visitsByProp.get(p.propertyId) || [];
      return {
        id: p.propertyId,
        title: p.title,
        views: p.views || 0,
        leads: pInterests.length,
        visits: pVisits.length,
        interestedClients: pInterests.filter((i) => i.interestLevel !== "LOW").length,
        status: p.status,
      };
    }),
    clients: {
      high: await prisma.client.findMany({ where: { sellerId, interestLevel: "HIGH" } }),
      medium: await prisma.client.findMany({ where: { sellerId, interestLevel: "MEDIUM" } }),
      low: await prisma.client.findMany({ where: { sellerId, interestLevel: "LOW" } }),
    },
    upcomingVisits: upcoming,
    recentInteractions: recent,
  });
}
