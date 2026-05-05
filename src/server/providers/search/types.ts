import type { Locale } from "~/lib/i18n/config";

export type SearchHit = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  category: string;
  province: string;
  region: string;
  averageRating: number;
  reviewCount: number;
  isFreeEntry: boolean;
  isUnesco: boolean;
  popularityScore: number;
  heroImageUrl: string | null;
  highlights?: { name?: string; summary?: string };
};

export type SearchFilters = {
  category?: string;
  region?: string;
  province?: string;
  isUnesco?: boolean;
  isFreeEntry?: boolean;
};

export type SearchResult = {
  hits: SearchHit[];
  total: number;
  facets: Record<string, Record<string, number>>;
  processingMs: number;
  query: string;
  suggestion?: string;
};

export type SearchSuggestion = {
  attractions: SearchHit[];
  categories: { code: string; name: string }[];
  regions: { code: string; name: string }[];
};

export interface SearchProvider {
  search(args: {
    q: string;
    locale: Locale;
    filters?: SearchFilters;
    limit?: number;
    offset?: number;
  }): Promise<SearchResult>;

  suggest(args: { q: string; locale: Locale; limit?: number }): Promise<SearchSuggestion>;

  index(args: { documents: SearchHit[]; locale: Locale }): Promise<void>;

  remove(args: { ids: string[]; locale: Locale }): Promise<void>;

  reindexAll(args: { documents: Record<Locale, SearchHit[]> }): Promise<void>;

  isHealthy(): Promise<boolean>;
}
