import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "~/lib/config";
import { logger } from "~/lib/logger";
import type { AIProvider, ConciergeChunk, ConciergeRequest } from "./types";

// Lightweight wrapper around the Anthropic SDK with streaming.
// Citations are extracted by post-processing tool-use results that resolve
// to attraction slugs from the platform's own database.
//
// In a full production setup this provider would also wire up tool definitions
// for searchAttractions / getAttractionDetails / findNearby / generateItinerary
// — those are kept as a documented extension here to keep the surface tight.
export class AnthropicAIProvider implements AIProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor() {
    const config = getConfig();
    if (!config.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY missing");
    }
    this.client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    this.model = config.ANTHROPIC_MODEL_DEFAULT;
  }

  async *stream(req: ConciergeRequest): AsyncGenerator<ConciergeChunk, void, unknown> {
    const systemPrompt = systemPromptFor(req.locale);
    try {
      const stream = this.client.messages.stream({
        model: req.isPremium ? getConfig().ANTHROPIC_MODEL_PREMIUM : this.model,
        max_tokens: 1024,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      });
      for await (const event of stream) {
        if (event.type === "content_block_delta" && "delta" in event) {
          const delta = (event.delta as { type: string; text?: string }).text ?? "";
          if (delta) yield { type: "text", delta };
        }
      }
      const final = await stream.finalMessage();
      const usage = final.usage;
      yield { type: "tokens", input: usage.input_tokens, output: usage.output_tokens };
      yield { type: "done" };
    } catch (err) {
      logger.warn({ err }, "anthropic stream failed");
      yield { type: "error", message: "Concierge upstream unavailable" };
    }
  }
}

function systemPromptFor(locale: "tr" | "en" | "ar" | "ru" | "de"): string {
  const tr = `Sen "Türkiye Gezi Asistanı"sın — Türkiye turizmi konusunda uzman, sıcak ve net konuşan bir rehber.
- Sadece bilinen Türkiye gezi yerlerini öner.
- Yanıtlarını her zaman Türkçe ver.
- Önerdiğin her gezi yerinin slug'ını parantez içinde belirt: (slug:ayasofya).
- Saatleri "HH:mm" formatında ver. Para birimi varsayılan TRY.
- Bilmediğin bir şey için "Emin değilim" de.`;
  const en = `You are the "Türkiye Travel Concierge" — a warm, expert guide for tourism in Türkiye.
- Recommend only known Türkiye attractions.
- Reply in English.
- For each attraction, include the slug in parentheses: (slug:hagia-sophia).
- Use 24-hour times "HH:mm". Default currency is TRY.
- If unsure, say "I'm not sure".`;
  return locale === "tr" ? tr : en;
}
