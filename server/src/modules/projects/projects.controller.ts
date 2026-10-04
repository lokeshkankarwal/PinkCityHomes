import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { getPropertiesCollection, formatMongoProperty } from "../../config/mongo.js";

const projectInput = z.object({
  name: z.string().min(2),
  developerName: z.string().min(2),
  locality: z.string().min(2),
  city: z.string().min(2).default("Jaipur"),
  address: z.string().optional(),
  description: z.string().optional(),
  totalUnits: z.coerce.number().int().default(20),
  totalTowers: z.coerce.number().int().default(2),
  amenities: z.array(z.string()).default([]),
  image: z.string().optional(),
});

export async function createMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const body = projectInput.parse(req.body);

  const existing = await prisma.project.findFirst({
    where: { name: { equals: body.name.trim(), mode: "insensitive" } },
  });

  if (existing && existing.sellerId && existing.sellerId !== req.user.id) {
    throw new HttpError(400, "A project with this name already exists");
  }

  const project = await prisma.project.upsert({
    where: { name: body.name.trim() },
    update: {
      developerName: body.developerName,
      locality: body.locality.toLowerCase(),
      city: body.city,
      address: body.address,
      description: body.description,
      totalUnits: body.totalUnits,
      totalTowers: body.totalTowers,
      amenities: body.amenities,
      image: body.image,
    },
    create: {
      name: body.name.trim(),
      developerName: body.developerName,
      locality: body.locality.toLowerCase(),
      city: body.city,
      address: body.address,
      description: body.description,
      totalUnits: body.totalUnits,
      totalTowers: body.totalTowers,
      amenities: body.amenities,
      image: body.image,
      sellerId: req.user.id,
    },
  });

  res.status(201).json(project);
}

