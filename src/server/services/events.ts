import type { Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "~/lib/errors";
import type { Locale } from "~/lib/i18n/config";
import { prisma } from "~/server/db/client";

export type EventType =
  | "FESTIVAL"
  | "EXHIBITION"
  | "CLOSURE"
  | "CONCERT"
  | "RAMADAN_HOURS"
  | "WEATHER_ALERT";

const EVENT_INCLUDE = {
  attraction: {
    include: {
      translations: true,
      media: { where: { isHero: true }, take: 1 },
      province: true,
    },
  },
} satisfies Prisma.EventInclude;

export async function listEvents(args: {
  locale: Locale;
  type?: EventType;
  attractionSlug?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const where: Prisma.EventWhereInput = { isPublished: true };
  if (args.type) where.type = args.type;
  if (args.attractionSlug) {
    where.attraction = {
      translations: { some: { slug: args.attractionSlug } },
    };
  }
  if (args.from || args.to) {
    where.startsAt = {};
    if (args.from) where.startsAt.gte = args.from;
    if (args.to) where.startsAt.lte = args.to;
  } else {
    // Default to upcoming + ongoing (i.e. endsAt >= now or no endsAt and startsAt within 90d)
    const now = new Date();
    const horizon = new Date(Date.now() + 90 * 24 * 3600 * 1000);
    where.OR = [
      { endsAt: { gte: now } },
      {
        AND: [
          { endsAt: null },
          { startsAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
          { startsAt: { lte: horizon } },
        ],
      },
    ];
  }
  const rows = await prisma.event.findMany({
    where,
    include: EVENT_INCLUDE,
    orderBy: { startsAt: "asc" },
    take: Math.min(args.limit ?? 100, 200),
  });
  return rows.map((r) => mapToDto(r, args.locale));
}

export async function createEvent(args: {
  type: EventType;
  titleTr: string;
  titleEn: string;
  bodyTr: string;
  bodyEn: string;
  startsAt: Date;
  endsAt?: Date | null;
  attractionId?: string;
}) {
  if (!args.titleTr.trim() || !args.titleEn.trim())
    throw new ValidationError("Bilingual titles required");
  if (args.endsAt && args.endsAt < args.startsAt) {
    throw new ValidationError("endsAt must be after startsAt");
  }
  return prisma.event.create({
    data: {
      type: args.type,
      titleTr: args.titleTr,
      titleEn: args.titleEn,
      bodyTr: args.bodyTr,
      bodyEn: args.bodyEn,
      startsAt: args.startsAt,
      ...(args.endsAt ? { endsAt: args.endsAt } : {}),
      ...(args.attractionId ? { attractionId: args.attractionId } : {}),
    },
  });
}

export async function getCurrentClosures(args: { attractionId?: string }) {
  const now = new Date();
  return prisma.event.findMany({
    where: {
      type: "CLOSURE",
      isPublished: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      ...(args.attractionId ? { attractionId: args.attractionId } : {}),
    },
  });
}

function mapToDto(row: Prisma.EventGetPayload<{ include: typeof EVENT_INCLUDE }>, locale: Locale) {
  const tr =
    row.attraction?.translations.find((t) => t.locale === locale) ??
    row.attraction?.translations.find((t) => t.locale === "tr");
  return {
    id: row.id,
    type: row.type,
    title: locale === "en" ? row.titleEn : row.titleTr,
    body: locale === "en" ? row.bodyEn : row.bodyTr,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    attraction: row.attraction
      ? {
          id: row.attraction.id,
          slug: tr?.slug ?? row.attraction.id,
          name: tr?.name ?? "",
          heroImageUrl: row.attraction.media[0]?.url ?? null,
          province:
            locale === "en" ? row.attraction.province.nameEn : row.attraction.province.nameTr,
        }
      : null,
  };
}

export async function deleteEvent(id: string) {
  const e = await prisma.event.findUnique({ where: { id } });
  if (!e) throw new NotFoundError("Event");
  await prisma.event.delete({ where: { id } });
}

// Open-now: given attraction.openingHours, decide if attraction is currently open in Türkiye time.
export function isOpenNow(args: {
  hours: {
    season: "ALL_YEAR" | "SUMMER" | "WINTER";
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }[];
  closures?: { startsAt: Date; endsAt: Date | null }[];
  now?: Date;
}): "OPEN" | "CLOSED" | "UNKNOWN" {
  const now = args.now ?? new Date();
  // Active closure?
  for (const c of args.closures ?? []) {
    if (now >= c.startsAt && (c.endsAt === null || now <= c.endsAt)) return "CLOSED";
  }
  // Use Türkiye timezone for hour calculation. Pure UTC arithmetic, no
  // dependence on the runtime's local timezone.
  const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
  const istanbulMs = now.getTime() + ISTANBUL_OFFSET_MS;
  const istanbul = new Date(istanbulMs);
  const month = istanbul.getUTCMonth(); // 0..11
  const season: "SUMMER" | "WINTER" = month >= 3 && month <= 9 ? "SUMMER" : "WINTER";
  const day = istanbul.getUTCDay();
  const hours = args.hours.filter((h) => h.season === season || h.season === "ALL_YEAR");
  if (hours.length === 0) return "UNKNOWN";
  const today = hours.find((h) => h.dayOfWeek === day);
  if (!today) return "UNKNOWN";
  if (today.isClosed) return "CLOSED";
  if (!today.openTime || !today.closeTime) return "UNKNOWN";
  const minutes = istanbul.getUTCHours() * 60 + istanbul.getUTCMinutes();
  const [oh, om] = today.openTime.split(":").map(Number);
  const [ch, cm] = today.closeTime.split(":").map(Number);
  if (oh === undefined || om === undefined || ch === undefined || cm === undefined)
    return "UNKNOWN";
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  return minutes >= openMin && minutes < closeMin ? "OPEN" : "CLOSED";
}
