import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as listGET } from "~/app/api/v1/attractions/route";
import { GET as detailGET } from "~/app/api/v1/attractions/[slug]/route";
import { GET as nearbyGET } from "~/app/api/v1/attractions/nearby/route";
import { GET as mapGET } from "~/app/api/v1/attractions/map/route";
import { GET as categoriesGET } from "~/app/api/v1/categories/route";
import { GET as regionsGET } from "~/app/api/v1/regions/route";
import { GET as openapiGET } from "~/app/api/v1/openapi.json/route";

function req(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(url, "http://localhost"), { headers });
}

describe("API routes", () => {
  it("GET /api/v1/attractions returns list with cache headers", async () => {
    const res = await listGET(req("/api/v1/attractions?limit=5"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
    const body = (await res.json()) as { items: unknown[]; total: number };
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(0);
  });

  it("locale falls back to Accept-Language", async () => {
    const res = await listGET(req("/api/v1/attractions", { "accept-language": "en" }));
    const body = (await res.json()) as { items: { name: string }[] };
    expect(body.items[0]?.name).toMatch(/Hagia|Cappadocia|Pamukkale|Ephesus|Topkapı|Sumela|Göbekli|Nemrut/);
  });

  it("rejects invalid bbox", async () => {
    const res = await listGET(req("/api/v1/attractions?bbox=not-valid"));
    expect(res.status).toBe(400);
    expect(res.headers.get("Content-Type")).toContain("problem+json");
  });

  it("GET /api/v1/attractions/:slug returns detail with ETag", async () => {
    const res = await detailGET(req("/api/v1/attractions/ayasofya-i-kebir-cami-i-serifi", { "accept-language": "en" }), {
      params: Promise.resolve({ slug: "ayasofya-i-kebir-cami-i-serifi" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("ETag")).toBeTruthy();
    const body = (await res.json()) as { name: string; pricing: unknown[]; media: unknown[] };
    expect(body.name).toMatch(/Hagia Sophia/);
    expect(body.media.length).toBeGreaterThan(0);
    expect(body.pricing.length).toBeGreaterThan(0);
  });

  it("404 on unknown slug", async () => {
    const res = await detailGET(req("/api/v1/attractions/does-not-exist"), {
      params: Promise.resolve({ slug: "does-not-exist" }),
    });
    expect(res.status).toBe(404);
  });

  it("nearby endpoint returns sorted by distance", async () => {
    const res = await nearbyGET(req("/api/v1/attractions/nearby?lat=41.01&lng=28.97&radius=200000&limit=5"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: { distanceMeters?: number }[] };
    expect(body.items.length).toBeGreaterThan(0);
    const dists = body.items.map((i) => i.distanceMeters ?? Number.POSITIVE_INFINITY);
    expect(dists).toEqual([...dists].sort((a, b) => a - b));
  });

  it("map endpoint returns markers", async () => {
    const res = await mapGET(req("/api/v1/attractions/map"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { markers: unknown[]; count: number };
    expect(body.markers.length).toBe(body.count);
  });

  it("categories and regions return localized labels", async () => {
    const cat = await categoriesGET(req("/api/v1/categories?locale=en"));
    expect(cat.status).toBe(200);
    const cBody = (await cat.json()) as { categories: { code: string; name: string }[] };
    expect(cBody.categories.find((c) => c.code === "MUSEUM")?.name).toBe("Museum");

    const reg = await regionsGET(req("/api/v1/regions?locale=tr"));
    const rBody = (await reg.json()) as { regions: { code: string; name: string; provinces: unknown[] }[] };
    expect(rBody.regions.find((r) => r.code === "MARMARA")?.name).toBe("Marmara");
  });

  it("OpenAPI spec is valid JSON with paths", async () => {
    const res = await openapiGET();
    expect(res.status).toBe(200);
    const spec = (await res.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(spec.openapi).toBe("3.1.0");
    expect(Object.keys(spec.paths).length).toBeGreaterThan(5);
  });
});
