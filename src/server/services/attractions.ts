import type { Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "~/lib/errors";
import type { Locale } from "~/lib/i18n/config";
import { defaultLocale } from "~/lib/i18n/config";
import { haversineKm } from "~/lib/utils";
import { prisma } from "~/server/db/client";
import type {
  AccessibilityFlags,
  AttractionDetail,
  AttractionHours,
  AttractionListItem,
  AttractionMedia,
  AttractionPrice,
  ListAttractionsQuery,
  ListAttractionsResult,
  MapMarker,
} from "~/types/attraction";

const LIST_INCLUDE = {
  category: true,
  region: true,
  province: true,
  translations: true,
  media: { orderBy: [{ isHero: "desc" as const }, { sortOrder: "asc" as const }] },
} satisfies Prisma.AttractionInclude;

const DETAIL_INCLUDE = {
  ...LIST_INCLUDE,
  operatingHours: true,
  pricing: true,
} satisfies Prisma.AttractionInclude;

type DetailRow = Prisma.AttractionGetPayload<{ include: typeof DETAIL_INCLUDE }>;
type ListRow = Prisma.AttractionGetPayload<{ include: typeof LIST_INCLUDE }>;

function pickTranslation(translations: ListRow["translations"], locale: Locale) {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === defaultLocale) ??
    translations[0] ??
    null
  );
}

function mediaToDto(rows: ListRow["media"], locale: Locale): AttractionMedia[] {
  return rows.map((m) => ({
    id: m.id,
    url: m.url,
    type: m.type,
    alt: locale === "en" ? m.altEn : m.altTr,
    photographer: m.photographer,
    license: m.license,
    attribution: m.attribution,
    isHero: m.isHero,
  }));
}

function categoryName(code: string, locale: Locale) {
  // codes are stable enums; UI labels resolved via i18n on the client. The API returns the code + locale name fallback.
  const catTranslations: Record<string, Record<Locale, string>> = {
    HISTORICAL: {
      tr: "Tarihi yer",
      en: "Historical site",
      ar: "موقع تاريخي",
      ru: "Исторический объект",
      de: "Historische Stätte",
    },
    NATURAL: {
      tr: "Doğal harika",
      en: "Natural wonder",
      ar: "عجائب طبيعية",
      ru: "Природное чудо",
      de: "Naturwunder",
    },
    RELIGIOUS: {
      tr: "Dini yer",
      en: "Religious site",
      ar: "موقع ديني",
      ru: "Религиозный объект",
      de: "Religiöse Stätte",
    },
    CULTURAL: {
      tr: "Kültürel mekan",
      en: "Cultural venue",
      ar: "مكان ثقافي",
      ru: "Культурное место",
      de: "Kulturstätte",
    },
    BEACH: { tr: "Plaj", en: "Beach", ar: "شاطئ", ru: "Пляж", de: "Strand" },
    MUSEUM: { tr: "Müze", en: "Museum", ar: "متحف", ru: "Музей", de: "Museum" },
    ARCHAEOLOGICAL: {
      tr: "Arkeolojik alan",
      en: "Archaeological site",
      ar: "موقع أثري",
      ru: "Археологический памятник",
      de: "Archäologische Stätte",
    },
    ADVENTURE: { tr: "Macera", en: "Adventure", ar: "مغامرة", ru: "Приключение", de: "Abenteuer" },
    URBAN: {
      tr: "Şehir merkezi",
      en: "Urban experience",
      ar: "تجربة حضرية",
      ru: "Городские впечатления",
      de: "Stadterlebnis",
    },
    FOOD_DRINK: {
      tr: "Yeme içme",
      en: "Food & drink",
      ar: "طعام وشراب",
      ru: "Еда и напитки",
      de: "Essen & Trinken",
    },
  };
  return catTranslations[code]?.[locale] ?? code;
}

function regionName(code: string, locale: Locale) {
  const map: Record<string, Record<Locale, string>> = {
    MARMARA: {
      tr: "Marmara",
      en: "Marmara",
      ar: "مرمرة",
      ru: "Мраморноморский регион",
      de: "Marmara",
    },
    AEGEAN: { tr: "Ege", en: "Aegean", ar: "إيجة", ru: "Эгейский регион", de: "Ägäis" },
    MEDITERRANEAN: {
      tr: "Akdeniz",
      en: "Mediterranean",
      ar: "البحر الأبيض المتوسط",
      ru: "Средиземноморье",
      de: "Mittelmeer",
    },
    BLACK_SEA: {
      tr: "Karadeniz",
      en: "Black Sea",
      ar: "البحر الأسود",
      ru: "Черноморье",
      de: "Schwarzes Meer",
    },
    CENTRAL_ANATOLIA: {
      tr: "İç Anadolu",
      en: "Central Anatolia",
      ar: "وسط الأناضول",
      ru: "Центральная Анатолия",
      de: "Zentralanatolien",
    },
    EASTERN_ANATOLIA: {
      tr: "Doğu Anadolu",
      en: "Eastern Anatolia",
      ar: "شرق الأناضول",
      ru: "Восточная Анатолия",
      de: "Ostanatolien",
    },
    SOUTHEASTERN_ANATOLIA: {
      tr: "Güneydoğu Anadolu",
      en: "Southeastern Anatolia",
      ar: "جنوب شرق الأناضول",
      ru: "Юго-Восточная Анатолия",
      de: "Südostanatolien",
    },
  };
  return map[code]?.[locale] ?? code;
}

