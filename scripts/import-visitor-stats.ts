// Import visitor statistics from a CSV file.
// CSV format: attraction_slug,year,month,visitor_count
// Supports both Turkish and English slugs; fuzzy match on name when slug fails.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "../src/server/db/client";
import { logger } from "../src/lib/logger";
import { turkishNormalize } from "../src/lib/utils";

async function findAttraction(key: string): Promise<string | null> {
  const direct = await prisma.attractionTranslation.findFirst({ where: { slug: key } });
  if (direct) return direct.attractionId;
  // Fuzzy: name match
  const normalized = turkishNormalize(key);
  const all = await prisma.attractionTranslation.findMany({ select: { attractionId: true, name: true } });
  for (const t of all) {
    if (turkishNormalize(t.name).includes(normalized) || normalized.includes(turkishNormalize(t.name))) {
      return t.attractionId;
    }
  }
  return null;
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: pnpm stats:import <csv-path>");
    process.exit(2);
  }
  const abs = resolve(path);
  if (!existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(2);
  }
  const csv = readFileSync(abs, "utf8");
  const lines = csv.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  const header = lines[0]?.toLowerCase() ?? "";
  const startIdx = header.includes("attraction") || header.includes("year") ? 1 : 0;

  let imported = 0;
  let skipped = 0;
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const [slug, yearStr, monthStr, countStr] = line.split(",").map((s) => s.trim());
    if (!slug || !yearStr || !monthStr || !countStr) {
      skipped++;
      continue;
    }
    const year = Number(yearStr);
    const month = Number(monthStr);
    const visitorCount = Number(countStr);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(visitorCount)) {
      skipped++;
      continue;
    }
    const attractionId = await findAttraction(slug);
    if (!attractionId) {
      logger.warn({ slug }, "no attraction match — skipping");
      skipped++;
      continue;
    }
    await prisma.visitorStats.upsert({
      where: { attractionId_year_month: { attractionId, year, month } },
      create: {
        attractionId,
        year,
        month,
        visitorCount,
        source: "Kültür ve Turizm Bakanlığı",
      },
      update: { visitorCount, source: "Kültür ve Turizm Bakanlığı" },
    });
    imported++;
  }
  logger.info({ imported, skipped }, "visitor stats import done");
}

main()
  .catch((err) => {
    logger.error({ err }, "import failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
