import { z } from "zod";
import type { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { defaultImageForType, deleteLocalFile, saveLocalFile } from "../../services/storage.service.js";
import {
  getPropertiesCollection,
  formatMongoProperty,
  type MongoProperty,
  type MongoPropertyImage,
} from "../../config/mongo.js";

const propertyInput = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  propertyType: z.enum(["APARTMENT", "VILLA", "INDEPENDENT_HOUSE", "PLOT", "BUILDER_FLOOR"]),
  listingType: z.enum(["BUY", "RENT"]).default("BUY"),
  projectName: z.string().optional(),
  bhk: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0).default(1),
  price: z.coerce.number().int().min(0),
  carpetArea: z.coerce.number().int().min(0),
  superBuiltUpArea: z.coerce.number().int().optional(),
  builtUpArea: z.coerce.number().int().optional(),
  furnishing: z.enum(["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"]),
  floor: z.coerce.number().int().optional(),
  totalFloors: z.coerce.number().int().optional(),
  parking: z.coerce.number().int().default(0),
  amenities: z.array(z.string()).optional(),
  address: z.string().min(3),
  locality: z.string().min(2),
  city: z.string().min(2).default("Jaipur"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  contactName: z.string().min(2),
  contactPhone: z.string().min(8),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
});

async function requireApprovedSeller(userId: string, role?: string) {
  if (role === "SUPERADMIN") {
    return { id: `admin_${userId}`, userId, status: "APPROVED", companyName: "Platform Administration" };
  }
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile || profile.status !== "APPROVED") throw new HttpError(403, "Seller is not approved");
  return profile;
}


export async function listPublic(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  const page = Math.max(1, Number(q.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(q.limit ?? 24)));
  const col = getPropertiesCollection();

  const filter: Record<string, any> = {
    status: q.status === "SOLD" ? "SOLD" : "ACTIVE",
    sellerDisabled: { $ne: true },
  };

  if (q.sellerId) {
    filter.sellerId = q.sellerId;
  }

  if (q.listingType) {
    filter.listingType = q.listingType.toUpperCase();
  }

  // Locality / Location search
  const searchLoc = q.locality || q.location;
  if (searchLoc) {
    const escaped = searchLoc.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { locality: { $regex: new RegExp(escaped, "i") } },
      { address: { $regex: new RegExp(escaped, "i") } },
      { projectName: { $regex: new RegExp(escaped, "i") } },
      { city: { $regex: new RegExp(escaped, "i") } },
    ];
  }

  if (q.propertyType) {
    filter.propertyType = q.propertyType.toUpperCase();
  }

  if (q.bhk) {
    const bhkNum = Number(q.bhk);
    if (bhkNum >= 5) {
      filter.bhk = { $gte: 5 };
    } else {
      filter.bhk = bhkNum;
    }
  }

  if (q.furnishing) {
    filter.furnishing = q.furnishing.toUpperCase();
  }

  if (q.minPrice || q.maxPrice) {
    filter.price = {};
    if (q.minPrice) filter.price.$gte = Number(q.minPrice);
    if (q.maxPrice) filter.price.$lte = Number(q.maxPrice);
  }

  if (q.minArea || q.maxArea) {
    filter.carpetArea = {};
    if (q.minArea) filter.carpetArea.$gte = Number(q.minArea);
    if (q.maxArea) filter.carpetArea.$lte = Number(q.maxArea);
  }

  if (q.verified === "true") {
    filter.verified = true;
  }

  // General text query
  if (q.q) {
    const escaped = q.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    filter.$or = [
      { title: { $regex: regex } },
      { locality: { $regex: regex } },
      { description: { $regex: regex } },
      { address: { $regex: regex } },
      { projectName: { $regex: regex } },
    ];
  }

  // Bounding box filter ($geoWithin)
  if (q.north && q.south && q.east && q.west) {
    const north = Number(q.north);
    const south = Number(q.south);
    const east = Number(q.east);
    const west = Number(q.west);
    if ([north, south, east, west].every(Number.isFinite)) {
      filter.location = {
        $geoWithin: {
          $box: [
            [west, south],
            [east, north],
          ],
        },
      };
    }
  }

  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (q.sort === "price_asc") sortOption = { price: 1 };
  else if (q.sort === "price_desc") sortOption = { price: -1 };
  else if (q.sort === "area_desc") sortOption = { carpetArea: -1 };
  else if (q.sort === "area_asc") sortOption = { carpetArea: 1 };

  const total = await col.countDocuments(filter);
  const cursor = col.find(filter);
  if (!filter.location?.$near) {
    cursor.sort(sortOption);
  }
  const docs = await cursor.skip((page - 1) * limit).limit(limit).toArray();

  // Hydrate seller contact details from MongoDB User
  const sellerIds = [...new Set(docs.map((d) => d.sellerId).filter((id): id is string => Boolean(id)))];
  const sellers = sellerIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, name: true, phone: true, email: true },
      })
    : [];
  const sellerMap = new Map(sellers.map((s) => [s.id, s]));

  const results = docs.map((doc) => {
    const formatted = formatMongoProperty(doc);
    const seller = doc.sellerId ? sellerMap.get(doc.sellerId) : undefined;
    return {
      ...formatted,
      seller: seller ? { name: seller.name, phone: seller.phone, email: seller.email } : undefined,
    };
  });

  res.json({
    total,
    page,
    limit,
    results,
  });
}

