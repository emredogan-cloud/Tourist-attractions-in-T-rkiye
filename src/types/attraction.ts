import type { Locale } from "~/lib/i18n/config";

export type AttractionListItem = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  category: { code: string; name: string };
  region: { code: string; name: string };
  province: { slug: string; name: string };
  district: string | null;
  latitude: number;
  longitude: number;
  unescoStatus: string | null;
  averageRating: number;
  reviewCount: number;
  isFreeEntry: boolean;
  popularityScore: number;
  heroImage: AttractionMedia | null;
  distanceMeters?: number;
};

export type AttractionDetail = AttractionListItem & {
  description: string;
  history: string | null;
  tips: string | null;
  elevationM: number | null;
  media: AttractionMedia[];
  operatingHours: AttractionHours[];
  pricing: AttractionPrice[];
  accessibility: AccessibilityFlags | null;
  related: AttractionListItem[];
};

export type AttractionMedia = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  alt: string;
  photographer: string | null;
  license: string;
  attribution: string | null;
  isHero: boolean;
};

export type AttractionHours = {
  season: "ALL_YEAR" | "SUMMER" | "WINTER";
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  notes: string | null;
};

export type AttractionPrice = {
  audience: string;
  priceTry: number;
  isFree: boolean;
  validFrom: string | null;
  validTo: string | null;
};

export type AccessibilityFlags = {
  wheelchair?: boolean;
  audioGuide?: boolean;
  braille?: boolean;
  signLanguage?: boolean;
  lowStimulation?: boolean;
  serviceAnimal?: boolean;
};

export type ListAttractionsQuery = {
  locale: Locale;
  category?: string;
  region?: string;
  province?: string;
  q?: string;
  bbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number };
  near?: { lat: number; lng: number; radiusM: number };
  isUnesco?: boolean;
  isFreeEntry?: boolean;
  sort?: "popular" | "rating_desc" | "rating_asc" | "newest";
  limit?: number;
  cursor?: string;
};

export type ListAttractionsResult = {
  items: AttractionListItem[];
  nextCursor: string | null;
  total: number;
};

export type MapMarker = {
  id: string;
  slug: string;
  lat: number;
  lng: number;
  category: string;
  name: string;
  averageRating: number;
};