export async function listMine(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  const projects = await prisma.project.findMany({
    where: { sellerId: req.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const col = getPropertiesCollection();
  const properties = (await col.find({ sellerId: req.user.id }).toArray()).map(formatMongoProperty);

  const results = projects.map((proj) => {
    const units = properties.filter(
      (p) => p.projectName && p.projectName.trim().toLowerCase() === proj.name.trim().toLowerCase(),
    );
    return {
      ...proj,
      unitsCount: units.length,
      buyUnitsCount: units.filter((u) => u.listingType === "BUY").length,
      rentUnitsCount: units.filter((u) => u.listingType === "RENT").length,
      units,
    };
  });

  res.json({ results });
}

export async function listPublic(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  const needle = (q.locality || q.q || "").toLowerCase().trim();

  // 1. Fetch DB projects
  const dbProjects = await prisma.project.findMany({
    include: { seller: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch all active properties with a projectName from MongoDB
  const col = getPropertiesCollection();
  const activeDocs = await col.find({ status: "ACTIVE", projectName: { $exists: true, $ne: "" } }).toArray();
  const activeProps = activeDocs.map(formatMongoProperty);

  // 3. Map projects with live unit metrics
  const projectsMap = new Map<string, any>();

  for (const proj of dbProjects) {
    const units = activeProps.filter(
      (p) => p.projectName && p.projectName.trim().toLowerCase() === proj.name.trim().toLowerCase(),
    );
    const buyUnits = units.filter((u) => u.listingType === "BUY");
    const rentUnits = units.filter((u) => u.listingType === "RENT");
    const prices = units.map((u) => u.price).filter(Boolean);
    const areas = units.map((u) => u.carpetArea).filter(Boolean);

    projectsMap.set(proj.name.trim().toLowerCase(), {
      project_id: proj.id,
      apartment_name: proj.name,
      developer_name: proj.developerName || proj.seller?.name || "Verified Developer",
      locality: proj.locality,
      city: proj.city || "Jaipur",
      address: proj.address,
      description: proj.description,
      project_status: units.length > 0 ? "ready to move" : "upcoming / active",
      total_units: Math.max(proj.totalUnits, units.length),
      total_listings: units.length,
      units_for_sale: buyUnits.length,
      units_for_rent: rentUnits.length,
      price_min: prices.length ? Math.min(...prices) : 4500000,
      price_max: prices.length ? Math.max(...prices) : 18000000,
      min_area_sqft: areas.length ? Math.min(...areas) : 850,
      max_area_sqft: areas.length ? Math.max(...areas) : 2400,
      amenities: proj.amenities.length
        ? proj.amenities
        : ["Gymnasium", "Swimming Pool", "Clubhouse", "24/7 Security", "Power Backup", "Lift"],
      image: proj.image || units[0]?.images?.[0]?.path || "/defaults/apartment.svg",
      isPlatform: true,
      units,
    });
  }

  // 4. Auto-group any active properties whose projectName has not yet been registered in Project table
  activeProps.forEach((p) => {
    if (!p.projectName || !p.projectName.trim()) return;
    const key = p.projectName.trim().toLowerCase();
    if (!projectsMap.has(key)) {
      const units = activeProps.filter(
        (item) => item.projectName && item.projectName.trim().toLowerCase() === key,
      );
      const buyUnits = units.filter((u) => u.listingType === "BUY");
      const rentUnits = units.filter((u) => u.listingType === "RENT");
      const prices = units.map((u) => u.price);
      const areas = units.map((u) => u.carpetArea);

      projectsMap.set(key, {
        project_id: `platform-${key.replace(/\W+/g, "-")}`,
        apartment_name: p.projectName.trim(),
        developer_name: p.contactName ? `${p.contactName} (Verified Seller)` : "Verified Developer",
        locality: p.locality,
        city: p.city || "Jaipur",
        address: p.address,
        description: `Curated development featuring ${units.length} verified apartments and flats for buy and rent.`,
        project_status: "ready to move",
        total_units: units.length * 10,
        total_listings: units.length,
        units_for_sale: buyUnits.length,
        units_for_rent: rentUnits.length,
        price_min: Math.min(...prices),
        price_max: Math.max(...prices),
        min_area_sqft: Math.min(...areas),
        max_area_sqft: Math.max(...areas),
        amenities: ["Gymnasium", "Clubhouse", "24/7 Security", "Power Backup", "Lift", "Parking"],
        image: p.images?.[0]?.path || "/defaults/apartment.svg",
        isPlatform: true,
        units,
      });
    }
  });

  let list = Array.from(projectsMap.values());

  if (needle) {
    const tokens = needle.split(/[,\s]+/).filter(Boolean);
    list = list.filter((p) => {
      const haystack = `${p.apartment_name} ${p.developer_name} ${p.locality} ${p.city} ${p.address || ""}`.toLowerCase();
      return tokens.every((t: string) => haystack.includes(t));
    });
  }

  res.json({ results: list });
}

export async function getPublic(req: Request, res: Response) {
  const id = String(req.params.id);

  // 1. Check if DB project by id
  let proj = await prisma.project.findUnique({
    where: { id },
    include: { seller: { select: { name: true, phone: true, email: true } } },
  });

  // 2. Or by name / slug
  if (!proj) {
    const cleanName = id.replace(/^platform-/, "").replace(/-/g, " ");
    proj = await prisma.project.findFirst({
      where: {
        OR: [
          { name: { equals: id, mode: "insensitive" } },
          { name: { equals: cleanName, mode: "insensitive" } },
        ],
      },
      include: { seller: { select: { name: true, phone: true, email: true } } },
    });
  }

  const projectName = proj?.name || id.replace(/^platform-/, "").replace(/-/g, " ");

  // 3. Find all active properties under this project from MongoDB
  const col = getPropertiesCollection();
  const escaped = projectName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const unitDocs = await col
    .find({
      status: "ACTIVE",
      projectName: { $regex: new RegExp(`^${escaped}$`, "i") },
    })
    .sort({ price: 1 })
    .toArray();

  const units = unitDocs.map(formatMongoProperty);

  const buyUnits = units.filter((u) => u.listingType === "BUY");
  const rentUnits = units.filter((u) => u.listingType === "RENT");
  const prices = units.map((u) => u.price);
  const areas = units.map((u) => u.carpetArea);

  if (proj) {
    return res.json({
      project_id: proj.id,
      apartment_name: proj.name,
      developer_name: proj.developerName || proj.seller?.name || "Verified Developer",
      locality: proj.locality,
      city: proj.city || "Jaipur",
      address: proj.address || `${proj.locality}, ${proj.city || "Jaipur"}`,
      description: proj.description || `Curated residential project in ${proj.locality}.`,
      project_status: units.length > 0 ? "ready to move" : "upcoming / active",
      total_units: Math.max(proj.totalUnits, units.length),
      total_towers: proj.totalTowers,
      total_listings: units.length,
      price_min: prices.length ? Math.min(...prices) : 5000000,
      price_max: prices.length ? Math.max(...prices) : 20000000,
      min_area_sqft: areas.length ? Math.min(...areas) : 900,
      max_area_sqft: areas.length ? Math.max(...areas) : 2400,
      amenities: proj.amenities.length
        ? proj.amenities
        : ["Gymnasium", "Swimming Pool", "Clubhouse", "24/7 Security", "Power Backup", "Lift"],
      image: proj.image || units[0]?.images?.[0]?.path || "/defaults/apartment.svg",
      contactName: proj.seller?.name,
      contactPhone: proj.seller?.phone,
      contactEmail: proj.seller?.email,
      saleUnits: buyUnits,
      rentUnits: rentUnits,
      allUnits: units,
    });
  }

  // If not found in DB Project table, but units exist under that projectName
  if (units.length > 0) {
    const first = units[0];
    return res.json({
      project_id: id,
      apartment_name: first.projectName,
      developer_name: first.contactName ? `${first.contactName} (Verified Developer)` : "Verified Developer",
      locality: first.locality,
      city: first.city || "Jaipur",
      address: first.address,
      description: `Premium development with ${units.length} available residential flats for buy and rent.`,
      project_status: "ready to move",
      total_units: units.length * 10,
      total_towers: 2,
      total_listings: units.length,
      price_min: Math.min(...prices),
      price_max: Math.max(...prices),
      min_area_sqft: Math.min(...areas),
      max_area_sqft: Math.max(...areas),
      amenities: ["Gymnasium", "Swimming Pool", "Clubhouse", "24/7 Security", "Power Backup", "Lift"],
      image: first.images?.[0]?.path || "/defaults/apartment.svg",
      contactName: first.contactName,
      contactPhone: first.contactPhone,
      saleUnits: buyUnits,
      rentUnits: rentUnits,
      allUnits: units,
    });
  }

  throw new HttpError(404, "Project not found");
}
