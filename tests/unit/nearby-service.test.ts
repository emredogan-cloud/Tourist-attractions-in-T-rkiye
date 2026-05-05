import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "~/server/db/client";
import { nearbyForAttraction, recordAffiliateClick } from "~/server/services/nearby";
import { NotFoundError } from "~/lib/errors";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("NearbyService", () => {
  it("throws NotFoundError on unknown slug", async () => {
    await expect(
      nearbyForAttraction({ slug: "no-such-slug", type: "HOTEL" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns hotels for an attraction (mock provider)", async () => {
    const tr = await prisma.attractionTranslation.findFirstOrThrow({
      where: { slug: { startsWith: "ayasofya" } },
    });
    const r = await nearbyForAttraction({ slug: tr.slug, type: "HOTEL", limit: 5 });
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items[0]?.affiliateRedirectUrl).toMatch(/\/api\/v1\/redirect\/affiliate\//);
    expect(r.items.every((it) => it.distanceM >= 0)).toBe(true);
  });

  it("results are sorted by distance ascending", async () => {
    const tr = await prisma.attractionTranslation.findFirstOrThrow({
      where: { slug: { startsWith: "kapadokya" } },
    });
    const r = await nearbyForAttraction({ slug: tr.slug, type: "RESTAURANT", limit: 5 });
    const ds = r.items.map((it) => it.distanceM);
    expect(ds).toEqual([...ds].sort((a, b) => a - b));
  });

  it("affiliate click writes to AffiliateClick and returns external url", async () => {
    const tr = await prisma.attractionTranslation.findFirstOrThrow({
      where: { slug: { startsWith: "pamukkale" } },
    });
    const r = await nearbyForAttraction({ slug: tr.slug, type: "HOTEL", limit: 1 });
    const placeId = r.items[0]?.id;
    expect(placeId).toBeDefined();
    if (!placeId) return;
    const result = await recordAffiliateClick({ placeId, locale: "en" });
    expect(result?.externalUrl).toMatch(/^https?:\/\//);
    const clicks = await prisma.affiliateClick.count({ where: { placeId } });
    expect(clicks).toBeGreaterThanOrEqual(1);
  });
});
