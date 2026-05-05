import type { NextRequest } from "next/server";
import { z } from "zod";
import { localeQuery, parseLocale, parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { getCurrentSession } from "~/server/providers/auth";
import { recommendForUser } from "~/server/services/recommendations";

export const runtime = "nodejs";

const Query = z.object({
  locale: localeQuery.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(8),
});

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryWith(request, Query);
    const session = await getCurrentSession();
    const locale = params.locale ?? parseLocale(request);
    const items = await recommendForUser({
      userId: session?.user.id ?? null,
      locale,
      limit: params.limit,
    });
    return cached({ items }, { sMaxAge: 300, staleWhileRevalidate: 3600 });
  } catch (err) {
    return problem(err, request.url);
  }
}
