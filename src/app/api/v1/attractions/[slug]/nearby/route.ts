import type { NextRequest } from "next/server";
import { z } from "zod";
import { parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { nearbyForAttraction } from "~/server/services/nearby";

export const runtime = "nodejs";

const Query = z.object({
  type: z.enum(["hotel", "restaurant"]),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  maxDistance: z.coerce.number().int().min(100).max(50_000).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  priceLevel: z.coerce.number().int().min(1).max(4).optional(),
});

export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const params = parseQueryWith(request, Query);
    const result = await nearbyForAttraction({
      slug,
      type: params.type === "hotel" ? "HOTEL" : "RESTAURANT",
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
      ...(params.maxDistance ? { maxDistanceM: params.maxDistance } : {}),
      ...(params.minRating ? { minRating: params.minRating } : {}),
      ...(params.priceLevel ? { priceLevel: params.priceLevel } : {}),
    });
    return cached(result, { sMaxAge: 600, staleWhileRevalidate: 86400 });
  } catch (err) {
    return problem(err, request.url);
  }
}
