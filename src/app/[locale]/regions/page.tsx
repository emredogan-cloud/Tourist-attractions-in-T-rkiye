import { getTranslations } from "next-intl/server";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { listRegionsWithProvinces } from "~/server/services/attractions";

export const revalidate = 86400;

export default async function RegionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const tnav = await getTranslations("nav");
  const regions = await listRegionsWithProvinces(locale);

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">{tnav("regions")}</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {regions.map((r) => (
          <Link
            key={r.code}
            href={`/regions/${r.code.toLowerCase()}`}
            className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary"
          >
            <h2 className="font-display text-xl font-semibold group-hover:text-primary">
              {r.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {r.provinces.length} il ·{" "}
              {r.provinces
                .map((p) => p.name)
                .slice(0, 4)
                .join(", ")}
              {r.provinces.length > 4 ? "…" : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
