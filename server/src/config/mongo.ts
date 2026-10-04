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

export async function connectMongo(): Promise<Db | null> {
  if (db && isConnected) return db;
  try {
    client = new MongoClient(env.mongoUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db();
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

    console.log("[MongoDB] Connected successfully to primary properties database. 2dsphere verified.");
    return db;
  } catch (err) {
    console.error("[MongoDB] Connection error:", (err as Error).message);
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

