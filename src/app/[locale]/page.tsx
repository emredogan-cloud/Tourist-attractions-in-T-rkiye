import { getTranslations } from "next-intl/server";
import { AttractionGrid } from "~/components/attraction-grid";
import { GlobalSearch } from "~/components/global-search";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { getCurrentSession } from "~/server/providers/auth";
import {
  listAttractions,
  listCategories,
  listRegionsWithProvinces,
} from "~/server/services/attractions";
import { recommendForUser } from "~/server/services/recommendations";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const t = await getTranslations("home");
  const tn = await getTranslations("nav");
  const tc = await getTranslations("categories");
  const session = await getCurrentSession();

  const [{ items: featured }, categories, regions, recommended] = await Promise.all([
    listAttractions({ locale, limit: 8, sort: "popular" }),
    listCategories(locale),
    listRegionsWithProvinces(locale),
    session
      ? recommendForUser({ userId: session.user.id, locale, limit: 4 })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-16 pb-16">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-turkiye-red/10 via-turkiye-gold/10 to-turkiye-sky/10"
          aria-hidden
        />
        <div className="container relative grid items-center gap-10 py-16 md:grid-cols-[1.1fr,1fr] md:py-24">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              ✨ {t("popularSearches")}
            </span>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl text-balance">
              {t("heroTitle")}
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground text-pretty">
              {t("heroSubtitle")}
            </p>
            <div className="max-w-lg">
              <GlobalSearch />
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/attractions"
                className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("heroCta")}
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center rounded-md border border-input bg-background px-5 py-2.5 hover:bg-secondary"
              >
                {tn("map")}
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <span>{t("stats.attractions", { count: 500 })}</span>
              <span>{t("stats.regions")}</span>
              <span>{t("stats.provinces")}</span>
              <span>{t("stats.languages")}</span>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            {featured.slice(0, 4).map((a, i) => (
              <Link
                key={a.id}
                href={`/attractions/${a.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-muted shadow-sm transition hover:shadow-lg"
                style={{ transform: `translateY(${(i % 2) * 24}px)` }}
              >
                {a.heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.heroImage.url}
                    alt={a.heroImage.alt}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading={i < 2 ? "eager" : "lazy"}
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                  <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                    {a.province.name}
                  </p>
                  <h3 className="line-clamp-2 font-display text-base font-semibold">{a.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {recommended.length > 0 && (
        <section className="container space-y-6">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              {locale === "tr" ? "Sizin için önerilenler" : "Recommended for you"}
            </h2>
          </div>
          <AttractionGrid attractions={recommended} />
        </section>
      )}

      <section className="container space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">{t("featured")}</h2>
            <p className="text-sm text-muted-foreground">{t("heroSubtitle")}</p>
          </div>
          <Link href="/attractions" className="text-sm text-primary hover:underline">
            {tn("attractions")} →
          </Link>
        </div>
        <AttractionGrid attractions={featured} />
      </section>

      <section className="container space-y-6">
        <div>
          <h2 className="font-display text-2xl font-semibold">{t("exploreByCategory")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.code}
              href={`/categories/${c.slug}`}
              className="group flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-4 text-center transition hover:border-primary hover:bg-secondary/40"
            >
              <span className="text-2xl" aria-hidden>
                {emojiForCategory(c.code)}
              </span>
              <span className="text-sm font-medium group-hover:text-primary">
                {tc(c.code as never)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container space-y-6">
        <div>
          <h2 className="font-display text-2xl font-semibold">{t("exploreByRegion")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {regions.map((r) => (
            <Link
              key={r.code}
              href={`/regions/${r.code.toLowerCase()}`}
              className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary hover:bg-secondary/40"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {r.provinces.length} il
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold group-hover:text-primary">
                {r.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {r.provinces
                  .slice(0, 5)
                  .map((p) => p.name)
                  .join(", ")}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function emojiForCategory(code: string) {
  const map: Record<string, string> = {
    HISTORICAL: "🏛️",
    NATURAL: "🏞️",
    RELIGIOUS: "🕌",
    CULTURAL: "🎭",
    BEACH: "🏖️",
    MUSEUM: "🖼️",
    ARCHAEOLOGICAL: "🗿",
    ADVENTURE: "🪂",
    URBAN: "🏙️",
    FOOD_DRINK: "🍽️",
  };
  return map[code] ?? "✦";
}
