import { z } from "zod";
import type { Request, Response } from "express";
import { Prisma, PropertyStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { defaultImageForType, deleteLocalFile, saveLocalFile } from "../../services/storage.service.js";
import { getGeoCollection, syncPropertyToMongo, deletePropertyFromMongo } from "../../config/mongo.js";

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
  superBuiltUpArea: z.coerce.number().int().min(0),
  furnishing: z.enum(["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"]),
  floor: z.coerce.number().int().optional(),
  totalFloors: z.coerce.number().int().optional(),
  parking: z.coerce.number().int().default(0),
  address: z.string().min(3),
  locality: z.string().min(2),
  city: z.string().min(2),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  contactName: z.string().min(2),
  contactPhone: z.string().min(8),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
});

function serialize(p: {
  images: { path: string; isPrimary: boolean; sortOrder: number; id: string }[];
  propertyType: string;
  status: PropertyStatus;
  [k: string]: unknown;
}) {
  const images = [...(p.images || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const primary = images.find((i) => i.isPrimary)?.path ?? images[0]?.path ?? defaultImageForType(p.propertyType);
  return { ...p, images, primaryImage: primary };
}

async function requireApprovedSeller(userId: string) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile || profile.status !== "APPROVED") throw new HttpError(403, "Seller is not approved");
  return profile;
}

export async function listPublic(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  const page = Math.max(1, Number(q.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(q.limit ?? 24)));
  const where: Prisma.PropertyWhereInput = {
    status: q.status === "SOLD" ? "SOLD" : "ACTIVE",
  };
  if (q.listingType) where.listingType = q.listingType.toUpperCase();
  if (q.projectName) where.projectName = { contains: q.projectName, mode: "insensitive" };
  if (q.locality) {
    where.OR = [
      { locality: { contains: q.locality, mode: "insensitive" } },
      { city: { contains: q.locality, mode: "insensitive" } },
      { address: { contains: q.locality, mode: "insensitive" } },
      { projectName: { contains: q.locality, mode: "insensitive" } },
    ];
  }
  if (q.city) where.city = { contains: q.city, mode: "insensitive" };
  if (q.propertyType) where.propertyType = q.propertyType as never;
  if (q.bhk) where.bhk = Number(q.bhk);
  if (q.furnishing) where.furnishing = q.furnishing as never;
  if (q.minPrice || q.maxPrice) {
    where.price = {};
    if (q.minPrice) where.price.gte = Number(q.minPrice);
    if (q.maxPrice) where.price.lte = Number(q.maxPrice);
  }
  // Bounding box filter support in Postgres
  if (q.north && q.south && q.east && q.west) {
    where.latitude = { gte: Number(q.south), lte: Number(q.north) };
    where.longitude = { gte: Number(q.west), lte: Number(q.east) };
  }
  if (q.q) {
    where.OR = [
      { title: { contains: q.q, mode: "insensitive" } },
      { locality: { contains: q.q, mode: "insensitive" } },
      { city: { contains: q.q, mode: "insensitive" } },
      { address: { contains: q.q, mode: "insensitive" } },
      { projectName: { contains: q.q, mode: "insensitive" } },
      { description: { contains: q.q, mode: "insensitive" } },
    ];
  }
  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    q.sort === "price_asc"
      ? { price: "asc" }
      : q.sort === "price_desc"
        ? { price: "desc" }
        : q.sort === "area_desc"
          ? { carpetArea: "desc" }
          : q.sort === "area_asc"
            ? { carpetArea: "asc" }
            : { createdAt: "desc" };

  const [total, items] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      include: { images: true, seller: { select: { name: true } } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  res.json({ total, page, limit, results: items.map(serialize) });
}

/**
 * Geospatial Property Search API
 * Uses MongoDB 2dsphere index for bounding-box ($geoWithin) & proximity ($near) searches.
 * Seamlessly hydrates with full relational Postgres data.
 */
export async function searchGeospatial(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  const page = Math.max(1, Number(q.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(q.limit ?? 24)));
  const listingType = (q.listingType || "BUY").toUpperCase();

  const col = getGeoCollection();
  if (col) {
    try {
      const filter: Record<string, any> = {
        status: "ACTIVE",
        listingType,
      };

      // Bounding box filter ($geoWithin) from map bounds
      if (q.north && q.south && q.east && q.west) {
        const north = Number(q.north);
        const south = Number(q.south);
        const east = Number(q.east);
        const west = Number(q.west);
        if ([north, south, east, west].every(Number.isFinite)) {
          filter.location = {
            $geoWithin: {
              $box: [
                [west, south], // [lng, lat] south-west
                [east, north], // [lng, lat] north-east
              ],
            },
          };
        }
      } else if (q.latitude && q.longitude && q.radius) {
        // Radius proximity filter ($near)
        const lat = Number(q.latitude);
        const lng = Number(q.longitude);
        const radius = Number(q.radius);
        if ([lat, lng, radius].every(Number.isFinite)) {
          filter.location = {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
              $maxDistance: radius,
            },
          };
        }
      }

      if (q.locality) {
        const escaped = q.locality.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.locality = { $regex: new RegExp(escaped, "i") };
      }

      if (q.bhk) {
        filter.bedrooms = Number(q.bhk);
      }

      if (q.propertyType) {
        filter.propertyType = q.propertyType.toUpperCase();
      }

      if (q.furnishing) {
        filter.furnishing = q.furnishing.toUpperCase();
      }

      if (q.minPrice || q.maxPrice) {
        filter.price = {};
        if (q.minPrice) filter.price.$gte = Number(q.minPrice);
        if (q.maxPrice) filter.price.$lte = Number(q.maxPrice);
      }

      let sortOption: Record<string, 1 | -1> = { updatedAt: -1 };
      if (q.sort === "price_asc") sortOption = { price: 1 };
      else if (q.sort === "price_desc") sortOption = { price: -1 };
      else if (q.sort === "area_desc") sortOption = { carpetArea: -1 };
      else if (q.sort === "area_asc") sortOption = { carpetArea: 1 };

      const total = await col.countDocuments(filter);
      const cursor = col.find(filter);
      if (!filter.location?.$near) {
        cursor.sort(sortOption);
      }
      const geoDocs = await cursor.skip((page - 1) * limit).limit(limit).toArray();

      // Hydrate with Postgres records for full images, contact & seller details
      const propIds = geoDocs.map((d) => d.propertyId);
      const pgProps = await prisma.property.findMany({
        where: { id: { in: propIds } },
        include: { images: true, seller: { select: { name: true, phone: true } } },
      });
      const pgMap = new Map(pgProps.map((p) => [p.id, serialize(p)]));

      // Preserve geo ordering (especially critical when $near proximity is used)
      const results = geoDocs.map((d) => pgMap.get(d.propertyId) || d).filter(Boolean);

      return res.json({
        total,
        page,
        limit,
        results,
      });
    } catch (err) {
      console.warn("[MongoDB] Geospatial query failed, falling back to PostgreSQL:", (err as Error).message);
    }
  }

  // Graceful fallback to PostgreSQL
  return listPublic(req, res);
}

