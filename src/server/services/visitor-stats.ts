import { NotFoundError, ValidationError } from "~/lib/errors";
import { prisma } from "~/server/db/client";

export type VisitorPoint = { year: number; month: number; visitorCount: number };

export async function getVisitorStats(args: {
  slug: string;
  fromYearMonth?: string; // YYYY-MM
  toYearMonth?: string;
}) {
  const tr = await prisma.attractionTranslation.findFirst({
    where: { slug: args.slug },
    select: { attractionId: true },
  });
  if (!tr) throw new NotFoundError("Attraction");

  const where: Parameters<typeof prisma.visitorStats.findMany>[0] = {
    where: { attractionId: tr.attractionId },
    orderBy: [{ year: "asc" }, { month: "asc" }],
    take: 200,
  };

  const filterFromTo = (s?: string): { year: number; month: number } | undefined => {
    if (!s) return undefined;
    const [y, m] = s.split("-").map(Number);
    if (!y || !m || m < 1 || m > 12) throw new ValidationError("Invalid YYYY-MM");
    return { year: y, month: m };
  };
  const from = filterFromTo(args.fromYearMonth);
  const to = filterFromTo(args.toYearMonth);
  if (from || to) {
    where.where = { attractionId: tr.attractionId };
    // SQLite/Prisma: combine year+month into integer for comparison
    const conditions: { OR?: unknown[] } = {};
    void conditions;
  }

  const rows = await prisma.visitorStats.findMany(where);
  // Filter in memory for from/to
  const points: VisitorPoint[] = rows
    .filter((r) => {
      if (from && (r.year < from.year || (r.year === from.year && r.month < from.month)))
        return false;
      if (to && (r.year > to.year || (r.year === to.year && r.month > to.month))) return false;
      return true;
    })
    .map((r) => ({ year: r.year, month: r.month, visitorCount: r.visitorCount }));
  const source = rows[0]?.source ?? "Kültür ve Turizm Bakanlığı";
  return {
    attractionId: tr.attractionId,
    source,
    points,
    annual: aggregateYearly(points),
  };
}

function aggregateYearly(points: VisitorPoint[]) {
  const map = new Map<number, number>();
  for (const p of points) map.set(p.year, (map.get(p.year) ?? 0) + p.visitorCount);
  return [...map.entries()].sort(([a], [b]) => a - b).map(([year, total]) => ({ year, total }));
}
