import type { Locale } from "~/lib/i18n/config";
import { turkishNormalize } from "~/lib/utils";
import type {
  ModerationFlag,
  ModerationInput,
  ModerationProvider,
  ModerationVerdict,
} from "./types";
import { PII_PATTERNS, PROFANITY_EN, PROFANITY_TR } from "./wordlists";

const wordlists: Partial<Record<Locale, string[]>> = {
  tr: PROFANITY_TR,
  en: PROFANITY_EN,
};

export class LocalModerationProvider implements ModerationProvider {
  async classify({ text, locale, context }: ModerationInput): Promise<ModerationVerdict> {
    const flags = new Set<ModerationFlag>();
    const reasons: string[] = [];
    const normalized = turkishNormalize(text);

    // Profanity
    const list = [...(wordlists[locale] ?? []), ...PROFANITY_EN];
    for (const w of list) {
      if (new RegExp(`\\b${w}\\b`, "i").test(normalized)) {
        flags.add("PROFANITY");
        reasons.push(`profanity:${w}`);
        break;
      }
    }

    // Spam: too many URLs
    const urlMatches = text.match(/https?:\/\/\S+/g) ?? [];
    if (urlMatches.length >= 2) {
      flags.add("SPAM");
      reasons.push("spam:multiple_urls");
    }

    // Spam: too short
    if (text.trim().length < 20) {
      flags.add("SPAM");
      reasons.push("spam:too_short");
    }

    // Spam: account too young
    if (context?.accountAgeMs !== undefined && context.accountAgeMs < 60 * 60 * 1000) {
      flags.add("SPAM");
      reasons.push("spam:account_age_under_1h");
    }

    // PII
    for (const p of PII_PATTERNS) {
      if (p.test(text)) {
        flags.add("PII");
        reasons.push("pii_detected");
        break;
      }
    }

    return {
      isClean: flags.size === 0,
      flags: [...flags],
      reasons,
    };
  }
}
