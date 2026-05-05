import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AttractionGrid } from "~/components/attraction-grid";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { listAttractions, listRegionsWithProvinces } from "~/server/services/attractions";

export const revalidate = 3600;

const VALID_REGION_CODES = [
  "MARMARA",
  "AEGEAN",
  "MEDITERRANEAN",
  "BLACK_SEA",
  "CENTRAL_ANATOLIA",
  "EASTERN_ANATOLIA",
  "SOUTHEASTERN_ANATOLIA",
];

export async function generateStaticParams() {
  return ["tr", "en"].flatMap((locale) =>
    VALID_REGION_CODES.map((code) => ({ locale, code: code.toLowerCase() })),
  );
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale: localeParam, code: codeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const code = codeParam.toUpperCase();
  if (!VALID_REGION_CODES.includes(code)) notFound();

  const t = await getTranslations("regions");
  const tnav = await getTranslations("nav");
  const [{ items }, regions] = await Promise.all([
    listAttractions({ locale, region: code, limit: 60, sort: "popular" }),
    listRegionsWithProvinces(locale),
  ]);
  const region = regions.find((r) => r.code === code);
  if (!region) notFound();

  return (
    <div className="container py-10">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted-foreground">
        <Link href="/regions" className="hover:text-primary">
          {tnav("regions")}
        </Link>
      </nav>
      <h1 className="font-display text-3xl font-bold">{t(code as never)}</h1>
      <p className="mt-1 text-muted-foreground">
        {region.provinces.length} il · {items.length} {tnav("attractions").toLowerCase()}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {region.provinces.map((p) => (
          <Link
            key={p.slug}
            href={{ pathname: "/attractions", query: { province: p.slug } }}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-primary"
          >
            {p.name}
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <AttractionGrid attractions={items} />
      </div>
    </div>
  );
}
