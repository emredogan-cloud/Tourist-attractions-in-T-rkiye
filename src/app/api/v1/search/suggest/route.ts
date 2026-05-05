import type { NextRequest } from "next/server";
import { z } from "zod";
import { localeQuery, parseLocale, parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { clientIp, enforce } from "~/lib/rate-limit";
import { getSearchProvider } from "~/server/providers/search";

export const runtime = "nodejs";

const SuggestQuery = z.object({
  q: z.string().min(1).max(50),
  locale: localeQuery.optional(),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryWith(request, SuggestQuery);
    await enforce({ key: `suggest:${clientIp(request)}`, limit: 120, windowSec: 60 });
    const locale = params.locale ?? parseLocale(request);
    const provider = await getSearchProvider();
    const out = await provider.suggest({ q: params.q, locale, limit: params.limit });
    return cached(out, { sMaxAge: 30, staleWhileRevalidate: 300 });
  } catch (err) {
    return problem(err, request.url);
  }
}
