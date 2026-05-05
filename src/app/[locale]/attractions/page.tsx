import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AttractionGrid } from "~/components/attraction-grid";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { cn } from "~/lib/utils";
import {
  listAttractions,
  listCategories,
  listRegionsWithProvinces,
} from "~/server/services/attractions";

export const revalidate = 3600;

type Search = {
  category?: string;
  region?: string;
  province?: string;
  sort?: string;
  q?: string;
  isUnesco?: string;
  isFreeEntry?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("attractions") };
}

export default async function AttractionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale: localeParam } = await params;
  const sp = await searchParams;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const t = await getTranslations("attractions");
  const tc = await getTranslations("categories");
  const tr = await getTranslations("regions");
  const tnav = await getTranslations("nav");

  const sort = (
    ["popular", "rating_desc", "rating_asc", "newest"].includes(sp.sort ?? "") ? sp.sort : "popular"
  ) as "popular" | "rating_desc" | "rating_asc" | "newest";

  const [list, categories, regions] = await Promise.all([
    listAttractions({
      locale,
      category: sp.category?.toUpperCase(),
      region: sp.region?.toUpperCase(),
      province: sp.province,
      q: sp.q,
      isUnesco: sp.isUnesco === "true" ? true : undefined,
      isFreeEntry: sp.isFreeEntry === "true" ? true : undefined,
      sort,
      limit: 60,
    }),
    listCategories(locale),
    listRegionsWithProvinces(locale),
  ]);

  return (
    <div className="container py-10">
      <header className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{tnav("home")}</p>
        <h1 className="font-display text-3xl font-bold">{t("all")}</h1>
        <p className="text-sm text-muted-foreground">
          {list.total > 0 ? `${list.total} ${tnav("attractions").toLowerCase()}` : ""}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <FilterSection title={t("filterCategory")}>
            <FilterPill href="/attractions" active={!sp.category} label={t("clearFilters")} />
            {categories.map((c) => (
              <FilterPill
                key={c.code}
                href={`/attractions?category=${c.code}`}
                active={sp.category?.toUpperCase() === c.code}
                label={tc(c.code as never)}
              />
            ))}
          </FilterSection>

          <FilterSection title={t("filterRegion")}>
            <FilterPill href="/attractions" active={!sp.region} label={t("clearFilters")} />
            {regions.map((r) => (
              <FilterPill
                key={r.code}
                href={`/attractions?region=${r.code}`}
                active={sp.region?.toUpperCase() === r.code}
                label={tr(r.code as never)}
              />
            ))}
          </FilterSection>

          <FilterSection title={t("filters")}>
            <FilterPill
              href="/attractions?isFreeEntry=true"
              active={sp.isFreeEntry === "true"}
              label={t("filterFreeEntry")}
            />
            <FilterPill
              href="/attractions?isUnesco=true"
              active={sp.isUnesco === "true"}
              label={t("filterUnesco")}
            />
          </FilterSection>
        </aside>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("sortBy")}:{" "}
              {(["popular", "rating_desc", "rating_asc", "newest"] as const).map((s, i) => (
                <span key={s}>
                  {i > 0 && " · "}
                  <Link
                    href={{
                      pathname: "/attractions",
                      query: { ...sp, sort: s },
                    }}
                    className={cn(
                      "hover:text-primary",
                      sort === s && "font-semibold text-foreground",
                    )}
                  >
                    {t(
                      `sort.${s === "rating_desc" ? "ratingDesc" : s === "rating_asc" ? "ratingAsc" : s}` as never,
                    )}
                  </Link>
                </span>
              ))}
            </p>
          </div>
          {list.items.length === 0 ? (
            <p className="rounded-md border border-border bg-card p-6 text-center text-muted-foreground">
              {t("clearFilters")}
            </p>
          ) : (
            <AttractionGrid attractions={list.items} />
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary",
      )}
    >
      {label}
    </a>
  );
}
