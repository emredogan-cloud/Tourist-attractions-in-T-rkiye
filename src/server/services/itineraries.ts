import type { Prisma } from "@prisma/client";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "~/lib/errors";
import { haversineKm } from "~/lib/utils";
import { prisma } from "~/server/db/client";

const INCLUDE = {
  days: {
    orderBy: { dayNumber: "asc" as const },
    include: {
      stops: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          attraction: {
            include: {
              category: true,
              translations: true,
              media: { where: { isHero: true }, take: 1 },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ItineraryInclude;

export async function createItinerary(args: {
  userId: string;
  title: string;
  description?: string;
  startDate?: Date;
  themes?: string[];
}) {
  if (!args.title.trim() || args.title.length > 200) {
    throw new ValidationError("Title 1–200 chars");
  }
  return prisma.itinerary.create({
    data: {
      userId: args.userId,
      title: args.title.trim(),
      ...(args.description ? { description: args.description } : {}),
      ...(args.startDate ? { startDate: args.startDate } : {}),
      ...(args.themes ? { themes: JSON.stringify(args.themes) } : {}),
      days: { create: [{ dayNumber: 1 }] },
    },
    include: INCLUDE,
  });
}

export async function listMyItineraries(userId: string) {
  return prisma.itinerary.findMany({
    where: { userId },
    include: INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getItinerary(args: { id: string; userId: string | null; shareToken?: string }) {
  const it = await prisma.itinerary.findUnique({ where: { id: args.id }, include: INCLUDE });
  if (!it) throw new NotFoundError("Itinerary");
  // Owner or share token
  if (it.userId && it.userId !== args.userId && (!args.shareToken || args.shareToken !== it.shareToken)) {
    if (!it.isPublic) throw new ForbiddenError();
  }
  return it;
}

export async function getByShareToken(token: string) {
  const it = await prisma.itinerary.findUnique({
    where: { shareToken: token },
    include: INCLUDE,
  });
  if (!it) throw new NotFoundError("Itinerary");
  return it;
}

export async function updateItinerary(args: {
  id: string;
  userId: string;
  patch: { title?: string; description?: string; startDate?: Date | null; isPublic?: boolean; themes?: string[] };
}) {
  const it = await prisma.itinerary.findUnique({ where: { id: args.id } });
  if (!it) throw new NotFoundError("Itinerary");
  if (it.userId !== args.userId) throw new ForbiddenError();
  return prisma.itinerary.update({
    where: { id: it.id },
    data: {
      ...(args.patch.title !== undefined ? { title: args.patch.title } : {}),
      ...(args.patch.description !== undefined ? { description: args.patch.description } : {}),
      ...(args.patch.startDate !== undefined ? { startDate: args.patch.startDate } : {}),
      ...(args.patch.isPublic !== undefined ? { isPublic: args.patch.isPublic } : {}),
      ...(args.patch.themes !== undefined ? { themes: JSON.stringify(args.patch.themes) } : {}),
    },
    include: INCLUDE,
  });
}

export async function deleteItinerary(args: { id: string; userId: string }) {
  const it = await prisma.itinerary.findUnique({ where: { id: args.id } });
  if (!it) throw new NotFoundError("Itinerary");
  if (it.userId !== args.userId) throw new ForbiddenError();
  await prisma.itinerary.delete({ where: { id: it.id } });
}

export async function addDay(args: { itineraryId: string; userId: string }) {
  const it = await prisma.itinerary.findUnique({ where: { id: args.itineraryId }, include: { days: true } });
  if (!it) throw new NotFoundError("Itinerary");
  if (it.userId !== args.userId) throw new ForbiddenError();
  const next = (it.days.reduce((m, d) => Math.max(m, d.dayNumber), 0) ?? 0) + 1;
  return prisma.itineraryDay.create({ data: { itineraryId: it.id, dayNumber: next } });
}

export async function deleteDay(args: { dayId: string; userId: string }) {
  const day = await prisma.itineraryDay.findUnique({
    where: { id: args.dayId },
    include: { itinerary: true },
  });
  if (!day) throw new NotFoundError("Day");
  if (day.itinerary.userId !== args.userId) throw new ForbiddenError();
  await prisma.itineraryDay.delete({ where: { id: day.id } });
}

export async function addStop(args: {
  dayId: string;
  userId: string;
  attractionId: string;
  plannedDurationMin?: number;
  plannedArrivalTime?: string;
}) {
  const day = await prisma.itineraryDay.findUnique({
    where: { id: args.dayId },
    include: { itinerary: true, stops: { orderBy: { sortOrder: "desc" }, take: 1 } },
  });
  if (!day) throw new NotFoundError("Day");
  if (day.itinerary.userId !== args.userId) throw new ForbiddenError();
  const attraction = await prisma.attraction.findUnique({ where: { id: args.attractionId } });
  if (!attraction) throw new NotFoundError("Attraction");
  const sortOrder = (day.stops[0]?.sortOrder ?? -1) + 1;
  return prisma.itineraryStop.create({
    data: {
      itineraryDayId: day.id,
      attractionId: args.attractionId,
      sortOrder,
      ...(args.plannedDurationMin ? { plannedDurationMin: args.plannedDurationMin } : {}),
      ...(args.plannedArrivalTime ? { plannedArrivalTime: args.plannedArrivalTime } : {}),
    },
  });
}

export async function reorderStops(args: { dayId: string; userId: string; stopIds: string[] }) {
  const day = await prisma.itineraryDay.findUnique({
    where: { id: args.dayId },
    include: { itinerary: true, stops: true },
  });
  if (!day) throw new NotFoundError("Day");
  if (day.itinerary.userId !== args.userId) throw new ForbiddenError();
  const ownIds = new Set(day.stops.map((s) => s.id));
  if (args.stopIds.some((id) => !ownIds.has(id))) {
    throw new ValidationError("stopIds must all belong to the day");
  }
  await prisma.$transaction(
    args.stopIds.map((id, idx) =>
      prisma.itineraryStop.update({ where: { id }, data: { sortOrder: idx } }),
    ),
  );
}

export async function deleteStop(args: { stopId: string; userId: string }) {
  const stop = await prisma.itineraryStop.findUnique({
    where: { id: args.stopId },
    include: { day: { include: { itinerary: true } } },
  });
  if (!stop) throw new NotFoundError("Stop");
  if (stop.day.itinerary.userId !== args.userId) throw new ForbiddenError();
  await prisma.itineraryStop.delete({ where: { id: stop.id } });
}

export async function cloneItinerary(args: { id: string; userId: string }) {
  const src = await prisma.itinerary.findUnique({ where: { id: args.id }, include: INCLUDE });
  if (!src) throw new NotFoundError("Itinerary");
  if (src.userId && src.userId !== args.userId && !src.isPublic) {
    throw new ForbiddenError();
  }
  return prisma.itinerary.create({
    data: {
      userId: args.userId,
      title: `${src.title} (copy)`,
      description: src.description,
      startDate: src.startDate,
      themes: src.themes,
      days: {
        create: src.days.map((d) => ({
          dayNumber: d.dayNumber,
          date: d.date,
          notes: d.notes,
          stops: {
            create: d.stops.map((s) => ({
              attractionId: s.attractionId,
              sortOrder: s.sortOrder,
              plannedDurationMin: s.plannedDurationMin,
              plannedArrivalTime: s.plannedArrivalTime,
              notes: s.notes,
            })),
          },
        })),
      },
    },
    include: INCLUDE,
  });
}

// Greedy nearest-neighbor for shortest path between stops within a day.
// For real production, swap in Mapbox Optimization API behind a RouteProvider.
export async function optimizeDay(args: { dayId: string; userId: string }) {
  const day = await prisma.itineraryDay.findUnique({
    where: { id: args.dayId },
    include: {
      itinerary: true,
      stops: { orderBy: { sortOrder: "asc" }, include: { attraction: true } },
    },
  });
  if (!day) throw new NotFoundError("Day");
  if (day.itinerary.userId !== args.userId) throw new ForbiddenError();
  if (day.stops.length < 3) throw new ConflictError("Need ≥ 3 stops to optimize");
  const remaining = [...day.stops];
  const ordered = [remaining.shift()!];
  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1]!;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i++) {
      const r = remaining[i]!;
      const d = haversineKm(
        { lat: last.attraction.latitude, lng: last.attraction.longitude },
        { lat: r.attraction.latitude, lng: r.attraction.longitude },
      );
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    ordered.push(remaining.splice(bestIdx, 1)[0]!);
  }
  await prisma.$transaction(
    ordered.map((s, idx) =>
      prisma.itineraryStop.update({ where: { id: s.id }, data: { sortOrder: idx } }),
    ),
  );
  return { stopIds: ordered.map((s) => s.id) };
}
