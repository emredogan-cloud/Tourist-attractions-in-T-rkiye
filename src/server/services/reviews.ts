import type { Prisma } from "@prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "~/lib/errors";
import type { Locale } from "~/lib/i18n/config";
import { logger } from "~/lib/logger";
import { prisma } from "~/server/db/client";
import { getModerationProvider } from "~/server/providers/moderation";

export type CreateReviewInput = {
  userId: string;
  authorDisplayName: string | null;
  attractionSlug: string;
  rating: number;
  title?: string;
  body: string;
  locale: Locale;
  mediaIds?: string[];
};

const MIN_BODY = 20;
const MAX_BODY = 2000;
const MAX_TITLE = 100;
const MAX_REVIEWS_PER_DAY = 5;

export async function createReview(input: CreateReviewInput) {
  if (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
    throw new ValidationError("Rating must be an integer 1–5");
  }
  const body = input.body.trim();
  if (body.length < MIN_BODY || body.length > MAX_BODY) {
    throw new ValidationError(`Body must be ${MIN_BODY}–${MAX_BODY} characters`);
  }
  if (input.title && input.title.length > MAX_TITLE) {
    throw new ValidationError(`Title must be ≤ ${MAX_TITLE} characters`);
  }
  // Resolve attraction by translation slug across all locales (so the same
  // attraction can have a single review per user regardless of slug locale).
  const tr = await prisma.attractionTranslation.findFirst({
    where: { slug: input.attractionSlug },
    select: { attractionId: true },
  });
  if (!tr) throw new NotFoundError("Attraction");

  // Per-user, per-attraction uniqueness is enforced by a DB unique constraint.
  // Prevent burst writes: max 5 reviews/day per user.
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const recentCount = await prisma.review.count({
    where: { userId: input.userId, createdAt: { gte: since } },
  });
  if (recentCount >= MAX_REVIEWS_PER_DAY) {
    throw new ConflictError("Daily review limit reached");
  }

  // Auto-moderation pipeline
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { createdAt: true },
  });
  const accountAgeMs = user ? Date.now() - user.createdAt.getTime() : undefined;
  const moderation = getModerationProvider();
  const verdict = await moderation.classify({
    text: `${input.title ?? ""}\n${body}`,
    locale: input.locale,
    context: { authorId: input.userId, ...(accountAgeMs !== undefined ? { accountAgeMs } : {}) },
  });

  const status = verdict.isClean ? "APPROVED" : "PENDING";

  try {
    const review = await prisma.review.create({
      data: {
        attractionId: tr.attractionId,
        userId: input.userId,
        authorDisplayName: input.authorDisplayName,
        rating: input.rating,
        ...(input.title ? { title: input.title } : {}),
        body,
        locale: input.locale,
        status,
        autoModerationFlags: JSON.stringify({ flags: verdict.flags, reasons: verdict.reasons }),
        ...(status === "APPROVED" ? { publishedAt: new Date() } : {}),
        ...(input.mediaIds && input.mediaIds.length > 0
          ? {
              media: {
                create: input.mediaIds.map((mediaId, i) => ({
                  url: `/storage/local/reviews/${mediaId}`, // resolved client-side via media GET
                  sortOrder: i,
                })),
              },
            }
          : {}),
      },
    });
    if (status === "APPROVED") {
      await recomputeRating(tr.attractionId);
    }
    return { review, verdict };
  } catch (err) {
    if (err instanceof Error && /Unique constraint/.test(err.message)) {
      throw new ConflictError("You have already reviewed this attraction");
    }
    throw err;
  }
}

export async function listReviews(args: {
  attractionSlug: string;
  sort?: "recent" | "helpful" | "rating_high" | "rating_low";
  limit?: number;
  offset?: number;
  includePending?: boolean;
}) {
  const tr = await prisma.attractionTranslation.findFirst({
    where: { slug: args.attractionSlug },
    select: { attractionId: true },
  });
  if (!tr) throw new NotFoundError("Attraction");
  const orderBy: Prisma.ReviewOrderByWithRelationInput =
    args.sort === "helpful"
      ? { helpfulCount: "desc" }
      : args.sort === "rating_high"
        ? { rating: "desc" }
        : args.sort === "rating_low"
          ? { rating: "asc" }
          : { createdAt: "desc" };
  const where: Prisma.ReviewWhereInput = {
    attractionId: tr.attractionId,
    ...(args.includePending ? {} : { status: "APPROVED" }),
  };
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy,
      take: Math.min(args.limit ?? 20, 100),
      skip: args.offset ?? 0,
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        user: { select: { displayName: true, avatarUrl: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  // Histogram (1..5 buckets)
  const ratings = await prisma.review.groupBy({
    by: ["rating"],
    where: { attractionId: tr.attractionId, status: "APPROVED" },
    _count: { rating: true },
  });
  const histogram: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    histogram[r.rating as 1 | 2 | 3 | 4 | 5] = r._count.rating;
  }

  return { items, total, histogram };
}

export async function recomputeRating(attractionId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { attractionId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.attraction.update({
    where: { id: attractionId },
    data: {
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count._all,
    },
  });
}

export async function reactToReview(args: {
  reviewId: string;
  userId: string;
  type: "HELPFUL" | "REPORT";
  reason?: string;
}) {
  const review = await prisma.review.findUnique({ where: { id: args.reviewId } });
  if (!review) throw new NotFoundError("Review");
  await prisma.reviewReaction.upsert({
    where: { reviewId_userId_type: { reviewId: args.reviewId, userId: args.userId, type: args.type } },
    create: { reviewId: args.reviewId, userId: args.userId, type: args.type, reason: args.reason ?? null },
    update: { reason: args.reason ?? null },
  });
  if (args.type === "HELPFUL") {
    const count = await prisma.reviewReaction.count({
      where: { reviewId: args.reviewId, type: "HELPFUL" },
    });
    await prisma.review.update({ where: { id: args.reviewId }, data: { helpfulCount: count } });
  } else {
    logger.info({ reviewId: args.reviewId, reason: args.reason }, "review.reported");
  }
}

export async function removeReaction(args: { reviewId: string; userId: string; type: "HELPFUL" }) {
  await prisma.reviewReaction.deleteMany({
    where: { reviewId: args.reviewId, userId: args.userId, type: args.type },
  });
  const count = await prisma.reviewReaction.count({
    where: { reviewId: args.reviewId, type: "HELPFUL" },
  });
  await prisma.review.update({ where: { id: args.reviewId }, data: { helpfulCount: count } });
}

export async function softDeleteReview(args: { reviewId: string; userId: string }) {
  const review = await prisma.review.findUnique({ where: { id: args.reviewId } });
  if (!review) throw new NotFoundError("Review");
  if (review.userId !== args.userId) {
    throw new ValidationError("Cannot delete another user's review");
  }
  await prisma.review.update({
    where: { id: args.reviewId },
    data: { status: "HIDDEN" },
  });
  await recomputeRating(review.attractionId);
}
