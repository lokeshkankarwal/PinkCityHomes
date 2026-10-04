import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
import { sanitizeMongoUri } from "../config/mongo.js";

async function main() {
  const localUri = process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/pinkcityhomes";
  const atlasUri = env.mongoUri;

  console.log("==================================================");
  console.log(" PinkCityHomes — Database Migration to Atlas");
  console.log("==================================================");
  console.log(`Source: ${sanitizeMongoUri(localUri)}`);
  console.log(`Target: ${sanitizeMongoUri(atlasUri)}`);
  console.log("==================================================");

  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    await localClient.connect();
    console.log("[1/3] Connected to local MongoDB successfully.");

    await atlasClient.connect();
    console.log("[2/3] Connected to MongoDB Atlas successfully.");

    const targetDbName = atlasClient.options.dbName && atlasClient.options.dbName !== "test" ? atlasClient.options.dbName : "pinkcityhomes";
    const localDb = localClient.db("pinkcityhomes");
    const atlasDb = atlasClient.db(targetDbName);

    console.log(`[3/3] Migrating collections to Atlas database: '${targetDbName}'...`);

    const collections = [
      "users",
      "seller_profiles",
      "properties",
      "projects",
      "favourites",
      "carts",
      "cart_items",
      "orders",
      "clients",
      "client_interactions",
      "client_property_interests",
      "email_verifications",
      "audit_logs",
      "visits",
    ];

    for (const name of collections) {
      const docs = await localDb.collection(name).find().toArray();
      if (docs.length === 0) {
        console.log(`  - ${name}: 0 documents (skipped)`);
        continue;
      }

      let migrated = 0;
      for (const doc of docs) {
        await atlasDb.collection(name).replaceOne({ _id: doc._id }, doc, { upsert: true });
        migrated++;
      }
      console.log(`  ✓ ${name}: ${migrated} documents migrated/upserted`);
    }

    console.log("\n==================================================");
    console.log("✓ All PinkCityHomes application data migrated to Atlas!");
    console.log("==================================================");
  } catch (err: any) {
    console.error("Migration error:", err.message);
    process.exit(1);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

main();
