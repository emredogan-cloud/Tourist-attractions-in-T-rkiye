import type { NextRequest } from "next/server";
import { z } from "zod";
import { bboxSchema, localeQuery, parseLocale, parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { listMapMarkers } from "~/server/services/attractions";

export const runtime = "nodejs";
export const revalidate = 600;

const MapQuery = z.object({
  bbox: bboxSchema.optional(),
  category: z.string().toUpperCase().optional(),
  region: z.string().toUpperCase().optional(),
  isUnesco: z.coerce.boolean().optional(),
  isFreeEntry: z.coerce.boolean().optional(),
  locale: localeQuery.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryWith(request, MapQuery);
    const locale = params.locale ?? parseLocale(request);
    const markers = await listMapMarkers({ ...params, locale });
    return cached({ markers, count: markers.length }, { sMaxAge: 600 });
  } catch (err) {
    return problem(err, request.url);
  }
}
