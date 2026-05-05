import type { NextRequest } from "next/server";
import { z } from "zod";
import { localeQuery, parseLocale, parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { nearbyAttractions } from "~/server/services/attractions";

export const runtime = "nodejs";

const NearbyQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(100).max(200_000).default(20_000),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  excludeId: z.string().optional(),
  locale: localeQuery.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryWith(request, NearbyQuery);
    const locale = params.locale ?? parseLocale(request);
    const items = await nearbyAttractions({
      lat: params.lat,
      lng: params.lng,
      radiusM: params.radius,
      excludeId: params.excludeId,
      limit: params.limit,
      locale,
    });
    return cached({ items }, { sMaxAge: 600, staleWhileRevalidate: 86400 });
  } catch (err) {
    return problem(err, request.url);
  }
}