export async function getPublic(req: Request, res: Response) {
  const id = String(req.params.id);
  const p = await prisma.property.findUnique({
    where: { id },
    include: { images: true, seller: { select: { id: true, name: true, phone: true, email: true } } },
  });
  if (!p) throw new HttpError(404, "Property not found");
  if (p.status === "DRAFT" || p.status === "INACTIVE") {
    if (req.user?.role !== "SUPERADMIN" && req.user?.id !== p.sellerId) {
      throw new HttpError(404, "Property not found");
    }
  }
  await prisma.property.update({ where: { id: p.id }, data: { views: { increment: 1 } } });
  res.json(serialize({ ...p, views: p.views + 1 }));
}

export async function createMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  await requireApprovedSeller(req.user.id);
  const body = propertyInput.parse(req.body);
  const p = await prisma.property.create({
    data: {
      ...body,
      locality: body.locality.toLowerCase(),
      sellerId: req.user.id,
      status: body.status ?? "ACTIVE",
    },
    include: { images: true },
  });

  // Sync to MongoDB geospatial collection
  await syncPropertyToMongo(p).catch((err) => console.warn("[Mongo Sync Error]:", err));

  res.status(201).json(serialize(p));
}

export async function updateMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  await requireApprovedSeller(req.user.id);
  const id = String(req.params.id);
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Property not found");
  if (existing.sellerId !== req.user.id) throw new HttpError(403, "Forbidden");
  if (existing.status === "SOLD") throw new HttpError(400, "Cannot edit a SOLD property");
  const body = propertyInput.partial().parse(req.body);
  if ((body as { status?: string }).status === "SOLD") {
    throw new HttpError(403, "Sellers cannot mark a property as SOLD");
  }
  const p = await prisma.property.update({
    where: { id: existing.id },
    data: {
      ...body,
      locality: body.locality ? body.locality.toLowerCase() : undefined,
    },
    include: { images: true },
  });

  // Sync to MongoDB geospatial collection
  await syncPropertyToMongo(p).catch((err) => console.warn("[Mongo Sync Error]:", err));

  res.json(serialize(p));
}

export async function deactivateMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const id = String(req.params.id);
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Property not found");
  if (existing.sellerId !== req.user.id) throw new HttpError(403, "Forbidden");
  if (existing.status === "SOLD") throw new HttpError(400, "Cannot change status of a SOLD property");
  const newStatus = existing.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
  const p = await prisma.property.update({
    where: { id: existing.id },
    data: { status: newStatus },
    include: { images: true },
  });

  if (newStatus === "ACTIVE") {
    await syncPropertyToMongo(p).catch((err) => console.warn("[Mongo Sync Error]:", err));
  } else {
    await deletePropertyFromMongo(p.id).catch((err) => console.warn("[Mongo Delete Error]:", err));
  }

  res.json(serialize(p));
}

