import { type NextRequest, NextResponse } from "next/server";
import { problem } from "~/lib/api-response";
import { isLocale } from "~/lib/i18n/config";
import { clientIp, enforce } from "~/lib/rate-limit";
import { getCurrentSession } from "~/server/providers/auth";
import { recordAffiliateClick } from "~/server/services/nearby";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, ctx: { params: Promise<{ placeId: string }> }) {
  try {
    await enforce({ key: `affiliate:${clientIp(request)}`, limit: 5, windowSec: 60 });
    const { placeId } = await ctx.params;
    const session = await getCurrentSession();
    const url = new URL(request.url);
    const sourceParam = url.searchParams.get("src");
    const localeParam = url.searchParams.get("locale");
    const locale = isLocale(localeParam) ? localeParam : "tr";
    const userAgent = request.headers.get("user-agent");
    const result = await recordAffiliateClick({
      placeId,
      ...(session?.user.id ? { userId: session.user.id } : {}),
      locale,
      ...(sourceParam ? { source: sourceParam } : {}),
      clientIp: clientIp(request),
      ...(userAgent ? { userAgent } : {}),
    });
    if (!result) {
      return NextResponse.json(
        {
          type: "https://docs.turkiye-tourism.app/errors/not_found",
          title: "Place not found",
          status: 404,
        },
        { status: 404, headers: { "Content-Type": "application/problem+json" } },
      );
    }
    return NextResponse.redirect(result.externalUrl, { status: 302 });
  } catch (err) {
    return problem(err, request.url);
  }
}
