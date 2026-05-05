import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600;

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Türkiye Tourism API",
    version: "1.0.0",
    description: "Public REST API for the Türkiye Tourism platform.",
    contact: { email: "api@turkiye-tourism.example" },
    license: { name: "MIT" },
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/attractions": {
      get: {
        summary: "List attractions",
        parameters: [
          { name: "locale", in: "query", schema: { type: "string", enum: ["tr", "en"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "region", in: "query", schema: { type: "string" } },
          { name: "province", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string", maxLength: 200 } },
          {
            name: "bbox",
            in: "query",
            description: "minLng,minLat,maxLng,maxLat",
            schema: { type: "string" },
          },
          { name: "near", in: "query", description: "lat,lng,radiusM", schema: { type: "string" } },
          { name: "isUnesco", in: "query", schema: { type: "boolean" } },
          { name: "isFreeEntry", in: "query", schema: { type: "boolean" } },
          {
            name: "sort",
            in: "query",
            schema: { type: "string", enum: ["popular", "rating_desc", "rating_asc", "newest"] },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AttractionList" } },
            },
          },
          "400": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/attractions/{slug}": {
      get: {
        summary: "Get attraction by slug (locale-aware)",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "locale", in: "query", schema: { type: "string", enum: ["tr", "en"] } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AttractionDetail" } },
            },
          },
          "404": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/attractions/nearby": {
      get: {
        summary: "Find attractions near a point",
        parameters: [
          { name: "lat", in: "query", required: true, schema: { type: "number" } },
          { name: "lng", in: "query", required: true, schema: { type: "number" } },
          { name: "radius", in: "query", schema: { type: "integer", default: 20000 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "excludeId", in: "query", schema: { type: "string" } },
          { name: "locale", in: "query", schema: { type: "string", enum: ["tr", "en"] } },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
    "/attractions/map": {
      get: {
        summary: "Lightweight map markers",
        parameters: [{ name: "bbox", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/categories": {
      get: { summary: "List categories", responses: { "200": { description: "OK" } } },
    },
    "/regions": {
      get: { summary: "List regions with provinces", responses: { "200": { description: "OK" } } },
    },
    "/search": {
      get: {
        summary: "Full-text search (Phase 3 — Meilisearch + DB fallback)",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" } },
          { name: "locale", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
  },
  components: {
    responses: {
      Problem: {
        description: "RFC 7807 problem details",
        content: {
          "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } },
        },
      },
    },
    schemas: {
      Problem: {
        type: "object",
        required: ["type", "title", "status"],
        properties: {
          type: { type: "string", format: "uri" },
          title: { type: "string" },
          status: { type: "integer" },
          detail: { type: "string" },
          instance: { type: "string" },
          errors: {
            type: "object",
            additionalProperties: { type: "array", items: { type: "string" } },
          },
        },
      },
      Media: {
        type: "object",
        properties: {
          id: { type: "string" },
          url: { type: "string" },
          type: { type: "string", enum: ["IMAGE", "VIDEO"] },
          alt: { type: "string" },
          photographer: { type: "string", nullable: true },
          license: { type: "string" },
          attribution: { type: "string", nullable: true },
          isHero: { type: "boolean" },
        },
      },
      AttractionListItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          name: { type: "string" },
          summary: { type: "string" },
          category: {
            type: "object",
            properties: { code: { type: "string" }, name: { type: "string" } },
          },
          region: {
            type: "object",
            properties: { code: { type: "string" }, name: { type: "string" } },
          },
          province: {
            type: "object",
            properties: { slug: { type: "string" }, name: { type: "string" } },
          },
          district: { type: "string", nullable: true },
          latitude: { type: "number" },
          longitude: { type: "number" },
          unescoStatus: { type: "string", nullable: true },
          averageRating: { type: "number" },
          reviewCount: { type: "integer" },
          isFreeEntry: { type: "boolean" },
          popularityScore: { type: "number" },
          heroImage: { $ref: "#/components/schemas/Media", nullable: true },
          distanceMeters: { type: "integer", nullable: true },
        },
      },
      AttractionList: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/AttractionListItem" } },
          nextCursor: { type: "string", nullable: true },
          total: { type: "integer" },
        },
      },
      AttractionDetail: {
        allOf: [
          { $ref: "#/components/schemas/AttractionListItem" },
          {
            type: "object",
            properties: {
              description: { type: "string" },
              history: { type: "string", nullable: true },
              tips: { type: "string", nullable: true },
              elevationM: { type: "integer", nullable: true },
              media: { type: "array", items: { $ref: "#/components/schemas/Media" } },
              operatingHours: { type: "array" },
              pricing: { type: "array" },
              accessibility: { type: "object", nullable: true },
              related: {
                type: "array",
                items: { $ref: "#/components/schemas/AttractionListItem" },
              },
            },
          },
        ],
      },
    },
  },
} as const;

export async function GET() {
  return NextResponse.json(spec, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
