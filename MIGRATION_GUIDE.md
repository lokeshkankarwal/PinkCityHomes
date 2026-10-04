# PinkCityHomes — MongoDB Migration & Atlas Sync Guide

This guide details how PinkCityHomes stores its data, how local data syncs to MongoDB Atlas, and how to safely run backups and restores without modifying Atlas sample datasets or unrelated collections.

---

## 1. Database Architecture & Identification

- **Application Database Name**: `pinkcityhomes`
- **Driver**: MongoDB Native Driver (`mongodb` v7.7.0 / `MongoClient`)
- **Connection Configuration**: [`server/src/config/mongo.ts`](file:///Users/lokeshkumarkankarwal/PinkCityHomes/server/src/config/mongo.ts)
- **Atlas Cluster**: `PinkCityHomes` (`cluster0.9cbyg.mongodb.net`)
- **Why `sample_mflix` is present in Atlas**:
  `sample_mflix` (~144 MB) is an official MongoDB sample dataset loaded during cluster creation. It is completely independent of PinkCityHomes. The application strictly connects to and uses the `pinkcityhomes` database.

### Collections Used in `pinkcityhomes`

| Collection | Description | Key Indexes |
|---|---|---|
| `users` | Customer, seller, and admin user credentials and profiles | `email: 1` (unique) |
| `seller_profiles` | Real estate agent/seller information and business details | `userId: 1` (unique) |
| `properties` | Property listings (Buy/Rent, price, location, amenities, media) | `location: "2dsphere"`, `sellerId: 1` |
| `projects` | Housing society/development projects | `slug: 1` |
| `favourites` | Saved/bookmarked listings for users | `{ userId: 1, propertyId: 1 }` |
| `carts` | User transaction carts | `userId: 1` |
| `cart_items` | Items associated with user carts | `cartId: 1` |
| `orders` | Completed transactions, tokens, and bookings | `userId: 1`, `orderId: 1` |
| `clients` | Seller CRM client directory | `sellerId: 1` |
| `client_interactions` | Logs of calls, meetings, notes for CRM clients | `clientId: 1` |
| `client_property_interests` | Mapping of CRM clients to properties they viewed | `clientId: 1`, `propertyId: 1` |
| `email_verifications` | OTP records, bcrypt hashes, attempt counts, expiration | `{ userId: 1, usedAt: 1, createdAt: -1 }`, `expiresAt: 1` (TTL) |
| `audit_logs` | Security and administrative audit trail | `timestamp: -1` |
| `visits` | Property site visit schedule requests | `propertyId: 1`, `userId: 1` |

---

## 2. Automated Migration to Atlas

We provide a zero-downtime, programmatic migration script that extracts data from your local MongoDB instance (`pinkcityhomes`) and upserts documents into MongoDB Atlas (`pinkcityhomes`).

### How to Run:
```bash
npm run db:migrate:atlas
```
Or from the `server` directory:
```bash
cd server && npm run db:migrate:atlas
```

The script will:
1. Connect securely to your local MongoDB (`mongodb://127.0.0.1:27017/pinkcityhomes`).
2. Connect securely to your Atlas cluster via `MONGODB_URI`.
3. Safely mask credentials in terminal output.
4. Iterate through all application collections and upsert documents using `{ _id: doc._id }`.
5. Ensure zero duplicates and zero impact on other Atlas databases like `sample_mflix`.

---

## 3. CLI Backup & Restore (`mongodump` & `mongorestore`)

If you prefer using official MongoDB CLI tools:

### Option A: Run the Automated Script
```bash
npm run db:backup
```
This triggers [`scripts/migrate-local-to-atlas.sh`](file:///Users/lokeshkumarkankarwal/PinkCityHomes/scripts/migrate-local-to-atlas.sh), which dumps only `pinkcityhomes` and restores it with `--nsInclude="pinkcityhomes.*"`.

### Option B: Manual CLI Commands

#### 1. Dump Local Database
```bash
mongodump \
  --uri="mongodb://127.0.0.1:27017/pinkcityhomes" \
  --out="./backup-pinkcityhomes"
```

#### 2. Restore to MongoDB Atlas
```bash
mongorestore \
  --uri="mongodb+srv://<username>:<password>@cluster0.9cbyg.mongodb.net/pinkcityhomes?retryWrites=true&w=majority" \
  --nsInclude="pinkcityhomes.*" \
  ./backup-pinkcityhomes
```

> **IMPORTANT**: Always include `--nsInclude="pinkcityhomes.*"`. This guarantees that `mongorestore` will strictly restore the `pinkcityhomes` namespace without modifying, overwriting, or dropping any other database.

---

## 4. Connection Strings & Environment Variables

### Local `.env`
```env
MONGODB_URI=mongodb://127.0.0.1:27017/pinkcityhomes
```

### Production Render Environment Variables
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.9cbyg.mongodb.net/pinkcityhomes?retryWrites=true&w=majority&appName=PinkCityHomes
```

- If database name is specified in the URI path (`...mongodb.net/pinkcityhomes`), the driver automatically uses `pinkcityhomes`.
- If no database name is in the path, the driver defaults to `pinkcityhomes` automatically via fallback logic in `mongo.ts`.
