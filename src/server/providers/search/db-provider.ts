import type { Locale } from "~/lib/i18n/config";
import { turkishNormalize } from "~/lib/utils";
import { prisma } from "~/server/db/client";
import type { SearchHit, SearchProvider, SearchResult, SearchSuggestion } from "./types";

const SYNONYMS_TO_BASE: Record<string, string> = {
  ayasofya: "hagia sophia",
  "hagia sophia": "ayasofya",
  kapadokya: "cappadocia",
  cappadocia: "kapadokya",
  pamukkale: "cotton castle",
  "cotton castle": "pamukkale",
  efes: "ephesus",
  ephesus: "efes",
  "topkapi sarayi": "topkapı sarayı",
};

function expandQuery(q: string): string[] {
  const lower = turkishNormalize(q);
  const variants = new Set<string>([q, lower]);
  if (SYNONYMS_TO_BASE[lower]) variants.add(SYNONYMS_TO_BASE[lower]);
  return [...variants];
}

function score(text: string, q: string): number {
  const t = turkishNormalize(text);
  const lower = turkishNormalize(q);
  if (!t.includes(lower)) return 0;
  if (t === lower) return 100;
  if (t.startsWith(lower)) return 80;
  return 50;
}

// Damerau-Levenshtein distance for typo tolerance.
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const m = a.length;
  const n = b.length;
  const prev = new Array(n + 1).fill(0);
  const curr = new Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function maxTypos(len: number): number {
  if (len < 5) return 0;
  if (len < 9) return 1;
  return 2;
}

// Returns true if query word appears (or fuzzy-matches) anywhere in haystack.
function fuzzyContains(haystack: string, queryWord: string): boolean {
  if (queryWord.length < 3) return haystack.includes(queryWord);
  if (haystack.includes(queryWord)) return true;
  const allowed = maxTypos(queryWord.length);
  if (allowed === 0) return false;
  // Slide window of length ~queryWord.length over haystack words and compare.
  for (const word of haystack.split(/[^a-z0-9]+/)) {
    if (word.length === 0) continue;
    if (Math.abs(word.length - queryWord.length) > allowed) continue;
    if (editDistance(word, queryWord) <= allowed) return true;
  }
  return false;
}

export class DbSearchProvider implements SearchProvider {
  async search(args: {
    q: string;
    locale: Locale;
    filters?: {
      category?: string;
      region?: string;
      province?: string;
      isUnesco?: boolean;
      isFreeEntry?: boolean;
    };
    limit?: number;
    offset?: number;
  }): Promise<SearchResult> {
    const start = Date.now();
    const variants = expandQuery(args.q);
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    const offset = Math.max(args.offset ?? 0, 0);

    // SQLite cannot do accent-insensitive search natively. We fetch all locale-matching rows
    // and filter+rank in-memory using `turkishNormalize`. With Postgres + GIN trigrams this would
    // become a server-side query.
    const all = await prisma.attractionTranslation.findMany({
      where: { locale: args.locale, attraction: { status: "PUBLISHED" } },
      include: {
        attraction: {
          include: {
            category: true,
            province: true,
            region: true,
            media: { where: { isHero: true }, take: 1 },
          },
        },
      },
      take: 5000,
    });
    const normalizedVariants = variants.map((v) => turkishNormalize(v));
    let matches = all.filter((m) => {
      const haystack = `${turkishNormalize(m.name)}\n${turkishNormalize(m.summary)}\n${turkishNormalize(m.description)}`;
      return normalizedVariants.some((v) => haystack.includes(v));
    });

    // Typo tolerance fallback: if no strict matches, retry per-word with edit-distance.
    if (matches.length === 0) {
      const queryWords = normalizedVariants
        .flatMap((v) => v.split(/[^a-z0-9]+/))
        .filter((w) => w.length >= 3);
      matches = all.filter((m) => {
        const haystack = `${turkishNormalize(m.name)}\n${turkishNormalize(m.summary)}\n${turkishNormalize(m.description)}`;
        return queryWords.some((w) => fuzzyContains(haystack, w));
      });
    }

    const filtered = matches.filter((m) => {
      const a = m.attraction;
      if (args.filters?.category && a.category.code !== args.filters.category.toUpperCase())
        return false;
      if (args.filters?.region && a.region.code !== args.filters.region.toUpperCase()) return false;
      if (args.filters?.province && a.province.slug !== args.filters.province) return false;
      if (args.filters?.isUnesco !== undefined) {
        if (args.filters.isUnesco && !a.unescoStatus) return false;
        if (!args.filters.isUnesco && a.unescoStatus) return false;
      }
      if (args.filters?.isFreeEntry !== undefined && a.isFreeEntry !== args.filters.isFreeEntry)
        return false;
      return true;
    });

    const ranked = filtered
      .map((m) => {
        const a = m.attraction;
        const s = Math.max(
          score(m.name, args.q) * 1.5,
          score(m.summary, args.q),
          score(m.description, args.q) * 0.5,
        );
        const adjusted = s + a.popularityScore * 2 + a.averageRating;
        const hero = a.media[0];
        const hit: SearchHit = {
          id: a.id,
          slug: m.slug,
          name: m.name,
          summary: m.summary,
          category: a.category.code,
          province: args.locale === "en" ? a.province.nameEn : a.province.nameTr,
          region: args.locale === "en" ? a.region.nameEn : a.region.nameTr,
          averageRating: a.averageRating,
          reviewCount: a.reviewCount,
          isFreeEntry: a.isFreeEntry,
          isUnesco: a.unescoStatus !== null,
          popularityScore: a.popularityScore,
          heroImageUrl: hero?.url ?? null,
        };
        return { hit, score: adjusted };
      })
      .sort((a, b) => b.score - a.score);

    const facets: Record<string, Record<string, number>> = {
      category: {},
      region: {},
      province: {},
    };
    const cat = facets.category;
    const reg = facets.region;
    const prov = facets.province;
    if (cat && reg && prov) {
      for (const { hit } of ranked) {
        cat[hit.category] = (cat[hit.category] ?? 0) + 1;
        reg[hit.region] = (reg[hit.region] ?? 0) + 1;
        prov[hit.province] = (prov[hit.province] ?? 0) + 1;
      }
    }

    const hits = ranked.slice(offset, offset + limit).map(({ hit }) => hit);
    return {
      hits,
      total: ranked.length,
      facets,
      processingMs: Date.now() - start,
      query: args.q,
    };
  }

  async suggest(args: { q: string; locale: Locale; limit?: number }): Promise<SearchSuggestion> {
    const limit = Math.min(args.limit ?? 5, 10);
    if (args.q.trim().length < 2) {
      return { attractions: [], categories: [], regions: [] };
    }
    const result = await this.search({ q: args.q, locale: args.locale, limit, offset: 0 });
    return {
      attractions: result.hits,
      categories: Object.entries(result.facets.category ?? {}).map(([code]) => ({
        code,
        name: code,
      })),
      regions: Object.entries(result.facets.region ?? {}).map(([name]) => ({ code: name, name })),
    };
  }

  // The DB provider is implicit (data lives in Postgres). index/remove/reindex are no-ops.
  async index() {
    /* noop */
  }

  async remove() {
    /* noop */
  }

  async reindexAll() {
    /* noop */
  }

  async isHealthy() {
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }
}
