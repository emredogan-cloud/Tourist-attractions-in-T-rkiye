import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AttractionGrid } from "~/components/attraction-grid";
import { DirectionsButton } from "~/components/directions-button";
import { Gallery } from "~/components/gallery";
import { JsonLd } from "~/components/json-ld";
import { OperatingHoursTable } from "~/components/operating-hours";
import { PricingTable } from "~/components/pricing-table";
import { ShareButton } from "~/components/share-button";
import { Badge } from "~/components/ui/badge";
import { NotFoundError, isAppError } from "~/lib/errors";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { getAttractionBySlug, listAttractions } from "~/server/services/attractions";

export const revalidate = 3600;

export async function generateStaticParams() {
  // Pre-render the most popular attractions for both locales.
  const params: { locale: string; slug: string }[] = [];
  for (const locale of ["tr", "en"] as const) {
    const { items } = await listAttractions({ locale, limit: 100, sort: "popular" });
    for (const item of items) params.push({ locale, slug: item.slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  try {
    const detail = await getAttractionBySlug(slug, locale);
    return {
      title: detail.name,
      description: detail.summary,
      openGraph: {
        title: detail.name,
        description: detail.summary,
        type: "article",
        ...(detail.heroImage
          ? { images: [{ url: detail.heroImage.url, alt: detail.heroImage.alt }] }
          : {}),
      },
      alternates: {
        canonical: `/${locale}/attractions/${detail.slug}`,
      },
    };
  } catch {
    return { title: "Attraction" };
  }
}

export default async function AttractionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const t = await getTranslations("detail");
  const tc = await getTranslations("common");
  const tnav = await getTranslations("nav");

  let detail: Awaited<ReturnType<typeof getAttractionBySlug>>;
  try {
    detail = await getAttractionBySlug(slug, locale);
  } catch (err) {
    if (isAppError(err) && err instanceof NotFoundError) notFound();
    throw err;
  }

  const ld = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: detail.name,
    description: detail.summary,
    image: detail.media.map((m) => m.url),
    geo: {
      "@type": "GeoCoordinates",
      latitude: detail.latitude,
      longitude: detail.longitude,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: detail.province.name,
      addressRegion: detail.region.name,
      addressCountry: "TR",
    },
    aggregateRating: detail.reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: detail.averageRating,
          reviewCount: detail.reviewCount,
        }
      : undefined,
    isAccessibleForFree: detail.isFreeEntry,
  };

  return (
    <article className="pb-16">
      <JsonLd data={ld} />
      <div className="container py-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            {tnav("home")}
          </Link>
          {" / "}
          <Link href="/attractions" className="hover:text-primary">
            {tnav("attractions")}
          </Link>
          {" / "}
          <span className="text-foreground">{detail.name}</span>
        </nav>
      </div>

      <div className="container space-y-8">
        <header className="grid gap-6 md:grid-cols-[1fr,auto] md:items-end">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">{detail.category.name}</Badge>
              {detail.unescoStatus && <Badge variant="gold">{t("unesco")}</Badge>}
              {detail.isFreeEntry && <Badge variant="success">{tc("free")}</Badge>}
              <span className="text-sm text-muted-foreground">
                {detail.province.name}
                {detail.district ? ` / ${detail.district}` : ""}
              </span>
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl text-balance">
              {detail.name}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground text-pretty">{detail.summary}</p>
            <p className="text-sm text-muted-foreground">
              <span aria-hidden className="text-amber-500">
                ★
              </span>{" "}
              <span className="font-medium text-foreground">{detail.averageRating.toFixed(1)}</span>
              {" / 5"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DirectionsButton lat={detail.latitude} lng={detail.longitude} name={detail.name} />
            <ShareButton
              url={`${process.env.APP_URL ?? "https://turkiye-tourism.app"}/${locale}/attractions/${detail.slug}`}
              title={detail.name}
            />
          </div>
        </header>

        <Gallery media={detail.media} />

        <div className="grid gap-10 lg:grid-cols-[1fr,360px]">
          <div className="space-y-10">
            <Section title={t("overview")}>
              <p className="leading-relaxed text-foreground/90">{detail.description}</p>
            </Section>
            {detail.history && (
              <Section title={t("history")}>
                <p className="leading-relaxed text-foreground/90">{detail.history}</p>
              </Section>
            )}
            {detail.tips && (
              <Section title={t("tips")}>
                <p className="leading-relaxed text-foreground/90">{detail.tips}</p>
              </Section>
            )}

            {detail.related.length > 0 && (
              <Section title={t("nearby")}>
                <AttractionGrid
                  attractions={detail.related}
                  className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                />
              </Section>
            )}
          </div>

          <aside className="space-y-6">
            <SidebarBlock title={t("openingHours")}>
              {detail.operatingHours.length > 0 ? (
                <OperatingHoursTable hours={detail.operatingHours} />
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </SidebarBlock>
            <SidebarBlock title={t("pricing")}>
              <PricingTable pricing={detail.pricing} />
            </SidebarBlock>
            <SidebarBlock title={t("location")}>
              <p className="text-sm text-muted-foreground">
                {detail.latitude.toFixed(4)}, {detail.longitude.toFixed(4)}
                {detail.elevationM ? ` · ${detail.elevationM} m` : ""}
              </p>
            </SidebarBlock>
          </aside>
        </div>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="prose prose-neutral max-w-none dark:prose-invert">{children}</div>
    </section>
  );
}

function SidebarBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 font-display text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}
