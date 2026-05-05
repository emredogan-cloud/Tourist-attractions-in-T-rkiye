// Seed entry. Phase 1 expands this with curated attractions.
// For Phase 0 it's a no-op so `pnpm db:seed` succeeds on a fresh DB.
import { prisma } from "../src/server/db/client";
import { logger } from "../src/lib/logger";

async function main() {
  logger.info({ event: "seed.start" }, "starting seed");
  // Phase 1 will populate Categories, Regions, Provinces, and the curated 5+ attractions.
  // Until then, just verify the connection.
  await prisma.$queryRawUnsafe("SELECT 1");
  logger.info({ event: "seed.ok" }, "seed completed (no-op until Phase 1)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    logger.error({ err }, "seed failed");
    await prisma.$disconnect();
    process.exit(1);
  });
