import { getTranslations } from "next-intl/server";
import { AttractionGrid } from "~/components/attraction-grid";
import { GlobalSearch } from "~/components/global-search";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { listAttractions } from "~/server/services/attractions";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: localeParam } = await params;
  const sp = await searchParams;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const t = await getTranslations("search");
  const q = sp.q?.trim() ?? "";

  const { items } = q ? await listAttractions({ locale, q, limit: 60 }) : { items: [] };

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">{t("placeholder").replace(/[…\.]+$/, "")}</h1>
      <div className="mt-4 max-w-xl">
        <GlobalSearch />
      </div>
      <div className="mt-8 space-y-3">
        {q && (
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? t("noResults", { query: q }) : `“${q}” — ${items.length}`}
          </p>
        )}
        <AttractionGrid attractions={items} />
      </div>
    </div>
  );
}
