import { prisma } from "~/server/db/client";
import { NotFoundError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { haversineKm } from "~/lib/utils";
import { getProviderFor, type NearbyType } from "~/server/providers/nearby";

const DEFAULT_RADIUS_M = 5000;
const TTL_DAYS = 7;

export async function nearbyForAttraction(args: {
  slug: string;
  type: NearbyType;
  limit?: number;
  maxDistanceM?: number;
  minRating?: number;
  priceLevel?: number;
}) {
  const tr = await prisma.attractionTranslation.findFirst({
    where: { slug: args.slug },
    select: { attractionId: true },
  });
  if (!tr) throw new NotFoundError("Attraction");

  const attraction = await prisma.attraction.findUnique({
    where: { id: tr.attractionId },
    select: { id: true, latitude: true, longitude: true },
  });
  if (!attraction) throw new NotFoundError("Attraction");

  const cached = await prisma.nearbyPlace.findMany({
    where: { attractionId: attraction.id, type: args.type },
    orderBy: { distanceM: "asc" },
  });
  const isStale =
    cached.length === 0 || cached.every((p) => p.expiresAt.getTime() < Date.now());

  let rows = cached;
  if (isStale) {
    try {
      const provider = getProviderFor(args.type);
      const fetched = await provider.fetchNearby({
        type: args.type,
        lat: attraction.latitude,
        lng: attraction.longitude,
        radiusM: DEFAULT_RADIUS_M,
        limit: 10,
      });
      // Wipe old cache and replace
      await prisma.nearbyPlace.deleteMany({ where: { attractionId: attraction.id, type: args.type } });
      const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 3600 * 1000);
      const inserts = fetched.map((p) => ({
        attractionId: attraction.id,
        type: args.type,
        providerName: p.providerName,
        externalId: p.externalId,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        rating: p.rating,
        priceLevel: p.priceLevel,
        distanceM: Math.round(haversineKm({ lat: attraction.latitude, lng: attraction.longitude }, { lat: p.lat, lng: p.lng }) * 1000),
        photoUrl: p.photoUrl,
        externalUrl: p.externalUrl,
        metadata: p.metadata ? JSON.stringify(p.metadata) : null,
        expiresAt,
      }));
      if (inserts.length > 0) {
        await prisma.nearbyPlace.createMany({ data: inserts });
      }
      rows = await prisma.nearbyPlace.findMany({
        where: { attractionId: attraction.id, type: args.type },
        orderBy: { distanceM: "asc" },
      });
    } catch (err) {
      logger.warn({ err, attractionId: attraction.id }, "nearby refresh failed; serving stale");
      // Fall back to whatever was cached, even if expired.
    }
  }

  const filtered = rows
    .filter((r) => (args.maxDistanceM ? r.distanceM <= args.maxDistanceM : true))
    .filter((r) => (args.minRating ? (r.rating ?? 0) >= args.minRating : true))
    .filter((r) => (args.priceLevel ? r.priceLevel === args.priceLevel : true))
    .slice(0, args.limit ?? 10);

  return {
    attractionId: attraction.id,
    type: args.type,
    items: filtered.map((r) => ({
      id: r.id,
      providerName: r.providerName,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      rating: r.rating,
      priceLevel: r.priceLevel,
      distanceM: r.distanceM,
      photoUrl: r.photoUrl,
      affiliateRedirectUrl: `/api/v1/redirect/affiliate/${r.id}`,
    })),
  };
}

export async function recordAffiliateClick(args: {
  placeId: string;
  userId?: string;
  locale: string;
  source?: string;
  clientIp?: string;
  userAgent?: string;
}): Promise<{ externalUrl: string } | null> {
  const place = await prisma.nearbyPlace.findUnique({ where: { id: args.placeId } });
  if (!place) return null;
  await prisma.affiliateClick.create({
    data: {
      placeId: args.placeId,
      attractionId: place.attractionId,
      userId: args.userId ?? null,
      locale: args.locale,
      source: args.source ?? null,
      clientIp: args.clientIp ?? null,
      userAgent: args.userAgent ?? null,
    },
  });
  return { externalUrl: place.externalUrl };
}
