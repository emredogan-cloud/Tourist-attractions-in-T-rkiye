import { MeiliSearch, type Index } from "meilisearch";
import { getConfig } from "~/lib/config";
import type { Locale } from "~/lib/i18n/config";
import type { SearchHit, SearchProvider, SearchResult, SearchSuggestion } from "./types";
import { logger } from "~/lib/logger";

const SYNONYMS: Partial<Record<Locale, Record<string, string[]>>> = {
  tr: {
    ayasofya: ["hagia sophia"],
    "hagia sophia": ["ayasofya"],
    kapadokya: ["cappadocia"],
    cappadocia: ["kapadokya"],
    pamukkale: ["cotton castle"],
    "cotton castle": ["pamukkale"],
  },
  en: {
    ayasofya: ["hagia sophia"],
    "hagia sophia": ["ayasofya"],
    kapadokya: ["cappadocia"],
    cappadocia: ["kapadokya"],
  },
};

const STOP_WORDS: Partial<Record<Locale, string[]>> = {
  tr: ["ve", "ile", "için", "bir", "bu", "şu", "o"],
  en: ["the", "a", "an", "of", "and", "or", "in", "on", "at"],
};

export class MeilisearchProvider implements SearchProvider {
  private client: MeiliSearch;
  private indexCache = new Map<string, Index>();
  private settingsApplied = new Set<string>();

  constructor() {
    const config = getConfig();
    this.client = new MeiliSearch({
      host: config.MEILISEARCH_HOST,
      apiKey: config.MEILISEARCH_MASTER_KEY,
      timeout: 3000,
    });
  }

  private indexName(locale: Locale) {
    return `attractions_${locale}`;
  }

  private async ensureIndex(locale: Locale): Promise<Index> {
    const name = this.indexName(locale);
    const cached = this.indexCache.get(name);
    if (cached) return cached;
    try {
      await this.client.createIndex(name, { primaryKey: "id" });
    } catch {
      // index already exists
    }
    const idx = this.client.index(name);
    this.indexCache.set(name, idx);
    if (!this.settingsApplied.has(name)) {
      await idx.updateSettings({
        searchableAttributes: ["name", "summary", "category", "province", "region"],
        filterableAttributes: ["category", "region", "province", "isFreeEntry", "isUnesco", "averageRating"],
        sortableAttributes: ["averageRating", "popularityScore", "reviewCount"],
        rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness"],
        synonyms: SYNONYMS[locale] ?? {},
        stopWords: STOP_WORDS[locale] ?? [],
        typoTolerance: { minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 } },
      });
      this.settingsApplied.add(name);
    }
    return idx;
  }

  async search(args: {
    q: string;
    locale: Locale;
    filters?: { category?: string; region?: string; province?: string; isUnesco?: boolean; isFreeEntry?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<SearchResult> {
    const start = Date.now();
    const idx = await this.ensureIndex(args.locale);
    const filterParts: string[] = [];
    if (args.filters?.category) filterParts.push(`category = "${args.filters.category}"`);
    if (args.filters?.region) filterParts.push(`region = "${args.filters.region}"`);
    if (args.filters?.province) filterParts.push(`province = "${args.filters.province}"`);
    if (args.filters?.isUnesco !== undefined) filterParts.push(`isUnesco = ${args.filters.isUnesco}`);
    if (args.filters?.isFreeEntry !== undefined) filterParts.push(`isFreeEntry = ${args.filters.isFreeEntry}`);

    const result = await idx.search<SearchHit>(args.q, {
      limit: Math.min(args.limit ?? 20, 100),
      offset: args.offset ?? 0,
      filter: filterParts.length ? filterParts : undefined,
      facets: ["category", "region", "province"],
      attributesToHighlight: ["name", "summary"],
      sort: ["popularityScore:desc"],
    });

    const facets: Record<string, Record<string, number>> = {
      category: result.facetDistribution?.category ?? {},
      region: result.facetDistribution?.region ?? {},
      province: result.facetDistribution?.province ?? {},
    };

    return {
      hits: result.hits,
      total: result.estimatedTotalHits ?? result.hits.length,
      facets,
      processingMs: Date.now() - start,
      query: args.q,
    };
  }

  async suggest(args: { q: string; locale: Locale; limit?: number }): Promise<SearchSuggestion> {
    const limit = Math.min(args.limit ?? 5, 10);
    if (args.q.trim().length < 2) return { attractions: [], categories: [], regions: [] };
    const r = await this.search({ q: args.q, locale: args.locale, limit, offset: 0 });
    return {
      attractions: r.hits,
      categories: Object.entries(r.facets.category ?? {}).map(([code]) => ({ code, name: code })),
      regions: Object.entries(r.facets.region ?? {}).map(([code]) => ({ code, name: code })),
    };
  }

  async index({ documents, locale }: { documents: SearchHit[]; locale: Locale }) {
    if (documents.length === 0) return;
    const idx = await this.ensureIndex(locale);
    await idx.addDocuments(documents, { primaryKey: "id" });
  }

  async remove({ ids, locale }: { ids: string[]; locale: Locale }) {
    if (ids.length === 0) return;
    const idx = await this.ensureIndex(locale);
    await idx.deleteDocuments(ids);
  }

  async reindexAll({ documents }: { documents: Record<Locale, SearchHit[]> }) {
    for (const locale of Object.keys(documents) as Locale[]) {
      const idx = await this.ensureIndex(locale);
      await idx.deleteAllDocuments();
      const docs = documents[locale];
      if (docs.length > 0) await idx.addDocuments(docs, { primaryKey: "id" });
    }
  }

  async isHealthy() {
    try {
      const h = await this.client.health();
      return h.status === "available";
    } catch (err) {
      logger.debug({ err }, "meilisearch health check failed");
      return false;
    }
  }
}
