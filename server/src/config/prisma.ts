import { MongoClient, type Db, type Collection, type Filter } from "mongodb";
import { randomBytes } from "node:crypto";
import { env } from "./env.js";

// Common Enums
export type Role = "CUSTOMER" | "SELLER" | "SUPERADMIN";
export type SellerApprovalStatus = "PENDING_VERIFICATION" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type PropertyStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "SOLD";
export type PropertyType = "APARTMENT" | "VILLA" | "INDEPENDENT_HOUSE" | "PLOT" | "BUILDER_FLOOR";
export type Furnishing = "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";
export type InterestLevel = "HIGH" | "MEDIUM" | "LOW";
export type InteractionType = "CALL" | "VISIT" | "NOTE" | "FOLLOW_UP" | "WHATSAPP" | "EMAIL";
export type VisitStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type OrderStatus = "INITIATED" | "SOLD";

function genId(prefix = "c"): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function initMongoPrisma(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  await client.connect();
  db = client.db();

  // Initialize unique indexes
  try {
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ id: 1 }, { unique: true });
    await db.collection("seller_profiles").createIndex({ userId: 1 }, { unique: true });
    await db.collection("seller_profiles").createIndex({ id: 1 }, { unique: true });
    await db.collection("favourites").createIndex({ userId: 1, propertyId: 1 }, { unique: true });
    await db.collection("carts").createIndex({ userId: 1 }, { unique: true });
    await db.collection("cart_items").createIndex({ cartId: 1, propertyId: 1 }, { unique: true });
    await db.collection("client_property_interests").createIndex({ clientId: 1, propertyId: 1 }, { unique: true });
    await db.collection("projects").createIndex({ name: 1 }, { unique: true });
  } catch (err) {
    // Indexes already exist or soft error
  }

  return db;
}

function getDb(): Db {
  if (!db) {
    client = new MongoClient(env.mongoUri);
    client.connect().catch((e) => console.error("[MongoDB DB] connect error:", e));
    db = client.db();
  }
  return db;
}

function transformWhere(where: any): Filter<any> {
  if (!where) return {};
  const query: any = {};

  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key === "OR" && Array.isArray(val)) {
      query.$or = val.map(transformWhere);
      continue;
    }

    if (key === "userId_propertyId" && typeof val === "object" && val !== null) {
      const pair = val as { userId: string; propertyId: string };
      query.userId = pair.userId;
      query.propertyId = pair.propertyId;
      continue;
    }

    if (key === "cartId_propertyId" && typeof val === "object" && val !== null) {
      const pair = val as { cartId: string; propertyId: string };
      query.cartId = pair.cartId;
      query.propertyId = pair.propertyId;
      continue;
    }

    if (key === "clientId_propertyId" && typeof val === "object" && val !== null) {
      const pair = val as { clientId: string; propertyId: string };
      query.clientId = pair.clientId;
      query.propertyId = pair.propertyId;
      continue;
    }

    if (typeof val === "object" && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
      const subVal = val as any;
      if ("in" in subVal) {
        query[key] = { $in: subVal.in };
      } else if ("contains" in subVal) {
        query[key] = { $regex: new RegExp(escapeRegex(subVal.contains), subVal.mode === "insensitive" ? "i" : "") };
      } else if ("equals" in subVal && subVal.mode === "insensitive") {
        query[key] = { $regex: new RegExp(`^${escapeRegex(subVal.equals)}$`, "i") };
      } else if ("equals" in subVal) {
        query[key] = subVal.equals;
      } else if ("gte" in subVal) {
        query[key] = { ...(query[key] || {}), $gte: subVal.gte };
      } else if ("lte" in subVal) {
        query[key] = { ...(query[key] || {}), $lte: subVal.lte };
      } else if ("gt" in subVal) {
        query[key] = { ...(query[key] || {}), $gt: subVal.gt };
      } else if ("lt" in subVal) {
        query[key] = { ...(query[key] || {}), $lt: subVal.lt };
      } else {
        query[key] = subVal;
      }
    } else {
      query[key] = val;
    }
  }

  return query;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeDoc<T = any>(doc: any): T | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest as T;
}

