import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma, initMongoPrisma } from "./config/prisma.js";
import { connectMongo } from "./config/mongo.js";
import bcrypt from "bcryptjs";

/**
 * Idempotent superadmin bootstrap.
 * - If no superadmin exists, create one.
 * - If the target email already has a SUPERADMIN account, skip.
 * - If an old demo superadmin (different email) exists, disable it and create the real one.
 * Running this multiple times is safe.
 */
async function seedSuperadmin() {
  try {
    if (!env.superadminPassword) {
      console.warn("[startup] SUPERADMIN_PASSWORD is not set. Skipping superadmin bootstrap.");
      return;
    }

    const email = env.superadminEmail.toLowerCase();

    // Check if target superadmin already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Ensure it has the correct role
      if (existing.role !== "SUPERADMIN") {
        await prisma.user.update({ where: { email }, data: { role: "SUPERADMIN", emailVerifiedAt: new Date() } });
        console.log(`[startup] Elevated ${email} to SUPERADMIN`);
      }
      return;
    }

    // Remove any old demo/stale superadmin accounts that are not the target email
    const oldAdmins = await prisma.user.findMany({ where: { role: "SUPERADMIN" } });
    for (const admin of oldAdmins) {
      if (admin.email !== email) {
        // Demote old demo admin rather than deleting (preserves audit trail)
        await prisma.user.update({
          where: { id: admin.id },
          data: { role: "CUSTOMER", emailVerifiedAt: null },
        });
        console.log(`[startup] Demoted old superadmin ${admin.email}`);
      }
    }

    // Create new superadmin
    await prisma.user.create({
      data: {
        email,
        name: "Platform Owner",
        role: "SUPERADMIN",
        emailVerifiedAt: new Date(),
        passwordHash: await bcrypt.hash(env.superadminPassword, 12),
      },
    });
    console.log(`[startup] Created SUPERADMIN: ${email}`);
  } catch (err) {
    console.warn("[startup] Could not bootstrap superadmin (DB may not be ready):", err);
  }
}

async function main() {
  // Connect to MongoDB as exclusive application database
  await connectMongo();
  await initMongoPrisma();
  await seedSuperadmin();

  const app = createApp();
  const port = Number(process.env.PORT || env.port || 4000);
  const host = "0.0.0.0";

  app.listen(port, host, () => {
    console.log(`PinkCityHomes API listening on http://${host}:${port}`);
  });
}

main().catch((e) => {
  console.error("Fatal startup error:", e);
  process.exit(1);
});
