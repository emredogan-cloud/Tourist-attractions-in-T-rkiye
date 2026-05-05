import { LocalModerationProvider } from "./local-provider";
import type { ModerationProvider } from "./types";

export type { ModerationFlag, ModerationProvider, ModerationVerdict } from "./types";

let cached: ModerationProvider | undefined;

export function getModerationProvider(): ModerationProvider {
  if (cached) return cached;
  // Stage 1 always runs (local rules). When OPENAI_API_KEY is set, an OpenAI
  // chained provider would augment this — kept here as the first cut.
  cached = new LocalModerationProvider();
  return cached;
}
