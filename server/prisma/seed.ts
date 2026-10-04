import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // PinkCityHomes seed: no demo data.
  // The superadmin account is bootstrapped automatically at server startup
  // using SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables.
  // No demo users, demo properties, or demo agents are seeded.
  console.log("PinkCityHomes seed: nothing to seed. Superadmin is created at server startup.");
}

main()
  .finally(() => prisma.$disconnect());
