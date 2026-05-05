import type { NextRequest } from "next/server";
import { z } from "zod";
import { ValidationError } from "./errors";
import { type Locale, defaultLocale, isLocale } from "./i18n/config";

export function parseLocale(request: NextRequest): Locale {
  const fromHeader = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0];
  return isLocale(fromHeader) ? fromHeader : defaultLocale;
}

export function parseQueryWith<S extends z.ZodTypeAny>(
  request: NextRequest | URL,
  schema: S,
): z.infer<S> {
  const url = request instanceof URL ? request : new URL(request.url);
  const obj: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    const existing = obj[key];
    if (existing === undefined) obj[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else obj[key] = [existing, value];
  }
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    throw new ValidationError(
      "Invalid query parameters",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  return parsed.data;
}

export async function parseJsonBodyWith<S extends z.ZodTypeAny>(
  request: NextRequest,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("Body must be valid JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      "Invalid request body",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  return parsed.data;
}

export const localeQuery = z.string().transform((v) => (isLocale(v) ? v : defaultLocale));

export const bboxSchema = z.string().transform((s, ctx) => {
  const parts = s.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "bbox must be 4 comma-separated numbers",
    });
    return z.NEVER;
  }
  const [minLng, minLat, maxLng, maxLat] = parts as [number, number, number, number];
  return { minLng, minLat, maxLng, maxLat };
});

export const nearSchema = z.string().transform((s, ctx) => {
  const parts = s.split(",").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "near must be lat,lng,radiusMeters",
    });
    return z.NEVER;
  }
  const [lat, lng, radiusM] = parts as [number, number, number];
  return { lat, lng, radiusM };
});
