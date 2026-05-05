import type { Locale } from "~/lib/i18n/config";

export type ConciergeMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: { slug: string; name: string }[];
};

export type ConciergeRequest = {
  messages: ConciergeMessage[];
  locale: Locale;
  sessionId: string;
  userId?: string;
  isPremium: boolean;
};

export type ConciergeChunk =
  | { type: "text"; delta: string }
  | { type: "citation"; slug: string; name: string }
  | { type: "itinerary"; itinerary: ItineraryDraft }
  | { type: "tool_use"; tool: string }
  | { type: "tokens"; input: number; output: number }
  | { type: "done" }
  | { type: "error"; message: string };

export type ItineraryDraft = {
  title: string;
  description?: string;
  days: { dayNumber: number; stopSlugs: string[] }[];
};

export interface AIProvider {
  readonly name: string;
  stream(req: ConciergeRequest): AsyncGenerator<ConciergeChunk, void, unknown>;
}
