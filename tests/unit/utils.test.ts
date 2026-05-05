import { describe, expect, it } from "vitest";
import { slugify, turkishNormalize, haversineKm, bboxContains, formatDistance, chunk, uniqBy } from "~/lib/utils";

describe("slugify", () => {
  it("normalizes Turkish characters and spaces", () => {
    expect(slugify("Ayasofya Camii")).toBe("ayasofya-camii");
    expect(slugify("Göbekli Tepe")).toBe("gobekli-tepe");
    expect(slugify("İstanbul'un İncisi")).toBe("istanbulun-incisi");
  });
});

describe("turkishNormalize", () => {
  it("strips diacritics for case-insensitive search", () => {
    expect(turkishNormalize("Türkiye")).toBe("turkiye");
    expect(turkishNormalize("ÇANAKKALE")).toBe("canakkale");
  });
});

describe("haversineKm", () => {
  it("computes great-circle distance", () => {
    const istanbul = { lat: 41.0082, lng: 28.9784 };
    const ankara = { lat: 39.9334, lng: 32.8597 };
    const km = haversineKm(istanbul, ankara);
    expect(km).toBeGreaterThan(340);
    expect(km).toBeLessThan(360);
  });
});

describe("bboxContains", () => {
  it("checks point membership", () => {
    const bbox = { minLat: 36, minLng: 26, maxLat: 42, maxLng: 45 };
    expect(bboxContains(bbox, { lat: 41, lng: 29 })).toBe(true);
    expect(bboxContains(bbox, { lat: 35, lng: 29 })).toBe(false);
  });
});

describe("formatDistance", () => {
  it("formats meters and kilometers", () => {
    expect(formatDistance(450, "en")).toBe("450 m");
    expect(formatDistance(1234, "en")).toMatch(/1\.2 km|1\.2\s?km/);
  });
});

describe("chunk", () => {
  it("partitions arrays into batches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});

describe("uniqBy", () => {
  it("dedupes by key", () => {
    expect(uniqBy([{ id: 1 }, { id: 1 }, { id: 2 }], (x) => x.id)).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
