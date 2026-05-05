import type { Prisma } from "@prisma/client";
import { prisma } from "~/server/db/client";
import { ValidationError } from "~/lib/errors";
import type { Locale } from "~/lib/i18n/config";
import { haversineKm } from "~/lib/utils";

const ATTRACTION_INCLUDE = {
  category: true,
  region: true,
  province: true,
  translations: true,
  media: { where: { isHero: true }, take: 1 },
} satisfies Prisma.AttractionInclude;

type AttractionRow = Prisma.AttractionGetPayload<{ include: typeof ATTRACTION_INCLUDE }>;

export type Preferences = {
  themeInterests: string[];
  preferredRegions: string[];
  budgetTier: "BUDGET" | "MID" | "LUXURY" | null;
  travelStyle: "FAST" | "RELAXED" | "BALANCED" | null;
  groupType: "SOLO" | "COUPLE" | "FAMILY" | "FRIENDS" | null;
};

export async function setPreferences(args: { userId: string; prefs: Preferences }) {
  validatePrefs(args.prefs);
  await prisma.userPreference.upsert({
    where: { userId: args.userId },
    create: {
      userId: args.userId,
      themeInterests: JSON.stringify(args.prefs.themeInterests),
      preferredRegions: JSON.stringify(args.prefs.preferredRegions),
      budgetTier: args.prefs.budgetTier,
      travelStyle: args.prefs.travelStyle,
      groupType: args.prefs.groupType,
    },
    update: {
      themeInterests: JSON.stringify(args.prefs.themeInterests),
      preferredRegions: JSON.stringify(args.prefs.preferredRegions),
      budgetTier: args.prefs.budgetTier,
      travelStyle: args.prefs.travelStyle,
      groupType: args.prefs.groupType,
      updatedAt: new Date(),
    },
  });
}

export async function getPreferences(userId: string): Promise<Preferences | null> {
  const row = await prisma.userPreference.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    themeInterests: row.themeInterests ? (JSON.parse(row.themeInterests) as string[]) : [],
    preferredRegions: row.preferredRegions ? (JSON.parse(row.preferredRegions) as string[]) : [],
    budgetTier: (row.budgetTier as Preferences["budgetTier"]) ?? null,
    travelStyle: (row.travelStyle as Preferences["travelStyle"]) ?? null,
    groupType: (row.groupType as Preferences["groupType"]) ?? null,
  };
}

function validatePrefs(p: Preferences) {
  if (p.themeInterests.length > 8) throw new ValidationError("Too many themes");
  if (p.preferredRegions.length > 7) throw new ValidationError("Too many regions");
}

export async function recommendForUser(args: { userId: string | null; locale: Locale; limit?: number }) {
  const limit = args.limit ?? 8;
  const [prefs, favorites, recentReviews] = args.userId
    ? await Promise.all([
        getPreferences(args.userId),
        prisma.favorite.findMany({
          where: { userId: args.userId },
          include: { attraction: { include: ATTRACTION_INCLUDE } },
          take: 50,
        }),
        prisma.review.findMany({
          where: { userId: args.userId, status: "APPROVED" },
          include: { attraction: { include: ATTRACTION_INCLUDE } },
          take: 50,
        }),
      ])
    : [null, [], []];

  // Build a profile vector: category counts, region counts.
  const themeVec = new Map<string, number>();
  const regionVec = new Map<string, number>();
  for (const f of favorites) {
    bump(themeVec, f.attraction.category.code, 2);
    bump(regionVec, f.attraction.region.code, 1.5);
  }
  for (const r of recentReviews) {
    bump(themeVec, r.attraction.category.code, 1.5);
    bump(regionVec, r.attraction.region.code, 1);
  }
  if (prefs) {
    for (const t of prefs.themeInterests) bump(themeVec, t, 3);
    for (const r of prefs.preferredRegions) bump(regionVec, r, 2.5);
  }

  // Cold start: fall back to popularity if no signal.
  if (themeVec.size === 0 && regionVec.size === 0) {
    return prisma.attraction
      .findMany({
        where: { status: "PUBLISHED" },
        include: ATTRACTION_INCLUDE,
        orderBy: [{ popularityScore: "desc" }, { averageRating: "desc" }],
        take: limit,
      })
      .then((rows) => rows.map((r) => mapToOut(r, args.locale)));
  }

  const candidates = await prisma.attraction.findMany({
    where: { status: "PUBLISHED" },
    include: ATTRACTION_INCLUDE,
    take: 200,
  });
  const seen = new Set<string>([
    ...favorites.map((f) => f.attractionId),
    ...recentReviews.map((r) => r.attractionId),
  ]);
  const scored = candidates
    .filter((c) => !seen.has(c.id))
    .map((c) => {
      const themeScore = themeVec.get(c.category.code) ?? 0;
      const regionScore = regionVec.get(c.region.code) ?? 0;
      const score = themeScore * 1.4 + regionScore + c.popularityScore * 0.6 + c.averageRating * 0.4;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c }) => mapToOut(c, args.locale));
  return scored;
}

export async function similarTo(args: { attractionId: string; locale: Locale; limit?: number }) {
  const limit = args.limit ?? 6;
  const seed = await prisma.attraction.findUnique({
    where: { id: args.attractionId },
    include: ATTRACTION_INCLUDE,
  });
  if (!seed) return [];
  const candidates = await prisma.attraction.findMany({
    where: { status: "PUBLISHED", id: { not: seed.id } },
    include: ATTRACTION_INCLUDE,
    take: 200,
  });
  return candidates
    .map((c) => {
      let s = 0;
      if (c.category.code === seed.category.code) s += 5;
      if (c.region.code === seed.region.code) s += 2;
      if (c.unescoStatus && seed.unescoStatus) s += 1;
      const km = haversineKm(
        { lat: c.latitude, lng: c.longitude },
        { lat: seed.latitude, lng: seed.longitude },
      );
      if (km < 200) s += 3;
      else if (km < 500) s += 1;
      s += c.averageRating * 0.5 + c.popularityScore * 0.4;
      return { c, score: s };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c }) => mapToOut(c, args.locale));
}

function bump(map: Map<string, number>, key: string, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function mapToOut(row: AttractionRow, locale: Locale) {
  const tr =
    row.translations.find((t) => t.locale === locale) ??
    row.translations.find((t) => t.locale === "tr") ??
    row.translations[0];
  const hero = row.media[0];
  return {
    id: row.id,
    slug: tr?.slug ?? row.id,
    name: tr?.name ?? "",
    summary: tr?.summary ?? "",
    category: { code: row.category.code, name: row.category.code },
    region: { code: row.region.code, name: locale === "en" ? row.region.nameEn : row.region.nameTr },
    province: { slug: row.province.slug, name: locale === "en" ? row.province.nameEn : row.province.nameTr },
    district: row.district,
    latitude: row.latitude,
    longitude: row.longitude,
    unescoStatus: row.unescoStatus,
    averageRating: row.averageRating,
    reviewCount: row.reviewCount,
    isFreeEntry: row.isFreeEntry,
    popularityScore: row.popularityScore,
    heroImage: hero
      ? {
          id: hero.id,
          url: hero.url,
          type: hero.type,
          alt: locale === "en" ? hero.altEn : hero.altTr,
          photographer: hero.photographer,
          license: hero.license,
          attribution: hero.attribution,
          isHero: hero.isHero,
        }
      : null,
  };
}
