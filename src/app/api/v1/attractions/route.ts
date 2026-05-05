import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  bboxSchema,
  localeQuery,
  nearSchema,
  parseLocale,
  parseQueryWith,
} from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { listAttractions } from "~/server/services/attractions";

export const runtime = "nodejs";
export const revalidate = 600;

const ListQuery = z.object({
  locale: localeQuery.optional(),
  category: z.string().toUpperCase().optional(),
  region: z.string().toUpperCase().optional(),
  province: z.string().optional(),
  q: z.string().min(1).max(200).optional(),
  bbox: bboxSchema.optional(),
  near: nearSchema.optional(),
  isUnesco: z.coerce.boolean().optional(),
  isFreeEntry: z.coerce.boolean().optional(),
  sort: z.enum(["popular", "rating_desc", "rating_asc", "newest"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryWith(request, ListQuery);
    const locale = params.locale ?? parseLocale(request);
    const result = await listAttractions({ ...params, locale });
    return cached(result, { sMaxAge: 600, staleWhileRevalidate: 86400 });
  } catch (err) {
    return problem(err, request.url);
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