function rowToListItem(row: ListRow, locale: Locale, distanceMeters?: number): AttractionListItem {
  const tr = pickTranslation(row.translations, locale);
  const heroMedia = row.media.find((m) => m.isHero) ?? row.media[0] ?? null;
  return {
    id: row.id,
    slug: tr?.slug ?? row.id,
    name: tr?.name ?? "",
    summary: tr?.summary ?? "",
    category: { code: row.category.code, name: categoryName(row.category.code, locale) },
    region: { code: row.region.code, name: regionName(row.region.code, locale) },
    province: {
      slug: row.province.slug,
      name: locale === "en" ? row.province.nameEn : row.province.nameTr,
    },
    district: row.district,
    latitude: row.latitude,
    longitude: row.longitude,
    unescoStatus: row.unescoStatus,
    averageRating: row.averageRating,
    reviewCount: row.reviewCount,
    isFreeEntry: row.isFreeEntry,
    popularityScore: row.popularityScore,
    heroImage: heroMedia ? (mediaToDto([heroMedia], locale)[0] ?? null) : null,
    ...(distanceMeters !== undefined ? { distanceMeters } : {}),
  };
}

function rowToDetail(row: DetailRow, locale: Locale): AttractionDetail {
  const list = rowToListItem(row, locale);
  const tr = pickTranslation(row.translations, locale);
  const accessibility = row.accessibility
    ? (JSON.parse(row.accessibility) as AccessibilityFlags)
    : null;
  return {
    ...list,
    description: tr?.description ?? "",
    history: tr?.history ?? null,
    tips: tr?.tips ?? null,
    elevationM: row.elevationM,
    media: mediaToDto(row.media, locale),
    operatingHours: row.operatingHours.map<AttractionHours>((h) => ({
      season: h.season,
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
      notes: h.notes,
    })),
    pricing: row.pricing.map<AttractionPrice>((p) => ({
      audience: p.audience,
      priceTry: p.priceTry,
      isFree: p.isFree,
      validFrom: p.validFrom?.toISOString() ?? null,
      validTo: p.validTo?.toISOString() ?? null,
    })),
    accessibility,
    related: [],
  };
}

export async function listAttractions(query: ListAttractionsQuery): Promise<ListAttractionsResult> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const where: Prisma.AttractionWhereInput = { status: "PUBLISHED" };
  if (query.category)
    where.category = { code: query.category as Prisma.EnumAttractionCategoryCodeFilter["equals"] };
  if (query.region) where.region = { code: query.region as Prisma.EnumRegionCodeFilter["equals"] };
  if (query.province) where.province = { slug: query.province };
  if (query.isUnesco !== undefined) where.unescoStatus = query.isUnesco ? { not: null } : null;
  if (query.isFreeEntry !== undefined) where.isFreeEntry = query.isFreeEntry;
  if (query.q) {
    const q = query.q.trim();
    where.translations = {
      some: {
        AND: [
          { locale: query.locale },
          {
            OR: [
              { name: { contains: q } },
              { summary: { contains: q } },
              { description: { contains: q } },
            ],
          },
        ],
      },
    };
  }
  if (query.bbox) {
    where.latitude = { gte: query.bbox.minLat, lte: query.bbox.maxLat };
    where.longitude = { gte: query.bbox.minLng, lte: query.bbox.maxLng };
  }

  const orderBy: Prisma.AttractionOrderByWithRelationInput[] =
    query.sort === "rating_desc"
      ? [{ averageRating: "desc" }, { reviewCount: "desc" }]
      : query.sort === "rating_asc"
        ? [{ averageRating: "asc" }]
        : query.sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ popularityScore: "desc" }, { averageRating: "desc" }];

  const cursor = query.cursor ? { id: query.cursor } : undefined;
  const skip = cursor ? 1 : 0;

  const [rows, total] = await Promise.all([
    prisma.attraction.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy,
      take: limit + 1,
      skip,
      ...(cursor ? { cursor } : {}),
    }),
    prisma.attraction.count({ where }),
  ]);

  let items = rows.slice(0, limit).map((row) => rowToListItem(row, query.locale));

  if (query.near) {
    const center = { lat: query.near.lat, lng: query.near.lng };
    items = items
      .map((it) => ({
        ...it,
        distanceMeters: Math.round(
          haversineKm({ lat: it.latitude, lng: it.longitude }, center) * 1000,
        ),
      }))
      .filter((it) => (it.distanceMeters ?? 0) <= query.near!.radiusM)
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  }

  const nextCursor = rows.length > limit ? (rows[limit]?.id ?? null) : null;

  return { items, nextCursor, total };
}

