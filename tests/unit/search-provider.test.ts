import { describe, expect, it } from "vitest";
import { DbSearchProvider } from "~/server/providers/search/db-provider";

describe("DbSearchProvider", () => {
  const provider = new DbSearchProvider();

  it("finds Hagia Sophia in en locale by name", async () => {
    const r = await provider.search({ q: "hagia sophia", locale: "en", limit: 5 });
    expect(r.hits[0]?.name).toMatch(/Hagia Sophia/);
    expect(r.processingMs).toBeGreaterThanOrEqual(0);
  });

  it("finds Ayasofya synonym → Hagia Sophia in en", async () => {
    const r = await provider.search({ q: "ayasofya", locale: "en", limit: 5 });
    expect(r.hits[0]?.name).toMatch(/Hagia Sophia/);
  });

  it("matches Turkish diacritic-stripped queries", async () => {
    const r = await provider.search({ q: "gobekli tepe", locale: "en", limit: 5 });
    expect(r.hits[0]?.name).toMatch(/Göbekli Tepe/);
  });

  it("respects category filter", async () => {
    const r = await provider.search({ q: "antik", locale: "tr", filters: { category: "ARCHAEOLOGICAL" }, limit: 10 });
    expect(r.hits.every((h) => h.category === "ARCHAEOLOGICAL")).toBe(true);
  });

  it("respects isUnesco filter", async () => {
    const r = await provider.search({ q: "tarih", locale: "tr", filters: { isUnesco: true }, limit: 10 });
    expect(r.hits.every((h) => h.isUnesco)).toBe(true);
  });

  it("returns facets", async () => {
    const r = await provider.search({ q: "tarih", locale: "tr", limit: 50 });
    expect(r.facets.category).toBeDefined();
    expect(r.facets.region).toBeDefined();
  });

  it("suggest returns up to N attractions", async () => {
    const s = await provider.suggest({ q: "kapa", locale: "tr", limit: 3 });
    expect(s.attractions.length).toBeGreaterThanOrEqual(1);
    expect(s.attractions.length).toBeLessThanOrEqual(3);
  });

  it("suggest returns empty for short queries", async () => {
    const s = await provider.suggest({ q: "a", locale: "tr" });
    expect(s.attractions).toEqual([]);
  });
});
