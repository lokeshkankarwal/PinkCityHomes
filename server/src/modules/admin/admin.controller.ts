import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { getPropertiesCollection, formatMongoProperty } from "../../config/mongo.js";
import { deleteLocalFile } from "../../services/storage.service.js";

async function audit(req: Request, action: string, entityType: string, entityId?: string, metadata?: unknown) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        action,
        entityType,
        entityId,
        metadata: metadata as object | undefined,
      },
    });
  } catch (err) {
    console.error("[Audit Error]", err);
  }
}

export async function dashboard(_req: Request, res: Response) {
  const col = getPropertiesCollection();
  const [
    totalSellers,
    approvedSellers,
    customers,
    properties,
    sold,
    pending,
    orders,
    disabledUsers,
    disabledSellers,
    disabledProperties,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.sellerProfile.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    col.countDocuments({}),
    col.countDocuments({ status: "SOLD" }),
    prisma.sellerProfile.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.order.count(),
    prisma.user.count({ where: { isDisabled: true } }),
    prisma.sellerProfile.count({ where: { OR: [{ status: "SUSPENDED" }, { isDisabled: true }] } }),
    col.countDocuments({ $or: [{ status: "INACTIVE" }, { isDisabled: true }] }),
  ]);

  const disabledItems = disabledUsers + disabledSellers + disabledProperties;

  res.json({
    sellers: approvedSellers,
    totalSellers,
    customers,
    properties,
    sold,
    pendingSellerApprovals: pending,
    orders,
    disabledUsers,
    disabledSellers,
    disabledProperties,
    disabledItems,
  });
}

export async function sellerRequests(_req: Request, res: Response) {
  const requests = await prisma.sellerProfile.findMany({
    where: { status: { in: ["PENDING_APPROVAL", "PENDING_VERIFICATION"] } },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
          emailVerifiedAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json({ results: requests });
}

export async function sellers(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  const searchTerm = q.q?.trim().toLowerCase();
  const statusFilter = q.status?.toUpperCase();

  let all = await prisma.sellerProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
          emailVerifiedAt: true,
          isDisabled: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by status if specified
  if (statusFilter && statusFilter !== "ALL") {
    if (statusFilter === "PENDING") {
      all = all.filter((s) => s.status === "PENDING_APPROVAL" || s.status === "PENDING_VERIFICATION");
    } else if (statusFilter === "DISABLED" || statusFilter === "SUSPENDED") {
      all = all.filter((s) => s.status === "SUSPENDED" || (s as any).isDisabled || s.user?.isDisabled);
    } else {
      all = all.filter((s) => s.status === statusFilter);
    }
  }

  // Filter by search term across name, email, phone, companyName, seller ID, userId
  if (searchTerm) {
    all = all.filter((s) => {
      const matchCompany = s.companyName?.toLowerCase().includes(searchTerm);
      const matchName = s.user?.name?.toLowerCase().includes(searchTerm);
      const matchEmail = s.user?.email?.toLowerCase().includes(searchTerm);
      const matchPhone = s.user?.phone?.toLowerCase().includes(searchTerm);
      const matchId = s.id?.toLowerCase().includes(searchTerm);
      const matchUserId = s.userId?.toLowerCase().includes(searchTerm);
      return matchCompany || matchName || matchEmail || matchPhone || matchId || matchUserId;
    });
  }

  // Attach property counts
  const col = getPropertiesCollection();
  const propDocs = await col.find({}, { projection: { sellerId: 1 } }).toArray();
  const countMap = new Map<string, number>();
  for (const doc of propDocs) {
    if (doc.sellerId) {
      countMap.set(doc.sellerId, (countMap.get(doc.sellerId) || 0) + 1);
    }
  }

  const results = all.map((s) => ({
    ...s,
    propertiesCount: countMap.get(s.userId) || 0,
  }));

  res.json({ results, total: results.length });
}

export async function getSellerDetails(req: Request, res: Response) {
  const id = String(req.params.id);
  const profile = await prisma.sellerProfile.findFirst({
    where: { OR: [{ id }, { userId: id }] },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
          emailVerifiedAt: true,
          avatar: true,
          isDisabled: true,
        },
      },
    },
  });

  if (!profile) throw new HttpError(404, "Seller not found");

  const col = getPropertiesCollection();
  const propDocs = await col.find({ sellerId: profile.userId }).sort({ createdAt: -1 }).toArray();

  const totalProperties = propDocs.length;
  const activeProperties = propDocs.filter((p) => p.status === "ACTIVE").length;
  const inactiveProperties = propDocs.filter((p) => p.status === "INACTIVE").length;
  const soldProperties = propDocs.filter((p) => p.status === "SOLD").length;
  const totalViews = propDocs.reduce((acc, p) => acc + (p.views || 0), 0);

  res.json({
    seller: profile,
    user: profile.user,
    stats: {
      totalProperties,
      activeProperties,
      inactiveProperties,
      soldProperties,
      totalViews,
    },
    properties: propDocs.map(formatMongoProperty),
  });
}