export async function nearbyAttractions(args: {
  lat: number;
  lng: number;
  radiusM: number;
  locale: Locale;
  excludeId?: string;
  limit?: number;
}): Promise<AttractionListItem[]> {
  if (args.radiusM <= 0 || args.radiusM > 200_000) {
    throw new ValidationError("radius must be between 1 and 200000 meters");
  }
  // Bounding-box pre-filter for index efficiency, then exact haversine refinement.
  const latDelta = args.radiusM / 111_320; // ~m per deg lat
  const lngDelta =
    args.radiusM / (111_320 * Math.max(Math.cos((args.lat * Math.PI) / 180), 0.0001));
  const where: Prisma.AttractionWhereInput = {
    status: "PUBLISHED",
    latitude: { gte: args.lat - latDelta, lte: args.lat + latDelta },
    longitude: { gte: args.lng - lngDelta, lte: args.lng + lngDelta },
    ...(args.excludeId ? { id: { not: args.excludeId } } : {}),
  };
  const rows = await prisma.attraction.findMany({
    where,
    include: LIST_INCLUDE,
    take: 100,
  });
  const center = { lat: args.lat, lng: args.lng };
  const limit = Math.min(args.limit ?? 10, 50);
  return rows
    .map((row) => {
      const dKm = haversineKm({ lat: row.latitude, lng: row.longitude }, center);
      return { row, distanceMeters: Math.round(dKm * 1000) };
    })
    .filter(({ distanceMeters }) => distanceMeters <= args.radiusM)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit)
    .map(({ row, distanceMeters }) => rowToListItem(row, args.locale, distanceMeters));
}

export async function getAttractionBySlug(slug: string, locale: Locale): Promise<AttractionDetail> {
  const tr = await prisma.attractionTranslation.findFirst({
    where: { slug, locale },
    select: { attractionId: true },
  });
  // Fallback to other locale slugs if not found in requested locale
  const id =
    tr?.attractionId ??
    (await prisma.attractionTranslation
      .findFirst({ where: { slug }, select: { attractionId: true } })
      .then((r) => r?.attractionId));
  if (!id) throw new NotFoundError("Attraction");
  const row = await prisma.attraction.findUnique({
    where: { id, status: "PUBLISHED" },
    include: DETAIL_INCLUDE,
  });
  if (!row) throw new NotFoundError("Attraction");

  const detail = rowToDetail(row, locale);
  detail.related = await nearbyAttractions({
    lat: row.latitude,
    lng: row.longitude,
    radiusM: 50_000,
    locale,
    excludeId: row.id,
    limit: 5,
  });
  return detail;
}

export async function listMapMarkers(args: {
  bbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number };
  locale: Locale;
  category?: string;
  region?: string;
  isUnesco?: boolean;
  isFreeEntry?: boolean;
}): Promise<MapMarker[]> {
  const where: Prisma.AttractionWhereInput = { status: "PUBLISHED" };
  if (args.bbox) {
    where.latitude = { gte: args.bbox.minLat, lte: args.bbox.maxLat };
    where.longitude = { gte: args.bbox.minLng, lte: args.bbox.maxLng };
  }
  if (args.category)
    where.category = { code: args.category as Prisma.EnumAttractionCategoryCodeFilter["equals"] };
  if (args.region) where.region = { code: args.region as Prisma.EnumRegionCodeFilter["equals"] };
  if (args.isUnesco !== undefined) where.unescoStatus = args.isUnesco ? { not: null } : null;
  if (args.isFreeEntry !== undefined) where.isFreeEntry = args.isFreeEntry;
  const rows = await prisma.attraction.findMany({
    where,
    select: {
      id: true,
      latitude: true,
      longitude: true,
      averageRating: true,
      category: { select: { code: true } },
      translations: { where: { locale: args.locale }, select: { slug: true, name: true } },
    },
    take: 5000,
  });
  return rows.flatMap<MapMarker>((row) => {
    const tr = row.translations[0];
    if (!tr) return [];
    return [
      {
        id: row.id,
        slug: tr.slug,
        lat: row.latitude,
        lng: row.longitude,
        category: row.category.code,
        name: tr.name,
        averageRating: row.averageRating,
      },
    ];
  });
}

export async function listCategories(locale: Locale) {
  const rows = await prisma.category.findMany({ orderBy: { code: "asc" } });
  return rows.map((c) => ({
    code: c.code,
    slug: locale === "en" ? c.slugEn : c.slugTr,
    name: categoryName(c.code, locale),
  }));
}

export async function listRegionsWithProvinces(locale: Locale) {
  const rows = await prisma.region.findMany({
    include: { provinces: { orderBy: { nameTr: "asc" } } },
    orderBy: { nameTr: "asc" },
  });
  return rows.map((r) => ({
    code: r.code,
    name: locale === "en" ? r.nameEn : r.nameTr,
    provinces: r.provinces.map((p) => ({
      slug: p.slug,
      name: locale === "en" ? p.nameEn : p.nameTr,
    })),
  }));
}
