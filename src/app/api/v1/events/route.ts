import type { NextRequest } from "next/server";
import { z } from "zod";
import { localeQuery, parseLocale, parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { listEvents } from "~/server/services/events";

export const runtime = "nodejs";

const Query = z.object({
  type: z.enum(["FESTIVAL", "EXHIBITION", "CLOSURE", "CONCERT", "RAMADAN_HOURS", "WEATHER_ALERT"]).optional(),
  attractionSlug: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  locale: localeQuery.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryWith(request, Query);
    const locale = params.locale ?? parseLocale(request);
    const items = await listEvents({
      locale,
      ...(params.type ? { type: params.type } : {}),
      ...(params.attractionSlug ? { attractionSlug: params.attractionSlug } : {}),
      ...(params.from ? { from: new Date(params.from) } : {}),
      ...(params.to ? { to: new Date(params.to) } : {}),
      limit: params.limit,
    });
    return cached({ events: items }, { sMaxAge: 300, staleWhileRevalidate: 3600 });
  } catch (err) {
    return problem(err, request.url);
  }
}
