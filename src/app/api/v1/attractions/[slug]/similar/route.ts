import type { NextRequest } from "next/server";
import { z } from "zod";
import { localeQuery, parseLocale, parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { NotFoundError } from "~/lib/errors";
import { prisma } from "~/server/db/client";
import { similarTo } from "~/server/services/recommendations";

export const runtime = "nodejs";

const Query = z.object({
  locale: localeQuery.optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const params = parseQueryWith(request, Query);
    const tr = await prisma.attractionTranslation.findFirst({
      where: { slug },
      select: { attractionId: true },
    });
    if (!tr) throw new NotFoundError("Attraction");
    const locale = params.locale ?? parseLocale(request);
    const items = await similarTo({
      attractionId: tr.attractionId,
      locale,
      limit: params.limit,
    });
    return cached({ items }, { sMaxAge: 3600 });
  } catch (err) {
    return problem(err, request.url);
  }
}