export async function reviewSeller(req: Request, res: Response) {
  const id = String(req.params.id);
  const { action, reason } = z
    .object({
      action: z.enum(["APPROVE", "REJECT", "SUSPEND"]),
      reason: z.string().optional(),
    })
    .parse(req.body);

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

  // If suspended, mark properties as sellerDisabled
  const col = getPropertiesCollection();
  if (action === "SUSPEND") {
    await col.updateMany({ sellerId: profile.userId }, { $set: { sellerDisabled: true } });
  } else if (action === "APPROVE") {
    await col.updateMany({ sellerId: profile.userId }, { $unset: { sellerDisabled: "" } });
  }

  await audit(req, `SELLER_${action}`, "SellerProfile", profile.id, { reason });
  res.json(updated);
}

export async function disableSeller(req: Request, res: Response) {
  const id = String(req.params.id);
  const profile = await prisma.sellerProfile.findFirst({
    where: { OR: [{ id }, { userId: id }] },
  });
  if (!profile) throw new HttpError(404, "Seller not found");

  const updated = await prisma.sellerProfile.update({
    where: { id: profile.id },
    data: {
      status: "SUSPENDED",
      isDisabled: true,
      disabledAt: new Date(),
      disabledBy: req.user?.id,
    },
  });

  // Hide seller's properties from public search
  const col = getPropertiesCollection();
  await col.updateMany({ sellerId: profile.userId }, { $set: { sellerDisabled: true } });

  await audit(req, "SELLER_DISABLED", "SellerProfile", profile.id, {
    userId: profile.userId,
    companyName: profile.companyName,
  });

  res.json({ ok: true, message: "Seller suspended/disabled successfully", seller: updated });
}

export async function enableSeller(req: Request, res: Response) {
  const id = String(req.params.id);
  const profile = await prisma.sellerProfile.findFirst({
    where: { OR: [{ id }, { userId: id }] },
  });
  if (!profile) throw new HttpError(404, "Seller not found");

  const updated = await prisma.sellerProfile.update({
    where: { id: profile.id },
    data: {
      status: "APPROVED",
      isDisabled: false,
      disabledAt: null,
      disabledBy: null,
    },
  });

  // Restore seller's properties to public search
  const col = getPropertiesCollection();
  await col.updateMany({ sellerId: profile.userId }, { $unset: { sellerDisabled: "" } });

  await audit(req, "SELLER_ENABLED", "SellerProfile", profile.id, {
    userId: profile.userId,
    companyName: profile.companyName,
  });

  res.json({ ok: true, message: "Seller enabled/restored successfully", seller: updated });
}

