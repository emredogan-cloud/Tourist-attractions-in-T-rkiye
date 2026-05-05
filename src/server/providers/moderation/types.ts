import type { Locale } from "~/lib/i18n/config";

export type ModerationFlag =
  | "PROFANITY"
  | "SPAM"
  | "HATE"
  | "HARASSMENT"
  | "SEXUAL"
  | "VIOLENCE"
  | "PII";

export type ModerationVerdict = {
  isClean: boolean;
  flags: ModerationFlag[];
  reasons: string[];
  scores?: Record<string, number>;
};

export type ModerationInput = {
  text: string;
  locale: Locale;
  context?: { authorId?: string; accountAgeMs?: number };
};

export interface ModerationProvider {
  classify(input: ModerationInput): Promise<ModerationVerdict>;
}
