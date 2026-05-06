import { getConfig } from "~/lib/config";
import type { Locale } from "~/lib/i18n/config";
import { mvpLocales } from "~/lib/i18n/config";
import { logger } from "~/lib/logger";
import { prisma } from "~/server/db/client";
import { DbSearchProvider } from "./db-provider";
import { MeilisearchProvider } from "./meilisearch-provider";
import type { SearchHit, SearchProvider } from "./types";

export type { SearchHit, SearchResult, SearchSuggestion, SearchProvider } from "./types";

let cached: SearchProvider | undefined;

export async function getSearchProvider(): Promise<SearchProvider> {
  if (cached) return cached;
  const config = getConfig();
  // Try Meilisearch if its host is configured non-default in production-like envs;
  // otherwise default to DB. In all environments, fall back to DB if Meili is unhealthy.
  if (
    config.MEILISEARCH_HOST &&
    !config.MEILISEARCH_HOST.includes("localhost") &&
    config.MEILISEARCH_MASTER_KEY
  ) {
    const meili = new MeilisearchProvider();
    if (await meili.isHealthy()) {
      logger.info({ host: config.MEILISEARCH_HOST }, "search: using Meilisearch");
      cached = meili;
      return cached;
    }
    logger.warn("search: Meilisearch configured but unhealthy — falling back to DB");
  }
  // Even when MEILISEARCH_HOST points at localhost, opportunistically use it if it responds.
  if (config.MEILISEARCH_HOST.includes("localhost")) {
    const meili = new MeilisearchProvider();
    if (await meili.isHealthy()) {
      logger.info("search: using local Meilisearch");
      cached = meili;
      return cached;
    }
  }
  logger.info("search: using DB provider");
  cached = new DbSearchProvider();
  return cached;
}

export async function buildSearchHitsForLocale(locale: Locale): Promise<SearchHit[]> {
  const rows = await prisma.attractionTranslation.findMany({
    where: { locale, attraction: { status: "PUBLISHED" } },
    include: {
      attraction: {
        include: {
          category: true,
          region: true,
          province: true,
          media: { where: { isHero: true }, take: 1 },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.attraction.id,
    slug: r.slug,
    name: r.name,
    summary: r.summary,
    category: r.attraction.category.code,
    province: locale === "en" ? r.attraction.province.nameEn : r.attraction.province.nameTr,
    region: locale === "en" ? r.attraction.region.nameEn : r.attraction.region.nameTr,
    averageRating: r.attraction.averageRating,
    reviewCount: r.attraction.reviewCount,
    isFreeEntry: r.attraction.isFreeEntry,
    isUnesco: r.attraction.unescoStatus !== null,
    popularityScore: r.attraction.popularityScore,
    heroImageUrl: r.attraction.media[0]?.url ?? null,
  }));
}

export async function reindexAttraction(attractionId: string): Promise<void> {
  const provider = await getSearchProvider();
  for (const locale of mvpLocales) {
    const tr = await prisma.attractionTranslation.findUnique({
      where: { attractionId_locale: { attractionId, locale } },
      include: {
        attraction: {
          include: {
            category: true,
            region: true,
            province: true,
            media: { where: { isHero: true }, take: 1 },
          },
        },
      },
    });
    if (!tr) {
      await provider.remove({ ids: [attractionId], locale });
      continue;
    }
    const hit: SearchHit = {
      id: tr.attractionId,
      slug: tr.slug,
      name: tr.name,
      summary: tr.summary,
      category: tr.attraction.category.code,
      province: locale === "en" ? tr.attraction.province.nameEn : tr.attraction.province.nameTr,
      region: locale === "en" ? tr.attraction.region.nameEn : tr.attraction.region.nameTr,
      averageRating: tr.attraction.averageRating,
      reviewCount: tr.attraction.reviewCount,
      isFreeEntry: tr.attraction.isFreeEntry,
      isUnesco: tr.attraction.unescoStatus !== null,
      popularityScore: tr.attraction.popularityScore,
      heroImageUrl: tr.attraction.media[0]?.url ?? null,
    };
    await provider.index({ documents: [hit], locale });
  }
}

export async function reindexAll(): Promise<{ counts: Record<Locale, number> }> {
  const provider = await getSearchProvider();
  const docs = {} as Record<Locale, SearchHit[]>;
  for (const locale of mvpLocales) {
    docs[locale] = await buildSearchHitsForLocale(locale);
  }
  await provider.reindexAll({ documents: docs });
  return {
    counts: Object.fromEntries(Object.entries(docs).map(([k, v]) => [k, v.length])) as Record<
      Locale,
      number
    >,
  };
}