export const prisma = {
  user: {
    async findUnique(args: { where: { id?: string; email?: string }; select?: any; include?: any }): Promise<any> {
      const col = getDb().collection("users");
      const where: any = {};
      if (args.where.id) where.id = args.where.id;
      if (args.where.email) where.email = args.where.email.toLowerCase();
      const doc = await col.findOne(where);
      if (!doc) return null;
      const user = sanitizeDoc<any>(doc);
      if (args.include?.sellerProfile && user) {
        const sp = await getDb().collection("seller_profiles").findOne({ userId: user.id });
        user.sellerProfile = sanitizeDoc(sp);
      }
      return user;
    },

    async findFirst(args: { where: any; include?: any }): Promise<any> {
      const col = getDb().collection("users");
      const doc = await col.findOne(transformWhere(args.where));
      if (!doc) return null;
      const user = sanitizeDoc<any>(doc);
      if (args.include?.sellerProfile && user) {
        const sp = await getDb().collection("seller_profiles").findOne({ userId: user.id });
        user.sellerProfile = sanitizeDoc(sp);
      }
      return user;
    },

    async findMany(args?: { where?: any; select?: any; orderBy?: any; include?: any }): Promise<any[]> {
      const col = getDb().collection("users");
      const cursor = col.find(transformWhere(args?.where));
      if (args?.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      const docs = await cursor.toArray();
      const users = docs.map(sanitizeDoc).filter(Boolean) as any[];

      if (args?.include?.sellerProfile) {
        const userIds = users.map((u) => u.id);
        const profiles = await getDb()
          .collection("seller_profiles")
          .find({ userId: { $in: userIds } })
          .toArray();
        const profMap = new Map(profiles.map((p) => [p.userId, sanitizeDoc(p)]));
        users.forEach((u) => {
          u.sellerProfile = profMap.get(u.id) || null;
        });
      }

      return users;
    },

    async create(args: { data: any; include?: any }): Promise<any> {
      const col = getDb().collection("users");
      const now = new Date();
      const doc = {
        id: args.data.id || genId("usr"),
        email: args.data.email.toLowerCase(),
        passwordHash: args.data.passwordHash,
        name: args.data.name,
        phone: args.data.phone || null,
        avatarUrl: args.data.avatarUrl || null,
        role: args.data.role || "CUSTOMER",
        emailVerifiedAt: args.data.emailVerifiedAt || null,
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(doc);
      const user = sanitizeDoc<any>(doc);

      if (args.include?.sellerProfile && user) {
        const sp = await getDb().collection("seller_profiles").findOne({ userId: user.id });
        user.sellerProfile = sanitizeDoc(sp);
      }
      return user;
    },

    async update(args: { where: { id?: string; email?: string }; data: any; include?: any }): Promise<any> {
      const col = getDb().collection("users");
      const where: any = {};
      if (args.where.id) where.id = args.where.id;
      if (args.where.email) where.email = args.where.email.toLowerCase();

      const updateData: any = { ...args.data, updatedAt: new Date() };
      if (updateData.email) updateData.email = updateData.email.toLowerCase();

      await col.updateOne(where, { $set: updateData });
      const doc = await col.findOne(where);
      const user = sanitizeDoc<any>(doc);

      if (args.include?.sellerProfile && user) {
        const sp = await getDb().collection("seller_profiles").findOne({ userId: user.id });
        user.sellerProfile = sanitizeDoc(sp);
      }
      return user;
    },

    async count(args?: { where?: any }): Promise<number> {
      const col = getDb().collection("users");
      return col.countDocuments(transformWhere(args?.where));
    },
  },

  sellerProfile: {
    async findUnique(args: { where: { userId?: string; id?: string }; include?: any }): Promise<any> {
      const col = getDb().collection("seller_profiles");
      const where: any = {};
      if (args.where.userId) where.userId = args.where.userId;
      if (args.where.id) where.id = args.where.id;
      const doc = await col.findOne(where);
      if (!doc) return null;
      const profile = sanitizeDoc<any>(doc);
      if (args.include?.user && profile) {
        const u = await getDb().collection("users").findOne({ id: profile.userId });
        profile.user = sanitizeDoc(u);
      }
      return profile;
    },

    async findFirst(args: { where: any; include?: any }): Promise<any> {
      const col = getDb().collection("seller_profiles");
      const doc = await col.findOne(transformWhere(args.where));
      if (!doc) return null;
      const profile = sanitizeDoc<any>(doc);
      if (args.include?.user && profile) {
        const u = await getDb().collection("users").findOne({ id: profile.userId });
        profile.user = sanitizeDoc(u);
      }
      return profile;
    },

    async findMany(args?: { where?: any; include?: any; orderBy?: any }): Promise<any[]> {
      const col = getDb().collection("seller_profiles");
      const cursor = col.find(transformWhere(args?.where));
      if (args?.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      const docs = await cursor.toArray();
      const profiles = docs.map(sanitizeDoc).filter(Boolean) as any[];

      if (args?.include?.user) {
        const userIds = profiles.map((p) => p.userId);
        const users = await getDb()
          .collection("users")
          .find({ id: { $in: userIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u.id, sanitizeDoc(u)]));
        profiles.forEach((p) => {
          p.user = userMap.get(p.userId) || null;
        });
      }
      return profiles;
    },

    async create(args: { data: any }): Promise<any> {
      const col = getDb().collection("seller_profiles");
      const now = new Date();
      const doc = {
        id: args.data.id || genId("sp"),
        userId: args.data.userId,
        companyName: args.data.companyName || null,
        licenseNumber: args.data.licenseNumber || null,
        status: args.data.status || "PENDING_VERIFICATION",
        rejectionReason: args.data.rejectionReason || null,
        approvedAt: args.data.approvedAt || null,
        approvedById: args.data.approvedById || null,
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async update(args: { where: { id?: string; userId?: string }; data: any }): Promise<any> {
      const col = getDb().collection("seller_profiles");
      const where: any = {};
      if (args.where.id) where.id = args.where.id;
      if (args.where.userId) where.userId = args.where.userId;
      await col.updateOne(where, { $set: { ...args.data, updatedAt: new Date() } });
      const doc = await col.findOne(where);
      return sanitizeDoc(doc);
    },

    async upsert(args: { where: { userId: string }; update: any; create: any }): Promise<any> {
      const col = getDb().collection("seller_profiles");
      const existing = await col.findOne({ userId: args.where.userId });
      if (existing) {
        await col.updateOne({ userId: args.where.userId }, { $set: { ...args.update, updatedAt: new Date() } });
        return sanitizeDoc(await col.findOne({ userId: args.where.userId }));
      }
      const now = new Date();
      const doc = {
        id: genId("sp"),
        userId: args.where.userId,
        ...args.create,
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async count(args?: { where?: any }): Promise<number> {
      const col = getDb().collection("seller_profiles");
      return col.countDocuments(transformWhere(args?.where));
    },
  },

  emailVerification: {
    async findFirst(args: { where: any; orderBy?: any }): Promise<any> {
      const col = getDb().collection("email_verifications");
      const cursor = col.find(transformWhere(args.where));
      if (args.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      const doc = await cursor.limit(1).next();
      return sanitizeDoc(doc);
    },

    async create(args: { data: any }): Promise<any> {
      const col = getDb().collection("email_verifications");
      const doc = {
        id: genId("ev"),
        userId: args.data.userId,
        otpHash: args.data.otpHash,
        expiresAt: args.data.expiresAt,
        usedAt: null,
        attempts: 0,
        createdAt: new Date(),
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async update(args: { where: { id: string }; data: any }): Promise<any> {
      const col = getDb().collection("email_verifications");
      await col.updateOne({ id: args.where.id }, { $set: args.data });
      const doc = await col.findOne({ id: args.where.id });
      return sanitizeDoc(doc);
    },

    async deleteMany(args: { where: any }): Promise<{ count: number }> {
      const col = getDb().collection("email_verifications");
      const res = await col.deleteMany(transformWhere(args.where));
      return { count: res.deletedCount };
    },
  },

  favourite: {
    async findMany(args: { where: { userId: string }; orderBy?: any }): Promise<any[]> {
      const col = getDb().collection("favourites");
      const cursor = col.find({ userId: args.where.userId });
      if (args.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      const docs = await cursor.toArray();
      return docs.map(sanitizeDoc);
    },

    async upsert(args: { where: { userId_propertyId: { userId: string; propertyId: string } }; update: any; create: any }): Promise<any> {
      const col = getDb().collection("favourites");
      const { userId, propertyId } = args.where.userId_propertyId;
      const existing = await col.findOne({ userId, propertyId });
      if (existing) return sanitizeDoc(existing);
      const doc = {
        id: genId("fav"),
        userId,
        propertyId,
        createdAt: new Date(),
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async deleteMany(args: { where: any }): Promise<{ count: number }> {
      const col = getDb().collection("favourites");
      const res = await col.deleteMany(transformWhere(args.where));
      return { count: res.deletedCount };
    },

    async count(args?: { where?: any }): Promise<number> {
      const col = getDb().collection("favourites");
      return col.countDocuments(transformWhere(args?.where));
    },
  },

  cart: {
    async findUnique(args: { where: { userId: string }; include?: any }): Promise<any> {
      const col = getDb().collection("carts");
      const doc = await col.findOne({ userId: args.where.userId });
      if (!doc) return null;
      const cart = sanitizeDoc<any>(doc);
      if (args.include?.items && cart) {
        const items = await getDb().collection("cart_items").find({ cartId: cart.id }).toArray();
        cart.items = items.map(sanitizeDoc);
      }
      return cart;
    },

    async upsert(args: { where: { userId: string }; update: any; create: any; include?: any }): Promise<any> {
      const col = getDb().collection("carts");
      let doc = await col.findOne({ userId: args.where.userId });
      if (!doc) {
        const newCart = {
          id: genId("cart"),
          userId: args.where.userId,
          updatedAt: new Date(),
        };
        await col.insertOne(newCart);
        doc = newCart as any;
      }
      const cart = sanitizeDoc<any>(doc);
      if (args.include?.items && cart) {
        const items = await getDb().collection("cart_items").find({ cartId: cart.id }).toArray();
        cart.items = items.map(sanitizeDoc);
      }
      return cart;
    },
  },

  cartItem: {
    async findMany(args: { where: { cartId: string } }): Promise<any[]> {
      const col = getDb().collection("cart_items");
      const docs = await col.find({ cartId: args.where.cartId }).toArray();
      return docs.map(sanitizeDoc);
    },

    async upsert(args: { where: { cartId_propertyId: { cartId: string; propertyId: string } }; update: any; create: any }): Promise<any> {
      const col = getDb().collection("cart_items");
      const { cartId, propertyId } = args.where.cartId_propertyId;
      const existing = await col.findOne({ cartId, propertyId });
      if (existing) return sanitizeDoc(existing);
      const doc = {
        id: genId("ci"),
        cartId,
        propertyId,
        createdAt: new Date(),
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async deleteMany(args: { where: any }): Promise<{ count: number }> {
      const col = getDb().collection("cart_items");
      const res = await col.deleteMany(transformWhere(args.where));
      return { count: res.deletedCount };
    },
  },

  client: {
    async findFirst(args: { where: any; include?: any }): Promise<any> {
      const col = getDb().collection("clients");
      const doc = await col.findOne(transformWhere(args.where));
      if (!doc) return null;
      const client = sanitizeDoc<any>(doc);
      if (args.include && client) {
        if (args.include.interests) {
          const interests = await getDb().collection("client_property_interests").find({ clientId: client.id }).toArray();
          client.interests = interests.map(sanitizeDoc);
        }
        if (args.include.interactions) {
          const interactions = await getDb().collection("client_interactions").find({ clientId: client.id }).toArray();
          client.interactions = interactions.map(sanitizeDoc);
        }
        if (args.include.visits) {
          const visits = await getDb().collection("property_visits").find({ clientId: client.id }).toArray();
          client.visits = visits.map(sanitizeDoc);
        }
      }
      return client;
    },

    async findMany(args: { where: any; include?: any; orderBy?: any }): Promise<any[]> {
      const col = getDb().collection("clients");
      const cursor = col.find(transformWhere(args.where));
      if (args.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      const docs = await cursor.toArray();
      const clients = docs.map(sanitizeDoc).filter(Boolean) as any[];

      if (args.include && clients.length > 0) {
        const clientIds = clients.map((c) => c.id);
        const [interests, interactions, visits] = await Promise.all([
          args.include.interests ? getDb().collection("client_property_interests").find({ clientId: { $in: clientIds } }).toArray() : [],
          args.include.interactions ? getDb().collection("client_interactions").find({ clientId: { $in: clientIds } }).toArray() : [],
          args.include.visits ? getDb().collection("property_visits").find({ clientId: { $in: clientIds } }).toArray() : [],
        ]);

        const intMap = new Map<string, any[]>();
        interests.forEach((item) => {
          const list = intMap.get(item.clientId) || [];
          list.push(sanitizeDoc(item));
          intMap.set(item.clientId, list);
        });

        const actMap = new Map<string, any[]>();
        interactions.forEach((item) => {
          const list = actMap.get(item.clientId) || [];
          list.push(sanitizeDoc(item));
          actMap.set(item.clientId, list);
        });

        const visMap = new Map<string, any[]>();
        visits.forEach((item) => {
          const list = visMap.get(item.clientId) || [];
          list.push(sanitizeDoc(item));
          visMap.set(item.clientId, list);
        });

        clients.forEach((c) => {
          if (args.include.interests) c.interests = intMap.get(c.id) || [];
          if (args.include.interactions) c.interactions = actMap.get(c.id) || [];
          if (args.include.visits) c.visits = visMap.get(c.id) || [];
        });
      }

      return clients;
    },

    async create(args: { data: any }): Promise<any> {
      const col = getDb().collection("clients");
      const now = new Date();
      const doc = {
        id: genId("cl"),
        sellerId: args.data.sellerId,
        name: args.data.name,
        phone: args.data.phone,
        email: args.data.email || null,
        notes: args.data.notes || null,
        interestLevel: args.data.interestLevel || "MEDIUM",
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async update(args: { where: { id: string }; data: any }): Promise<any> {
      const col = getDb().collection("clients");
      await col.updateOne({ id: args.where.id }, { $set: { ...args.data, updatedAt: new Date() } });
      const doc = await col.findOne({ id: args.where.id });
      return sanitizeDoc(doc);
    },

    async delete(args: { where: { id: string } }): Promise<any> {
      const col = getDb().collection("clients");
      const doc = await col.findOne({ id: args.where.id });
      await col.deleteOne({ id: args.where.id });
      return sanitizeDoc(doc);
    },

    async count(args?: { where?: any }): Promise<number> {
      const col = getDb().collection("clients");
      return col.countDocuments(transformWhere(args?.where));
    },
  },

  clientPropertyInterest: {
    async findMany(args?: { where?: any }): Promise<any[]> {
      const col = getDb().collection("client_property_interests");
      const docs = await col.find(transformWhere(args?.where)).toArray();
      return docs.map(sanitizeDoc);
    },

    async upsert(args: { where: { clientId_propertyId: { clientId: string; propertyId: string } }; update: any; create: any }): Promise<any> {
      const col = getDb().collection("client_property_interests");
      const { clientId, propertyId } = args.where.clientId_propertyId;
      const existing = await col.findOne({ clientId, propertyId });
      if (existing) {
        await col.updateOne({ clientId, propertyId }, { $set: { ...args.update, updatedAt: new Date() } });
        return sanitizeDoc(await col.findOne({ clientId, propertyId }));
      }
      const now = new Date();
      const doc = {
        id: genId("cpi"),
        clientId,
        propertyId,
        ...args.create,
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async deleteMany(args?: { where?: any }): Promise<{ count: number }> {
      const col = getDb().collection("client_property_interests");
      const res = await col.deleteMany(transformWhere(args?.where));
      return { count: res.deletedCount };
    },
  },

  clientInteraction: {
    async findMany(args: { where: any; include?: any; orderBy?: any; take?: number }): Promise<any[]> {
      const col = getDb().collection("client_interactions");
      const cursor = col.find(transformWhere(args.where));
      if (args.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      if (args.take) {
        cursor.limit(args.take);
      }
      const docs = await cursor.toArray();
      const interactions = docs.map(sanitizeDoc).filter(Boolean) as any[];

      if (args.include?.client && interactions.length > 0) {
        const clientIds = interactions.map((i) => i.clientId);
        const clients = await getDb()
          .collection("clients")
          .find({ id: { $in: clientIds } })
          .toArray();
        const clientMap = new Map(clients.map((c) => [c.id, sanitizeDoc(c)]));
        interactions.forEach((i) => {
          i.client = clientMap.get(i.clientId) || null;
        });
      }
      return interactions;
    },

    async create(args: { data: any }): Promise<any> {
      const col = getDb().collection("client_interactions");
      const doc = {
        id: genId("ci"),
        clientId: args.data.clientId,
        propertyId: args.data.propertyId || null,
        sellerId: args.data.sellerId,
        type: args.data.type,
        notes: args.data.notes,
        timestamp: args.data.timestamp || new Date(),
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },
  },

  propertyVisit: {
    async findFirst(args: { where: any; include?: any }): Promise<any> {
      const col = getDb().collection("property_visits");
      const doc = await col.findOne(transformWhere(args.where));
      if (!doc) return null;
      const visit = sanitizeDoc<any>(doc);
      if (args.include?.client && visit) {
        const c = await getDb().collection("clients").findOne({ id: visit.clientId });
        visit.client = sanitizeDoc(c);
      }
      return visit;
    },

    async findMany(args: { where: any; include?: any; orderBy?: any; take?: number }): Promise<any[]> {
      const col = getDb().collection("property_visits");
      const cursor = col.find(transformWhere(args.where));
      if (args.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      if (args.take) {
        cursor.limit(args.take);
      }
      const docs = await cursor.toArray();
      const visits = docs.map(sanitizeDoc).filter(Boolean) as any[];

      if (args.include?.client && visits.length > 0) {
        const clientIds = visits.map((v) => v.clientId);
        const clients = await getDb()
          .collection("clients")
          .find({ id: { $in: clientIds } })
          .toArray();
        const clientMap = new Map(clients.map((c) => [c.id, sanitizeDoc(c)]));
        visits.forEach((v) => {
          v.client = clientMap.get(v.clientId) || null;
        });
      }
      return visits;
    },

    async create(args: { data: any }): Promise<any> {
      const col = getDb().collection("property_visits");
      const now = new Date();
      const doc = {
        id: genId("pv"),
        clientId: args.data.clientId,
        propertyId: args.data.propertyId,
        sellerId: args.data.sellerId,
        scheduledAt: args.data.scheduledAt,
        status: args.data.status || "SCHEDULED",
        notes: args.data.notes || null,
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async update(args: { where: { id: string }; data: any }): Promise<any> {
      const col = getDb().collection("property_visits");
      await col.updateOne({ id: args.where.id }, { $set: { ...args.data, updatedAt: new Date() } });
      const doc = await col.findOne({ id: args.where.id });
      return sanitizeDoc(doc);
    },

    async count(args?: { where?: any }): Promise<number> {
      const col = getDb().collection("property_visits");
      return col.countDocuments(transformWhere(args?.where));
    },

    async deleteMany(args?: { where?: any }): Promise<{ count: number }> {
      const col = getDb().collection("property_visits");
      const res = await col.deleteMany(transformWhere(args?.where));
      return { count: res.deletedCount };
    },
  },

  order: {
    async findMany(args?: { where?: any; include?: any; orderBy?: any }): Promise<any[]> {
      const col = getDb().collection("orders");
      const cursor = col.find(transformWhere(args?.where));
      if (args?.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      const docs = await cursor.toArray();
      const orders = docs.map(sanitizeDoc).filter(Boolean) as any[];

      if (args?.include?.customer && orders.length > 0) {
        const userIds = orders.map((o) => o.customerId).filter(Boolean);
        const users = await getDb()
          .collection("users")
          .find({ id: { $in: userIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u.id, sanitizeDoc(u)]));
        orders.forEach((o) => {
          o.customer = o.customerId ? userMap.get(o.customerId) || null : null;
        });
      }
      return orders;
    },

    async create(args: { data: any }): Promise<any> {
      const col = getDb().collection("orders");
      const doc = {
        id: genId("ord"),
        customerId: args.data.customerId || null,
        propertyId: args.data.propertyId,
        status: args.data.status || "INITIATED",
        soldPrice: args.data.soldPrice,
        createdAt: new Date(),
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async count(args?: { where?: any }): Promise<number> {
      const col = getDb().collection("orders");
      return col.countDocuments(transformWhere(args?.where));
    },
  },

  project: {
    async findUnique(args: { where: { id?: string; name?: string }; include?: any }): Promise<any> {
      const col = getDb().collection("projects");
      const where: any = {};
      if (args.where.id) where.id = args.where.id;
      if (args.where.name) where.name = args.where.name;
      const doc = await col.findOne(where);
      if (!doc) return null;
      const project = sanitizeDoc<any>(doc);
      if (args.include?.seller && project?.sellerId) {
        const u = await getDb().collection("users").findOne({ id: project.sellerId });
        project.seller = sanitizeDoc(u);
      }
      return project;
    },

    async findFirst(args: { where: any; include?: any }): Promise<any> {
      const col = getDb().collection("projects");
      const doc = await col.findOne(transformWhere(args.where));
      if (!doc) return null;
      const project = sanitizeDoc<any>(doc);
      if (args.include?.seller && project?.sellerId) {
        const u = await getDb().collection("users").findOne({ id: project.sellerId });
        project.seller = sanitizeDoc(u);
      }
      return project;
    },

    async findMany(args?: { where?: any; orderBy?: any; include?: any }): Promise<any[]> {
      const col = getDb().collection("projects");
      const cursor = col.find(transformWhere(args?.where));
      if (args?.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      const docs = await cursor.toArray();
      const projects = docs.map(sanitizeDoc).filter(Boolean) as any[];

      if (args?.include?.seller && projects.length > 0) {
        const sellerIds = projects.map((p) => p.sellerId).filter(Boolean);
        const users = await getDb()
          .collection("users")
          .find({ id: { $in: sellerIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u.id, sanitizeDoc(u)]));
        projects.forEach((p) => {
          p.seller = p.sellerId ? userMap.get(p.sellerId) || null : null;
        });
      }
      return projects;
    },

    async upsert(args: { where: { name: string }; update: any; create: any }): Promise<any> {
      const col = getDb().collection("projects");
      const existing = await col.findOne({ name: args.where.name });
      if (existing) {
        await col.updateOne({ name: args.where.name }, { $set: { ...args.update, updatedAt: new Date() } });
        return sanitizeDoc(await col.findOne({ name: args.where.name }));
      }
      const now = new Date();
      const doc = {
        id: genId("proj"),
        name: args.where.name,
        ...args.create,
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async delete(args: { where: { id: string } }): Promise<any> {
      const col = getDb().collection("projects");
      const doc = await col.findOne({ id: args.where.id });
      await col.deleteOne({ id: args.where.id });
      return sanitizeDoc(doc);
    },

    async count(args?: { where?: any }): Promise<number> {
      const col = getDb().collection("projects");
      return col.countDocuments(transformWhere(args?.where));
    },
  },

  auditLog: {
    async create(args: { data: any }): Promise<any> {
      const col = getDb().collection("audit_logs");
      const doc = {
        id: genId("log"),
        actorId: args.data.actorId || null,
        action: args.data.action,
        entityType: args.data.entityType,
        entityId: args.data.entityId || null,
        metadata: args.data.metadata || null,
        createdAt: new Date(),
      };
      await col.insertOne(doc);
      return sanitizeDoc(doc);
    },

    async findMany(args?: { where?: any; orderBy?: any; take?: number; include?: any }): Promise<any[]> {
      const col = getDb().collection("audit_logs");
      const cursor = col.find(transformWhere(args?.where));
      if (args?.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor.sort(sort);
      }
      if (args?.take) cursor.limit(args.take);
      const docs = await cursor.toArray();
      const logs = docs.map(sanitizeDoc).filter(Boolean) as any[];

      if (args?.include?.actor && logs.length > 0) {
        const actorIds = logs.map((l) => l.actorId).filter(Boolean);
        const users = await getDb()
          .collection("users")
          .find({ id: { $in: actorIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u.id, sanitizeDoc(u)]));
        logs.forEach((l) => {
          l.actor = l.actorId ? userMap.get(l.actorId) || null : null;
        });
      }
      return logs;
    },
  },
};
