import { getTranslations } from "next-intl/server";
import { GlobalSearch } from "~/components/global-search";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { getSearchProvider } from "~/server/providers/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    region?: string;
    isFreeEntry?: string;
    isUnesco?: string;
  }>;
}) {
  const { locale: localeParam } = await params;
  const sp = await searchParams;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const t = await getTranslations("search");
  const tnav = await getTranslations("nav");
  const tc = await getTranslations("categories");
  const tr = await getTranslations("regions");
  const q = sp.q?.trim() ?? "";

  const provider = await getSearchProvider();
  const result = q
    ? await provider.search({
        q,
        locale,
        filters: {
          category: sp.category?.toUpperCase(),
          region: sp.region?.toUpperCase(),
          isFreeEntry: sp.isFreeEntry === "true" ? true : undefined,
          isUnesco: sp.isUnesco === "true" ? true : undefined,
        },
        limit: 50,
      })
    : null;

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">{tnav("home")}</h1>
      <div className="mt-4 max-w-xl">
        <GlobalSearch />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px,1fr]">
        <aside className="space-y-4">
          {result && Object.keys(result.facets.category ?? {}).length > 0 && (
            <FacetBlock title={tnav("categories")}>
              {Object.entries(result.facets.category ?? {}).map(([code, count]) => (
                <FacetLink
                  key={code}
                  href={`/search?q=${encodeURIComponent(q)}&category=${code}`}
                  active={sp.category?.toUpperCase() === code}
                  label={tc.has?.(code as never) ? tc(code as never) : code}
                  count={count}
                />
              ))}
            </FacetBlock>
          )}
          {result && Object.keys(result.facets.region ?? {}).length > 0 && (
            <FacetBlock title={tnav("regions")}>
              {Object.entries(result.facets.region ?? {}).map(([region, count]) => (
                <FacetLink
                  key={region}
                  href={`/search?q=${encodeURIComponent(q)}&region=${region.toUpperCase()}`}
                  active={sp.region === region}
                  label={tr.has?.(region as never) ? tr(region as never) : region}
                  count={count}
                />
              ))}
            </FacetBlock>
          )}
        </aside>

        <div className="space-y-4">
          {q && result && (
            <p className="text-sm text-muted-foreground">
              {result.hits.length === 0
                ? t("noResults", { query: q })
                : `${result.total} · ${result.processingMs}ms`}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result?.hits.map((h) => (
              <Link
                key={h.id}
                href={`/attractions/${h.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {h.heroImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={h.heroImageUrl}
                      alt={h.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-xs text-muted-foreground">
                    {h.province} · {h.region}
                  </p>
                  <h3 className="line-clamp-2 font-display text-lg font-semibold group-hover:text-primary">
                    {h.name}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{h.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FacetBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function FacetLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        className={
          active
            ? "flex justify-between rounded px-2 py-1 text-sm bg-primary text-primary-foreground"
            : "flex justify-between rounded px-2 py-1 text-sm hover:bg-secondary"
        }
      >
        <span>{label}</span>
        <span className="text-xs opacity-60">{count}</span>
      </a>
    </li>
  );
}
