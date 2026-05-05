import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "~/server/db/client";
import {
  getAttractionBySlug,
  listAttractions,
  listCategories,
  listMapMarkers,
  listRegionsWithProvinces,
  nearbyAttractions,
} from "~/server/services/attractions";
import { NotFoundError } from "~/lib/errors";

beforeAll(async () => {
  // Tests rely on the seeded dataset. Verify it's present.
  const count = await prisma.attraction.count();
  if (count < 5) throw new Error("seed missing — run pnpm db:seed first");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("attractions service", () => {
  it("listAttractions returns published items with translation per locale", async () => {
    const tr = await listAttractions({ locale: "tr", limit: 100 });
    expect(tr.items.length).toBeGreaterThanOrEqual(5);
    expect(tr.items.every((i) => i.name.length > 0)).toBe(true);
    expect(tr.total).toBe(tr.items.length);

    const en = await listAttractions({ locale: "en", limit: 100 });
    const ayasofyaTr = tr.items.find((i) => i.slug.startsWith("ayasofya"));
    const ayasofyaEn = en.items.find((i) => i.slug.includes("hagia-sophia"));
    expect(ayasofyaTr).toBeDefined();
    expect(ayasofyaEn).toBeDefined();
    expect(ayasofyaEn?.name).toContain("Hagia Sophia");
  });

  it("filters by category and unesco status", async () => {
    const archs = await listAttractions({ locale: "en", category: "ARCHAEOLOGICAL", limit: 100 });
    expect(archs.items.every((i) => i.category.code === "ARCHAEOLOGICAL")).toBe(true);

    const unesco = await listAttractions({ locale: "en", isUnesco: true, limit: 100 });
    expect(unesco.items.every((i) => i.unescoStatus !== null)).toBe(true);
  });

  it("respects bbox filter", async () => {
    const istanbul = await listAttractions({
      locale: "en",
      bbox: { minLat: 40, minLng: 28, maxLat: 42, maxLng: 30 },
      limit: 100,
    });
    expect(istanbul.items.length).toBeGreaterThanOrEqual(2);
    expect(istanbul.items.every((i) => i.latitude >= 40 && i.latitude <= 42)).toBe(true);
  });

  it("near filter sorts by distance", async () => {
    // From Istanbul, Hagia Sophia should be closer than Cappadocia.
    const result = await listAttractions({
      locale: "en",
      near: { lat: 41.01, lng: 28.97, radiusM: 1_500_000 },
      limit: 50,
    });
    const distances = result.items.map((i) => i.distanceMeters ?? Number.POSITIVE_INFINITY);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    expect(result.items[0]?.distanceMeters).toBeLessThan(distances[1] ?? Number.POSITIVE_INFINITY);
  });

  it("getAttractionBySlug resolves locale and falls back across locales", async () => {
    const trDetail = await getAttractionBySlug("ayasofya-i-kebir-cami-i-serifi", "tr");
    expect(trDetail.name).toMatch(/Ayasofya/);
    expect(trDetail.media.length).toBeGreaterThan(0);
    expect(trDetail.related.length).toBeGreaterThan(0);

    // Cross-locale: TR slug requested with en locale should still resolve and return EN content.
    const enDetail = await getAttractionBySlug("ayasofya-i-kebir-cami-i-serifi", "en");
    expect(enDetail.name).toMatch(/Hagia Sophia/);
  });

  it("getAttractionBySlug throws NotFoundError on unknown slug", async () => {
    await expect(getAttractionBySlug("not-a-real-attraction", "en")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("nearbyAttractions filters by radius and sorts", async () => {
    const items = await nearbyAttractions({
      lat: 41.01,
      lng: 28.97,
      radiusM: 100_000,
      locale: "en",
      limit: 5,
    });
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.every((i) => (i.distanceMeters ?? 0) <= 100_000)).toBe(true);
  });

  it("listMapMarkers returns lightweight rows", async () => {
    const { 0: marker } = (await listMapMarkers({ locale: "en" })) as unknown as [
      { id: string; slug: string; lat: number; lng: number; name: string },
    ];
    expect(marker).toBeDefined();
    expect(marker.slug).toBeTruthy();
  });

  it("listCategories returns localized labels", async () => {
    const tr = await listCategories("tr");
    const en = await listCategories("en");
    expect(tr.find((c) => c.code === "RELIGIOUS")?.name).toBe("Dini yer");
    expect(en.find((c) => c.code === "RELIGIOUS")?.name).toBe("Religious site");
  });

  it("listRegionsWithProvinces nests provinces", async () => {
    const tr = await listRegionsWithProvinces("tr");
    const marmara = tr.find((r) => r.code === "MARMARA");
    expect(marmara).toBeDefined();
    expect(marmara?.provinces.find((p) => p.slug === "istanbul")).toBeDefined();
  });
});