export async function searchGeospatial(req: Request, res: Response) {
  return listPublic(req, res);
}

export async function getPublic(req: Request, res: Response) {
  const id = String(req.params.id);
  const col = getPropertiesCollection();

  const doc = await col.findOne({ propertyId: id });
  if (!doc) throw new HttpError(404, "Property not found");

  if (doc.status === "DRAFT" || doc.status === "INACTIVE") {
    if (req.user?.role !== "SUPERADMIN" && req.user?.id !== doc.sellerId) {
      throw new HttpError(404, "Property not found");
    }
  }

  // Increment views in MongoDB
  await col.updateOne({ propertyId: id }, { $inc: { views: 1 } });

  // Hydrate full seller info from MongoDB & Prisma
  let sellerInfo: any = undefined;
  if (doc.sellerId) {
    const sellerUser = await prisma.user.findUnique({
      where: { id: doc.sellerId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        avatarUrl: true,
      },
      include: { sellerProfile: true },
    });

    if (sellerUser) {
      const sellerPropsCount = await col.countDocuments({
        sellerId: doc.sellerId,
        status: "ACTIVE",
        sellerDisabled: { $ne: true },
      });

      sellerInfo = {
        id: sellerUser.id,
        sellerProfileId: sellerUser.sellerProfile?.id || sellerUser.id,
        name: sellerUser.name,
        companyName: sellerUser.sellerProfile?.companyName || sellerUser.name,
        phone: sellerUser.phone,
        email: sellerUser.email,
        avatarUrl: sellerUser.avatarUrl,
        status: sellerUser.sellerProfile?.status || "APPROVED",
        memberSince: sellerUser.createdAt,
        totalProperties: sellerPropsCount,
      };
    }
  }

  const formatted = formatMongoProperty({ ...doc, views: (doc.views || 0) + 1 });
  res.json({
    ...formatted,
    seller: sellerInfo,
  });
}