export async function listMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const items = await prisma.property.findMany({
    where: { sellerId: req.user.id },
    include: { images: true, interests: true, visits: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ results: items.map(serialize) });
}

export async function uploadImages(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const id = String(req.params.id);
  const existing = await prisma.property.findUnique({ where: { id }, include: { images: true } });
  if (!existing) throw new HttpError(404, "Property not found");
  if (existing.sellerId !== req.user.id && req.user.role !== "SUPERADMIN") throw new HttpError(403, "Forbidden");
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) throw new HttpError(400, "No files uploaded");
  let order = existing.images.length;
  const created = [];
  for (const f of files) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.mimetype)) {
      throw new HttpError(400, "Only jpeg, png, webp, gif are allowed");
    }
    if (f.size > 5 * 1024 * 1024) throw new HttpError(400, "Each image must be under 5MB");
    const filename = `${existing.id}-${Date.now()}-${order}-${f.originalname.replace(/\s+/g, "_")}`;
    const path = saveLocalFile(filename, f.buffer);
    const img = await prisma.propertyImage.create({
      data: {
        propertyId: existing.id,
        path,
        sortOrder: order,
        isPrimary: existing.images.length === 0 && order === 0,
      },
    });
    created.push(img);
    order += 1;
  }
  const p = await prisma.property.findUnique({ where: { id: existing.id }, include: { images: true } });
  if (p) {
    await syncPropertyToMongo(p).catch((err) => console.warn("[Mongo Sync Error]:", err));
  }
  res.status(201).json({ uploaded: created, property: serialize(p!) });
}

export async function deleteImage(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const imageId = String(req.params.imageId);
  const img = await prisma.propertyImage.findUnique({ include: { property: true }, where: { id: imageId } });
  if (!img) throw new HttpError(404, "Image not found");
  if (img.property.sellerId !== req.user.id && req.user.role !== "SUPERADMIN") throw new HttpError(403, "Forbidden");
  deleteLocalFile(img.path);
  await prisma.propertyImage.delete({ where: { id: img.id } });
  if (img.isPrimary) {
    const next = await prisma.propertyImage.findFirst({
      where: { propertyId: img.propertyId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) await prisma.propertyImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  const updatedProp = await prisma.property.findUnique({ where: { id: img.propertyId }, include: { images: true } });
  if (updatedProp) {
    await syncPropertyToMongo(updatedProp).catch((err) => console.warn("[Mongo Sync Error]:", err));
  }
  res.json({ ok: true });
}

export async function setPrimary(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const imageId = String(req.params.imageId);
  const img = await prisma.propertyImage.findUnique({ include: { property: true }, where: { id: imageId } });
  if (!img) throw new HttpError(404, "Image not found");
  if (img.property.sellerId !== req.user.id) throw new HttpError(403, "Forbidden");
  await prisma.$transaction([
    prisma.propertyImage.updateMany({ where: { propertyId: img.propertyId }, data: { isPrimary: false } }),
    prisma.propertyImage.update({ where: { id: img.id }, data: { isPrimary: true } }),
  ]);
  const updatedProp = await prisma.property.findUnique({ where: { id: img.propertyId }, include: { images: true } });
  if (updatedProp) {
    await syncPropertyToMongo(updatedProp).catch((err) => console.warn("[Mongo Sync Error]:", err));
  }
  res.json({ ok: true });
}

export async function reorderImages(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const id = String(req.params.id);
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Property not found");
  if (existing.sellerId !== req.user.id) throw new HttpError(403, "Forbidden");
  const { order } = z.object({ order: z.array(z.string()) }).parse(req.body);
  await prisma.$transaction(
    order.map((id, i) => prisma.propertyImage.update({ where: { id }, data: { sortOrder: i } })),
  );
  res.json({ ok: true });
}

export async function mapPoints(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  const where: Prisma.PropertyWhereInput = { status: "ACTIVE" };
  if (q.listingType) where.listingType = q.listingType.toUpperCase();
  if (q.locality) {
    where.locality = { contains: q.locality, mode: "insensitive" };
  }
  if (q.north && q.south && q.east && q.west) {
    where.latitude = { gte: Number(q.south), lte: Number(q.north) };
    where.longitude = { gte: Number(q.west), lte: Number(q.east) };
  }

  const items = await prisma.property.findMany({
    where,
    select: {
      id: true,
      title: true,
      price: true,
      latitude: true,
      longitude: true,
      locality: true,
      city: true,
      bhk: true,
      bathrooms: true,
      carpetArea: true,
      listingType: true,
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      propertyType: true,
    },
  });
  res.json({
    results: items.map((p) => ({
      ...p,
      primaryImage: p.images[0]?.path ?? defaultImageForType(p.propertyType),
    })),
  });
}
