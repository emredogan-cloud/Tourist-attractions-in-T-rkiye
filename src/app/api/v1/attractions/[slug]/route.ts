import type { NextRequest } from "next/server";
import { parseLocale } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { isLocale } from "~/lib/i18n/config";
import { getAttractionBySlug } from "~/server/services/attractions";

export const runtime = "nodejs";

export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(request.url);
    const localeParam = url.searchParams.get("locale");
    const locale = isLocale(localeParam) ? localeParam : parseLocale(request);
    const detail = await getAttractionBySlug(slug, locale);
    return cached(detail, {
      sMaxAge: 3600,
      staleWhileRevalidate: 86400,
      etag: `${detail.id}-${detail.averageRating}-${detail.reviewCount}`,
    });
  } catch (err) {
    return problem(err, request.url);
  }
}
