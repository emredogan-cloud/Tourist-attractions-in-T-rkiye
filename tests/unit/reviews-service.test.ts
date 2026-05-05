import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "~/server/db/client";
import { createReview, listReviews, recomputeRating, removeReaction, reactToReview } from "~/server/services/reviews";
import { ConflictError, ValidationError } from "~/lib/errors";

const EMAIL_A = "reviews-test-a@example.com";
const EMAIL_B = "reviews-test-b@example.com";
let userA: string;
let userB: string;
let slug: string;

beforeAll(async () => {
  await prisma.review.deleteMany({ where: { user: { email: { in: [EMAIL_A, EMAIL_B] } } } });
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
  // Backdate users so the spam:account_age_under_1h heuristic doesn't fire.
  const dayOld = new Date(Date.now() - 24 * 3600 * 1000);
  const a = await prisma.user.create({
    data: { email: EMAIL_A, displayName: "Tester A", consentVersion: "v1", createdAt: dayOld },
  });
  const b = await prisma.user.create({
    data: { email: EMAIL_B, displayName: "Tester B", consentVersion: "v1", createdAt: dayOld },
  });
  userA = a.id;
  userB = b.id;
  // Use the seeded Hagia Sophia slug
  const tr = await prisma.attractionTranslation.findFirstOrThrow({
    where: { slug: { startsWith: "ayasofya" } },
  });
  slug = tr.slug;
});

afterAll(async () => {
  await prisma.review.deleteMany({ where: { user: { email: { in: [EMAIL_A, EMAIL_B] } } } });
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
  await prisma.$disconnect();
});

describe("ReviewsService", () => {
  it("rejects rating outside 1-5", async () => {
    await expect(
      createReview({
        userId: userA,
        authorDisplayName: "A",
        attractionSlug: slug,
        rating: 6,
        body: "This is a fine review with at least twenty characters",
        locale: "en",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects body shorter than 20 chars", async () => {
    await expect(
      createReview({
        userId: userA,
        authorDisplayName: "A",
        attractionSlug: slug,
        rating: 5,
        body: "too short",
        locale: "en",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("creates a clean review and approves it immediately", async () => {
    const r = await createReview({
      userId: userA,
      authorDisplayName: "Tester A",
      attractionSlug: slug,
      rating: 5,
      title: "Magnificent",
      body: "An absolutely magnificent monument that captures fifteen centuries of history.",
      locale: "en",
    });
    expect(r.review.status).toBe("APPROVED");
    expect(r.verdict.isClean).toBe(true);
  });

  it("flags profanity → PENDING", async () => {
    const r = await createReview({
      userId: userB,
      authorDisplayName: "Tester B",
      attractionSlug: slug,
      rating: 1,
      body: "This place was shit and the service was very poor frankly speaking.",
      locale: "en",
    });
    expect(r.review.status).toBe("PENDING");
    expect(r.verdict.flags).toContain("PROFANITY");
  });

  it("rejects duplicate review per user/attraction", async () => {
    await expect(
      createReview({
        userId: userA,
        authorDisplayName: "Tester A",
        attractionSlug: slug,
        rating: 4,
        body: "Trying to post a second review on the same attraction here.",
        locale: "en",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("listReviews returns approved + histogram", async () => {
    const r = await listReviews({ attractionSlug: slug, sort: "recent" });
    expect(r.items.some((i) => i.rating === 5)).toBe(true);
    expect(typeof r.total).toBe("number");
    expect(r.histogram[5]).toBeGreaterThanOrEqual(1);
  });

  it("helpful toggle increments and decrements count", async () => {
    const list = await listReviews({ attractionSlug: slug });
    const target = list.items.find((i) => i.rating === 5);
    expect(target).toBeDefined();
    if (!target) return;
    await reactToReview({ reviewId: target.id, userId: userB, type: "HELPFUL" });
    let after = await prisma.review.findUnique({ where: { id: target.id } });
    expect(after?.helpfulCount).toBe(1);
    await removeReaction({ reviewId: target.id, userId: userB, type: "HELPFUL" });
    after = await prisma.review.findUnique({ where: { id: target.id } });
    expect(after?.helpfulCount).toBe(0);
  });

  it("recomputeRating updates Attraction.averageRating", async () => {
    const tr = await prisma.attractionTranslation.findFirstOrThrow({
      where: { slug: { startsWith: "ayasofya" } },
    });
    await recomputeRating(tr.attractionId);
    const a = await prisma.attraction.findUnique({ where: { id: tr.attractionId } });
    expect(a?.averageRating).toBeGreaterThanOrEqual(0);
  });
});
