import type { NextRequest } from "next/server";
import { parseLocale } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { isLocale } from "~/lib/i18n/config";
import { listRegionsWithProvinces } from "~/server/services/attractions";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const localeParam = url.searchParams.get("locale");
    const locale = isLocale(localeParam) ? localeParam : parseLocale(request);
    const regions = await listRegionsWithProvinces(locale);
    return cached({ regions }, { sMaxAge: 86400 });
  } catch (err) {
    return problem(err, request.url);
  }
}