export async function createMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  await requireApprovedSeller(req.user.id, req.user.role);
  const body = propertyInput.parse(req.body);
  const col = getPropertiesCollection();

  const propertyId = `prop_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date();

  const newDoc: MongoProperty = {
    propertyId,
    sellerId: req.user.id,
    listingType: body.listingType,
    title: body.title,
    description: body.description,
    propertyType: body.propertyType,
    bhk: body.bhk,
    bedrooms: body.bhk,
    bathrooms: body.bathrooms,
    price: body.price,
    carpetArea: body.carpetArea,
    superBuiltUpArea: body.superBuiltUpArea || body.carpetArea,
    builtUpArea: body.builtUpArea || body.superBuiltUpArea || body.carpetArea,
    furnishing: body.furnishing,
    floor: body.floor,
    totalFloors: body.totalFloors,
    parking: body.parking,
    parkingSlots: body.parking,
    amenities: body.amenities || [],
    projectName: body.projectName,
    locality: body.locality.trim(),
    city: body.city || "Jaipur",
    address: body.address.trim(),
    location: {
      type: "Point",
      coordinates: [body.longitude, body.latitude], // strictly GeoJSON [lng, lat]
    },
    latitude: body.latitude,
    longitude: body.longitude,
    images: [],
    status: body.status || "ACTIVE",
    verified: true,
    views: 0,
    contactName: body.contactName,
    contactPhone: body.contactPhone,
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(newDoc);
  res.status(201).json(formatMongoProperty(newDoc));
}

export async function updateMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  await requireApprovedSeller(req.user.id, req.user.role);
  const id = String(req.params.id);
  const col = getPropertiesCollection();

  const existing = await col.findOne({ propertyId: id });
  if (!existing) throw new HttpError(404, "Property not found");
  if (existing.sellerId !== req.user.id && req.user.role !== "SUPERADMIN") {
    throw new HttpError(403, "Forbidden");
  }
  if (existing.status === "SOLD") throw new HttpError(400, "Cannot edit a SOLD property");

  const body = propertyInput.partial().parse(req.body);
  if ((body as { status?: string }).status === "SOLD" && req.user.role !== "SUPERADMIN") {
    throw new HttpError(403, "Sellers cannot mark a property as SOLD");
  }

  const updateFields: Record<string, any> = {
    ...body,
    updatedAt: new Date(),
  };

  if (body.bhk !== undefined) {
    updateFields.bedrooms = body.bhk;
  }
  if (body.parking !== undefined) {
    updateFields.parkingSlots = body.parking;
  }

  // If coordinates updated, update GeoJSON Point
  if (body.latitude !== undefined && body.longitude !== undefined) {
    updateFields.location = {
      type: "Point",
      coordinates: [body.longitude, body.latitude],
    };
  }

  await col.updateOne({ propertyId: id }, { $set: updateFields });
  const updated = await col.findOne({ propertyId: id });
  res.json(formatMongoProperty(updated!));
}

export async function deactivateMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const id = String(req.params.id);
  const col = getPropertiesCollection();

  const existing = await col.findOne({ propertyId: id });
  if (!existing) throw new HttpError(404, "Property not found");
  if (existing.sellerId !== req.user.id && req.user.role !== "SUPERADMIN") {
    throw new HttpError(403, "Forbidden");
  }
  if (existing.status === "SOLD") throw new HttpError(400, "Cannot change status of a SOLD property");

  const newStatus = existing.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
  await col.updateOne({ propertyId: id }, { $set: { status: newStatus, updatedAt: new Date() } });

  const updated = await col.findOne({ propertyId: id });
  res.json(formatMongoProperty(updated!));
}

export async function listMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const col = getPropertiesCollection();

  const docs = await col
    .find({ sellerId: req.user.id })
    .sort({ updatedAt: -1 })
    .toArray();

  res.json({ results: docs.map(formatMongoProperty) });
}

export async function uploadImages(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const id = String(req.params.id);
  const col = getPropertiesCollection();

  const existing = await col.findOne({ propertyId: id });
  if (!existing) throw new HttpError(404, "Property not found");
  if (existing.sellerId !== req.user.id && req.user.role !== "SUPERADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) throw new HttpError(400, "No files uploaded");

  let order = (existing.images || []).length;
  const newImages: MongoPropertyImage[] = [];

  for (const f of files) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.mimetype)) {
      throw new HttpError(400, "Only jpeg, png, webp, gif are allowed");
    }
    if (f.size > 5 * 1024 * 1024) throw new HttpError(400, "Each image must be under 5MB");

    const imgId = `img_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const filename = `${existing.propertyId}-${Date.now()}-${order}-${f.originalname.replace(/\s+/g, "_")}`;
    const path = saveLocalFile(filename, f.buffer);

    newImages.push({
      id: imgId,
      path,
      sortOrder: order,
      isPrimary: (existing.images || []).length === 0 && order === 0,
    });
    order += 1;
  }

  const updatedImages = [...(existing.images || []), ...newImages];
  const primaryPath = updatedImages.find((i) => i.isPrimary)?.path || updatedImages[0]?.path;

  await col.updateOne(
    { propertyId: id },
    { $set: { images: updatedImages, primaryImage: primaryPath, updatedAt: new Date() } },
  );

  const updated = await col.findOne({ propertyId: id });
  res.status(201).json({ uploaded: newImages, property: formatMongoProperty(updated!) });
}

