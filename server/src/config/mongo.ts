import { MongoClient, type Db, type Collection } from "mongodb";
import { env } from "./env.js";
import { prisma } from "./prisma.js";

export interface GeoPropertyDoc {
  propertyId: string;
  listingType: string;
  title: string;
  locality: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  carpetArea: number;
  propertyType: string;
  furnishing: string;
  status: string;
  address?: string;
  primaryImage?: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // GeoJSON [longitude, latitude]
  };
  updatedAt: Date;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

export async function connectMongo(): Promise<Db | null> {
  if (db && isConnected) return db;
  try {
    client = new MongoClient(env.mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db();
    isConnected = true;

    // Ensure indexes
    const col = db.collection<GeoPropertyDoc>("properties");
    await col.createIndex({ location: "2dsphere" });
    await col.createIndex({ propertyId: 1 }, { unique: true });
    await col.createIndex({ listingType: 1, status: 1 });
    await col.createIndex({ locality: 1 });
    await col.createIndex({ price: 1 });

    console.log("[MongoDB] Connected successfully. 2dsphere geospatial index verified.");
    return db;
  } catch (err) {
    console.warn("[MongoDB] Connection warning (geospatial queries will fall back to PostgreSQL):", (err as Error).message);
    isConnected = false;
    db = null;
    return null;
  }
}

export function getMongoDb(): Db | null {
  return isConnected ? db : null;
}

export function getGeoCollection(): Collection<GeoPropertyDoc> | null {
  return isConnected && db ? db.collection<GeoPropertyDoc>("properties") : null;
}

/**
 * Synchronize a single property from PostgreSQL to MongoDB.
 * Ensures [longitude, latitude] GeoJSON format with 2dsphere index compatibility.
 */
export async function syncPropertyToMongo(property: {
  id: string;
  listingType?: string;
  title: string;
  locality: string;
  city: string;
  price: number;
  bhk: number;
  bathrooms?: number;
  carpetArea: number;
  propertyType: string;
  furnishing: string;
  status: string;
  address?: string;
  primaryImage?: string;
  images?: { path: string; isPrimary: boolean; sortOrder: number }[];
  latitude: number;
  longitude: number;
}) {
  const col = getGeoCollection();
  if (!col) return;

  // Don't index non-active properties in discovery
  if (property.status !== "ACTIVE") {
    await col.deleteOne({ propertyId: property.id }).catch(() => {});
    return;
  }

  const primary =
    property.primaryImage ||
    property.images?.find((i) => i.isPrimary)?.path ||
    property.images?.[0]?.path;

  // GeoJSON requires [longitude, latitude]
  const doc: GeoPropertyDoc = {
    propertyId: property.id,
    listingType: (property.listingType || "BUY").toUpperCase(),
    title: property.title,
    locality: property.locality.toLowerCase(),
    city: property.city || "Jaipur",
    price: property.price,
    bedrooms: property.bhk,
    bathrooms: property.bathrooms ?? 1,
    carpetArea: property.carpetArea,
    propertyType: property.propertyType,
    furnishing: property.furnishing,
    status: property.status,
    address: property.address,
    primaryImage: primary,
    location: {
      type: "Point",
      coordinates: [property.longitude, property.latitude],
    },
    updatedAt: new Date(),
  };

  await col.updateOne({ propertyId: property.id }, { $set: doc }, { upsert: true });
}

/**
 * Delete a property from MongoDB discovery collection.
 */
export async function deletePropertyFromMongo(propertyId: string) {
  const col = getGeoCollection();
  if (!col) return;
  await col.deleteOne({ propertyId }).catch(() => {});
}

/**
 * Bootstraps initial synchronization from PostgreSQL to MongoDB on server startup.
 */
export async function bootstrapSyncFromPostgres() {
  const col = getGeoCollection();
  if (!col) return;

  try {
    const activeProperties = await prisma.property.findMany({
      where: { status: "ACTIVE" },
      include: { images: true },
    });

    for (const prop of activeProperties) {
      await syncPropertyToMongo(prop);
    }
    console.log(`[MongoDB] Initial sync complete. Synced ${activeProperties.length} active properties.`);
  } catch (err) {
    console.warn("[MongoDB] Bootstrap sync warning:", (err as Error).message);
  }
}