export async function users(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  const searchTerm = q.q?.trim().toLowerCase();
  const statusFilter = q.status?.toUpperCase();
  const roleFilter = q.role?.toUpperCase();

  let allUsers = await prisma.user.findMany({
    where: { role: { in: ["CUSTOMER", "SELLER"] } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      createdAt: true,
      emailVerifiedAt: true,
      isDisabled: true,
      sellerProfile: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (roleFilter && roleFilter !== "ALL") {
    allUsers = allUsers.filter((u) => u.role === roleFilter);
  }

  if (statusFilter && statusFilter !== "ALL") {
    if (statusFilter === "DISABLED") {
      allUsers = allUsers.filter((u) => (u as any).isDisabled === true);
    } else if (statusFilter === "ACTIVE") {
      allUsers = allUsers.filter((u) => !(u as any).isDisabled);
    }
  }

  if (searchTerm) {
    allUsers = allUsers.filter((u) => {
      const matchName = u.name?.toLowerCase().includes(searchTerm);
      const matchEmail = u.email?.toLowerCase().includes(searchTerm);
      const matchPhone = u.phone?.toLowerCase().includes(searchTerm);
      const matchId = u.id?.toLowerCase().includes(searchTerm);
      return matchName || matchEmail || matchPhone || matchId;
    });
  }

  res.json({ results: allUsers, total: allUsers.length });
}

export async function disableUser(req: Request, res: Response) {
  const id = String(req.params.id);
  const targetUser = await prisma.user.findUnique({
    where: { id },
    include: { sellerProfile: true },
  });

  if (!targetUser) throw new HttpError(404, "User not found");
  if (targetUser.role === "SUPERADMIN") throw new HttpError(403, "Cannot disable Superadmin accounts");

  const updated = await prisma.user.update({
    where: { id },
    data: {
      isDisabled: true,
      disabledAt: new Date(),
      disabledBy: req.user?.id,
    },
  });

  // If user is a seller, suspend profile and hide properties
  if (targetUser.role === "SELLER") {
    await prisma.sellerProfile.update({
      where: { userId: id },
      data: {
        status: "SUSPENDED",
        isDisabled: true,
        disabledAt: new Date(),
        disabledBy: req.user?.id,
      },
    });
    const col = getPropertiesCollection();
    await col.updateMany({ sellerId: id }, { $set: { sellerDisabled: true } });
  }

  await audit(req, "USER_DISABLED", "User", id, {
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
  });

  res.json({ ok: true, message: "User disabled successfully", user: updated });
}

export async function enableUser(req: Request, res: Response) {
  const id = String(req.params.id);
  const targetUser = await prisma.user.findUnique({
    where: { id },
    include: { sellerProfile: true },
  });

  if (!targetUser) throw new HttpError(404, "User not found");

  const updated = await prisma.user.update({
    where: { id },
    data: {
      isDisabled: false,
      disabledAt: null,
      disabledBy: null,
    },
  });

  if (targetUser.role === "SELLER") {
    await prisma.sellerProfile.update({
      where: { userId: id },
      data: {
        status: "APPROVED",
        isDisabled: false,
        disabledAt: null,
        disabledBy: null,
      },
    });
    const col = getPropertiesCollection();
    await col.updateMany({ sellerId: id }, { $unset: { sellerDisabled: "" } });
  }

  await audit(req, "USER_ENABLED", "User", id, {
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
  });

  res.json({ ok: true, message: "User enabled successfully", user: updated });
}

export async function properties(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  const searchTerm = q.q?.trim().toLowerCase();
  const statusFilter = q.status?.toUpperCase();

  const col = getPropertiesCollection();
  const query: Record<string, any> = {};

  if (statusFilter && statusFilter !== "ALL") {
    if (statusFilter === "INACTIVE" || statusFilter === "DISABLED") {
      query.$or = [{ status: "INACTIVE" }, { isDisabled: true }];
    } else {
      query.status = statusFilter;
    }
  }

  const docs = await col.find(query).sort({ createdAt: -1 }).toArray();

  const sellerIds = [...new Set(docs.map((d) => d.sellerId).filter(Boolean))];
  const sellersList = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, email: true, name: true, phone: true },
  });
  const sellerMap = new Map(sellersList.map((s) => [s.id, s]));

  let results = docs.map((doc) => ({
    ...formatMongoProperty(doc),
    seller: sellerMap.get(doc.sellerId),
  }));

  if (searchTerm) {
    results = results.filter((p) => {
      const matchTitle = p.title?.toLowerCase().includes(searchTerm);
      const matchLocality = p.locality?.toLowerCase().includes(searchTerm);
      const matchProject = p.projectName?.toLowerCase().includes(searchTerm);
      const matchId = p.id?.toLowerCase().includes(searchTerm) || p.propertyId?.toLowerCase().includes(searchTerm);
      const matchSellerName = p.seller?.name?.toLowerCase().includes(searchTerm);
      const matchSellerEmail = p.seller?.email?.toLowerCase().includes(searchTerm);
      return matchTitle || matchLocality || matchProject || matchId || matchSellerName || matchSellerEmail;
    });
  }

  res.json({ results, total: results.length });
}

