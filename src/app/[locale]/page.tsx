import { getTranslations } from "next-intl/server";
import { GlobalSearch } from "~/components/global-search";
import { Link } from "~/lib/i18n/routing";

export const revalidate = 3600;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params; // ensures locale segment is consumed
  const t = await getTranslations("home");
  const tn = await getTranslations("nav");
  return (
    <div className="space-y-12 pb-16">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-turkiye-red/10 via-turkiye-gold/10 to-turkiye-sky/10"
          aria-hidden
        />
        <div className="container relative grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                name: "Kapadokya",
                img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Goreme_panorama.jpg/640px-Goreme_panorama.jpg",
              },
              {
                name: "Ayasofya",
                img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Ayasofya-Innenansicht.jpg/480px-Ayasofya-Innenansicht.jpg",
              },
              {
                name: "Pamukkale",
                img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Pamukkale_31.jpg/480px-Pamukkale_31.jpg",
              },
              {
                name: "Efes",
                img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ephesus_Library.jpg/480px-Ephesus_Library.jpg",
              },
            ].map((p, i) => (
              <div
                key={p.name}
                className="aspect-[4/5] overflow-hidden rounded-lg bg-muted"
                style={{ transform: `translateY(${(i % 2) * 24}px)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.img}
                  alt={p.name}
                  className="h-full w-full object-cover"
                  loading={i < 2 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">{t("featured")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("stats.attractions", { count: 50 })} · {t("stats.regions")} ·{" "}
              {t("stats.languages")}
            </p>
          </div>
          <Link href="/attractions" className="text-sm text-primary hover:underline">
            {t("popularSearches")} →
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {/* This grid is filled in by Phase 2 with real attractions. */}
          {tn("attractions")}
        </p>
      </section>
    </div>
  );
}
