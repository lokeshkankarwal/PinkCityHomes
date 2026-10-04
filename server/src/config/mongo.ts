import { MongoClient, ObjectId, type Db, type Collection } from "mongodb";
import { env } from "./env.js";

export interface MongoPropertyImage {
  id: string;
  path: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface MongoProperty {
  _id?: ObjectId;
  propertyId: string;
  sellerId: string;
  listingType: "BUY" | "RENT";
  title: string;
  description: string;
  propertyType: "APARTMENT" | "VILLA" | "INDEPENDENT_HOUSE" | "PLOT" | "BUILDER_FLOOR";
  bhk: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  carpetArea: number;
  superBuiltUpArea?: number;
  builtUpArea?: number;
  furnishing: "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";
  floor?: number;
  totalFloors?: number;
  parking: number;
  parkingSlots?: number;
  amenities: string[];
  projectName?: string;
  locality: string;
  city: string;
  address: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // GeoJSON strictly [longitude, latitude]
  };
  latitude: number;
  longitude: number;
  images: MongoPropertyImage[];
  primaryImage?: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "SOLD";
  verified: boolean;
  views: number;
  contactName: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

export function sanitizeMongoUri(uri: string): string {
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/i, "$1****$3");
  } catch {
    return "[hidden-uri]";
  }
}

export async function connectMongo(): Promise<Db | null> {
  if (db && isConnected) return db;
  try {
    console.log("[MongoDB] Connecting...");
    client = new MongoClient(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    const targetDb = client.options.dbName && client.options.dbName !== "test" ? client.options.dbName : "pinkcityhomes";
    db = client.db(targetDb);
    isConnected = true;

    // Ensure geospatial and performance indexes
    const col = db.collection<MongoProperty>("properties");
    await col.createIndex({ location: "2dsphere" });
    await col.createIndex({ propertyId: 1 }, { unique: true });
    await col.createIndex({ listingType: 1, status: 1 });
    await col.createIndex({ locality: 1 });
    await col.createIndex({ price: 1 });
    await col.createIndex({ bhk: 1 });
    await col.createIndex({ sellerId: 1 });
    await col.createIndex({ createdAt: -1 });

    console.log("[MongoDB] Connected successfully");
    console.log(`[MongoDB] Database: ${targetDb}`);
    console.log("[MongoDB] 2dsphere and query indexes verified");
    return db;
  } catch (err) {
    const rawMsg = (err as Error).message || "Unknown error";
    console.error(`[MongoDB] Connection failure: ${rawMsg}`);

    if (rawMsg.includes("Authentication failed") || rawMsg.includes("bad auth")) {
      console.error("[MongoDB ERROR] Reason: Authentication failed. Please verify your MongoDB Atlas username and password.");
    } else if (rawMsg.includes("querySrv ENOTFOUND") || rawMsg.includes("getaddrinfo ENOTFOUND")) {
      console.error("[MongoDB ERROR] Reason: DNS hostname resolution failed. Please verify your cluster domain.");
    } else if (rawMsg.includes("timed out") || rawMsg.includes("ETIMEDOUT") || rawMsg.includes("Server selection timed out")) {
      console.error("[MongoDB ERROR] Reason: Connection timed out. Ensure MongoDB Atlas Network Access allows 0.0.0.0/0 (or your Render outbound IP).");
    } else if (rawMsg.includes("Invalid connection string") || rawMsg.includes("Invalid scheme")) {
      console.error("[MongoDB ERROR] Reason: Invalid connection string scheme. Check that MONGODB_URI begins with mongodb:// or mongodb+srv://.");
    }

    isConnected = false;
    db = null;
    return null;
  }
}

export function getMongoDb(): Db | null {
  return isConnected ? db : null;
}

export function getPropertiesCollection(): Collection<MongoProperty> {
  if (!isConnected || !db) {
    throw new Error("MongoDB properties database is not connected.");
  }
  return db.collection<MongoProperty>("properties");
}

export function formatMongoProperty(doc: MongoProperty) {
  const images = [...(doc.images || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const primary =
    doc.primaryImage ||
    images.find((i) => i.isPrimary)?.path ||
    images[0]?.path ||
    "/defaults/apartment.svg";

  return {
    id: doc.propertyId,
    propertyId: doc.propertyId,
    sellerId: doc.sellerId,
    title: doc.title,
    description: doc.description,
    propertyType: doc.propertyType,
    listingType: doc.listingType,
    projectName: doc.projectName,
    bhk: doc.bhk,
    bedrooms: doc.bedrooms,
    bathrooms: doc.bathrooms,
    price: doc.price,
    carpetArea: doc.carpetArea,
    superBuiltUpArea: doc.superBuiltUpArea ?? doc.carpetArea,
    builtUpArea: doc.builtUpArea ?? doc.superBuiltUpArea ?? doc.carpetArea,
    furnishing: doc.furnishing,
    floor: doc.floor,
    totalFloors: doc.totalFloors,
    parking: doc.parking ?? doc.parkingSlots ?? 0,
    parkingSlots: doc.parkingSlots ?? doc.parking ?? 0,
    amenities: doc.amenities || [],
    address: doc.address,
    locality: doc.locality,
    city: doc.city || "Jaipur",
    latitude: doc.latitude,
    longitude: doc.longitude,
    location: doc.location,
    images,
    primaryImage: primary,
    status: doc.status,
    verified: doc.verified ?? true,
    views: doc.views || 0,
    contactName: doc.contactName,
    contactPhone: doc.contactPhone,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

