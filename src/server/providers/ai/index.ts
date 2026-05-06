import { getConfig } from "~/lib/config";
import { logger } from "~/lib/logger";
import { MockAIProvider } from "./mock-provider";
import type { AIProvider } from "./types";

export type {
  AIProvider,
  ConciergeChunk,
  ConciergeMessage,
  ConciergeRequest,
  ItineraryDraft,
} from "./types";

let cached: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const config = getConfig();
  if (config.AI_PROVIDER === "anthropic" && config.ANTHROPIC_API_KEY) {
    try {
      // Lazy require keeps Anthropic SDK out of cold-start when not used.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AnthropicAIProvider } = require("./anthropic-provider");
      const provider: AIProvider = new AnthropicAIProvider();
      cached = provider;
      logger.info({ model: config.ANTHROPIC_MODEL_DEFAULT }, "AI: using Anthropic Claude");
      return provider;
    } catch (err) {
      logger.warn({ err }, "AI: Anthropic init failed — falling back to mock");
    }
  }
  cached = new MockAIProvider();
  return cached;
}