export async function deleteImage(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const imageId = String(req.params.imageId);
  const col = getPropertiesCollection();

  const doc = await col.findOne({ "images.id": imageId });
  if (!doc) throw new HttpError(404, "Image not found");
  if (doc.sellerId !== req.user.id && req.user.role !== "SUPERADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  const targetImg = doc.images.find((i) => i.id === imageId);
  if (targetImg) {
    deleteLocalFile(targetImg.path);
  }

  const remaining = doc.images.filter((i) => i.id !== imageId);
  if (targetImg?.isPrimary && remaining.length > 0) {
    remaining[0].isPrimary = true;
  }
  const primaryPath = remaining.find((i) => i.isPrimary)?.path || remaining[0]?.path;

  await col.updateOne(
    { propertyId: doc.propertyId },
    { $set: { images: remaining, primaryImage: primaryPath, updatedAt: new Date() } },
  );

  res.json({ ok: true });
}

export async function setPrimary(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const imageId = String(req.params.imageId);
  const col = getPropertiesCollection();

  const doc = await col.findOne({ "images.id": imageId });
  if (!doc) throw new HttpError(404, "Image not found");
  if (doc.sellerId !== req.user.id && req.user.role !== "SUPERADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  const updatedImages = doc.images.map((img) => ({
    ...img,
    isPrimary: img.id === imageId,
  }));
  const primaryPath = updatedImages.find((i) => i.isPrimary)?.path;

  await col.updateOne(
    { propertyId: doc.propertyId },
    { $set: { images: updatedImages, primaryImage: primaryPath, updatedAt: new Date() } },
  );

  res.json({ ok: true });
}

