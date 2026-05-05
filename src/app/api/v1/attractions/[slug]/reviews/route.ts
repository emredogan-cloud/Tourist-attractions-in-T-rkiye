import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith, parseLocale, parseQueryWith } from "~/lib/api-helpers";
import { noStore, problem } from "~/lib/api-response";
import { isLocale } from "~/lib/i18n/config";
import { clientIp, enforce } from "~/lib/rate-limit";
import { requireUser } from "~/server/providers/auth";
import { createReview, listReviews } from "~/server/services/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ListQuery = z.object({
  sort: z.enum(["recent", "helpful", "rating_high", "rating_low"]).default("recent"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const CreateBody = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(20).max(2000),
  consentAccepted: z.literal(true),
  locale: z.string().refine(isLocale).optional(),
  mediaIds: z.array(z.string()).max(5).optional(),
});

export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const params = parseQueryWith(request, ListQuery);
    const result = await listReviews({
      attractionSlug: slug,
      ...(params.sort ? { sort: params.sort } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
      ...(params.offset !== undefined ? { offset: params.offset } : {}),
    });
    return noStore(result);
  } catch (err) {
    return problem(err, request.url);
  }
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser();
    await enforce({ key: `reviews:${user.id}`, limit: 5, windowSec: 24 * 3600 });
    await enforce({ key: `reviews:ip:${clientIp(request)}`, limit: 20, windowSec: 3600 });
    const { slug } = await ctx.params;
    const body = await parseJsonBodyWith(request, CreateBody);
    const result = await createReview({
      userId: user.id,
      authorDisplayName: user.displayName,
      attractionSlug: slug,
      rating: body.rating,
      ...(body.title ? { title: body.title } : {}),
      body: body.body,
      locale: body.locale ?? parseLocale(request),
      ...(body.mediaIds ? { mediaIds: body.mediaIds } : {}),
    });
    return NextResponse.json(
      {
        review: { id: result.review.id, status: result.review.status },
        moderation: result.verdict,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return problem(err, request.url);
  }
}
