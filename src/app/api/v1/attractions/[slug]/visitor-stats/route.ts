import type { NextRequest } from "next/server";
import { z } from "zod";
import { parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { getVisitorStats } from "~/server/services/visitor-stats";

export const runtime = "nodejs";

const Query = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const params = parseQueryWith(request, Query);
    const data = await getVisitorStats({
      slug,
      ...(params.from ? { fromYearMonth: params.from } : {}),
      ...(params.to ? { toYearMonth: params.to } : {}),
    });
    return cached(data, { sMaxAge: 86400 });
  } catch (err) {
    return problem(err, request.url);
  }
}
