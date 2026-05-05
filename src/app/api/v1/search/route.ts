import type { NextRequest } from "next/server";
import { z } from "zod";
import { localeQuery, parseLocale, parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { clientIp, enforce } from "~/lib/rate-limit";
import { getSearchProvider } from "~/server/providers/search";

export const runtime = "nodejs";

const SearchQuery = z.object({
  q: z.string().min(1).max(200),
  locale: localeQuery.optional(),
  category: z.string().toUpperCase().optional(),
  region: z.string().toUpperCase().optional(),
  province: z.string().optional(),
  isUnesco: z.coerce.boolean().optional(),
  isFreeEntry: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(1000).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryWith(request, SearchQuery);
    await enforce({ key: `search:${clientIp(request)}`, limit: 60, windowSec: 60 });
    const locale = params.locale ?? parseLocale(request);
    const provider = await getSearchProvider();
    const result = await provider.search({
      q: params.q,
      locale,
      filters: {
        category: params.category,
        region: params.region,
        province: params.province,
        isUnesco: params.isUnesco,
        isFreeEntry: params.isFreeEntry,
      },
      limit: params.limit,
      offset: params.offset,
    });
    return cached(result, { sMaxAge: 30, staleWhileRevalidate: 300 });
  } catch (err) {
    return problem(err, request.url);
  }
}
