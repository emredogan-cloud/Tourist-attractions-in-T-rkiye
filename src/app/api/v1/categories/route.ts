import type { NextRequest } from "next/server";
import { parseLocale } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { isLocale } from "~/lib/i18n/config";
import { listCategories } from "~/server/services/attractions";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const localeParam = url.searchParams.get("locale");
    const locale = isLocale(localeParam) ? localeParam : parseLocale(request);
    const categories = await listCategories(locale);
    return cached({ categories }, { sMaxAge: 86400 });
  } catch (err) {
    return problem(err, request.url);
  }
}