export async function reorderImages(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const id = String(req.params.id);
  const col = getPropertiesCollection();

  const doc = await col.findOne({ propertyId: id });
  if (!doc) throw new HttpError(404, "Property not found");
  if (doc.sellerId !== req.user.id && req.user.role !== "SUPERADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  const { order } = z.object({ order: z.array(z.string()) }).parse(req.body);
  const orderMap = new Map(order.map((imgId, idx) => [imgId, idx]));

  const updatedImages = [...doc.images]
    .map((img) => ({
      ...img,
      sortOrder: orderMap.has(img.id) ? orderMap.get(img.id)! : img.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  await col.updateOne(
    { propertyId: id },
    { $set: { images: updatedImages, updatedAt: new Date() } },
  );

  res.json({ ok: true });
}

export async function mapPoints(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  const col = getPropertiesCollection();
  const filter: Record<string, any> = {
    status: "ACTIVE",
    sellerDisabled: { $ne: true },
  };

  if (q.listingType) filter.listingType = q.listingType.toUpperCase();
  if (q.locality) {
    const escaped = q.locality.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.locality = { $regex: new RegExp(escaped, "i") };
  }

  const items = await col
    .find(filter, {
      projection: {
        propertyId: 1,
        title: 1,
        price: 1,
        latitude: 1,
        longitude: 1,
        locality: 1,
        city: 1,
        bhk: 1,
        bathrooms: 1,
        carpetArea: 1,
        listingType: 1,
        propertyType: 1,
        primaryImage: 1,
        images: 1,
      },
    })
    .limit(100)
    .toArray();

  res.json({
    results: items.map((p) => ({
      id: p.propertyId,
      propertyId: p.propertyId,
      title: p.title,
      price: p.price,
      latitude: p.latitude,
      longitude: p.longitude,
      locality: p.locality,
      city: p.city || "Jaipur",
      bhk: p.bhk,
      bathrooms: p.bathrooms,
      carpetArea: p.carpetArea,
      listingType: p.listingType,
      propertyType: p.propertyType,
      primaryImage: p.primaryImage || p.images?.[0]?.path || defaultImageForType(p.propertyType),
    })),
  });
}

export async function deleteProperty(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const id = String(req.params.id);
  const col = getPropertiesCollection();

  const existing = await col.findOne({ propertyId: id });
  if (!existing) throw new HttpError(404, "Property not found");

  if (existing.sellerId !== req.user.id && req.user.role !== "SUPERADMIN") {
    throw new HttpError(403, "Forbidden: you can only delete your own properties");
  }

  // 1. Delete associated local image files safely
  if (Array.isArray(existing.images)) {
    for (const img of existing.images) {
      if (img.path && typeof img.path === "string") {
        try {
          await deleteLocalFile(img.path);
        } catch {
          // ignore file not found
        }
      }
    }
  }

  // 2. Cascade delete related records in database
  await Promise.all([
    prisma.favourite.deleteMany({ where: { propertyId: id } }),
    prisma.cartItem.deleteMany({ where: { propertyId: id } }),
    prisma.clientPropertyInterest.deleteMany({ where: { propertyId: id } }),
    prisma.propertyVisit.deleteMany({ where: { propertyId: id } }),
  ]);

  // 3. Remove property document from MongoDB
  await col.deleteOne({ propertyId: id });

  // 4. Audit log entry
  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: "PROPERTY_DELETED",
      entityType: "Property",
      entityId: id,
      metadata: {
        title: existing.title,
        price: existing.price,
        locality: existing.locality,
        sellerId: existing.sellerId,
        deletedByRole: req.user.role,
      },
    },
  });

  res.json({ ok: true, message: "Property permanently deleted" });
}

export async function getMarketInsights(_req: Request, res: Response) {
  const col = getPropertiesCollection();
  const activeProps = await col.find({ status: "ACTIVE", sellerDisabled: { $ne: true } }).toArray();

  const total = activeProps.length;
  const buyProps = activeProps.filter((p) => p.listingType === "BUY");
  const rentProps = activeProps.filter((p) => p.listingType === "RENT");

  const avgBuyPrice = buyProps.length > 0
    ? Math.round(buyProps.reduce((sum, p) => sum + (p.price || 0), 0) / buyProps.length)
    : 0;

  const avgRentPrice = rentProps.length > 0
    ? Math.round(rentProps.reduce((sum, p) => sum + (p.price || 0), 0) / rentProps.length)
    : 0;

  const sellerIds = new Set(activeProps.map((p) => p.sellerId).filter(Boolean));
  const sellersCount = sellerIds.size;

  const localityMap = new Map<string, { count: number; avgPrice: number; totalPrice: number }>();
  for (const p of activeProps) {
    const loc = p.locality || "Jaipur Central";
    const existing = localityMap.get(loc) || { count: 0, avgPrice: 0, totalPrice: 0 };
    existing.count += 1;
    existing.totalPrice += p.price || 0;
    localityMap.set(loc, existing);
  }

  const topLocalities = Array.from(localityMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgPrice: Math.round(data.totalPrice / data.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    properties: total,
    buyCount: buyProps.length,
    rentCount: rentProps.length,
    sellers: sellersCount,
    avgBuyPrice,
    avgRentPrice,
    topLocalities,
  });
}