export async function disableProperty(req: Request, res: Response) {
  const id = String(req.params.id);
  const col = getPropertiesCollection();

  const existing = await col.findOne({ propertyId: id });
  if (!existing) throw new HttpError(404, "Property not found");

  await col.updateOne(
    { propertyId: id },
    {
      $set: {
        status: "INACTIVE",
        isDisabled: true,
        disabledAt: new Date(),
        disabledBy: req.user?.id,
        updatedAt: new Date(),
      },
    }
  );

  await audit(req, "PROPERTY_DISABLED", "Property", id, {
    title: existing.title,
    sellerId: existing.sellerId,
  });

  const updated = await col.findOne({ propertyId: id });
  res.json(formatMongoProperty(updated!));
}

export async function enableProperty(req: Request, res: Response) {
  const id = String(req.params.id);
  const col = getPropertiesCollection();

  const existing = await col.findOne({ propertyId: id });
  if (!existing) throw new HttpError(404, "Property not found");

  await col.updateOne(
    { propertyId: id },
    {
      $set: {
        status: "ACTIVE",
        isDisabled: false,
        disabledAt: null,
        disabledBy: null,
        updatedAt: new Date(),
      },
    }
  );

  await audit(req, "PROPERTY_ENABLED", "Property", id, {
    title: existing.title,
    sellerId: existing.sellerId,
  });

  const updated = await col.findOne({ propertyId: id });
  res.json(formatMongoProperty(updated!));
}

export async function deleteProperty(req: Request, res: Response) {
  const id = String(req.params.id);
  const col = getPropertiesCollection();

  const existing = await col.findOne({ propertyId: id });
  if (!existing) throw new HttpError(404, "Property not found");

  // 1. Delete associated local image files
  if (Array.isArray(existing.images)) {
    for (const img of existing.images) {
      if (img.path && typeof img.path === "string") {
        try {
          await deleteLocalFile(img.path);
        } catch {
          // ignore missing files
        }
      }
    }
  }

  // 2. Cascade delete related records
  await Promise.all([
    prisma.favourite.deleteMany({ where: { propertyId: id } }),
    prisma.cartItem.deleteMany({ where: { propertyId: id } }),
    prisma.clientPropertyInterest.deleteMany({ where: { propertyId: id } }),
    prisma.propertyVisit.deleteMany({ where: { propertyId: id } }),
  ]);

  // 3. Remove property document from MongoDB
  await col.deleteOne({ propertyId: id });

  // 4. Audit log entry
  await audit(req, "PROPERTY_DELETED", "Property", id, {
    title: existing.title,
    price: existing.price,
    locality: existing.locality,
    sellerId: existing.sellerId,
    deletedByRole: req.user?.role,
  });

  res.json({ ok: true, message: "Property permanently deleted" });
}

export async function getDisabledItems(_req: Request, res: Response) {
  const col = getPropertiesCollection();

  const [disabledUsers, disabledSellers, disabledPropertiesDocs] = await Promise.all([
    prisma.user.findMany({
      where: { isDisabled: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        disabledAt: true,
        disabledBy: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sellerProfile.findMany({
      where: { OR: [{ status: "SUSPENDED" }, { isDisabled: true }] },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    col
      .find({ $or: [{ status: "INACTIVE" }, { isDisabled: true }] })
      .sort({ updatedAt: -1 })
      .toArray(),
  ]);

  const sellerIds = [...new Set(disabledPropertiesDocs.map((p) => p.sellerId).filter(Boolean))];
  const sellersList = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, email: true, name: true },
  });
  const sellerMap = new Map(sellersList.map((s) => [s.id, s]));

  const disabledProperties = disabledPropertiesDocs.map((p) => ({
    ...formatMongoProperty(p),
    seller: sellerMap.get(p.sellerId),
  }));

  res.json({
    users: disabledUsers,
    sellers: disabledSellers,
    properties: disabledProperties,
  });
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
