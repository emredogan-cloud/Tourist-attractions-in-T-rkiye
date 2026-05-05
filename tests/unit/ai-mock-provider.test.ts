import { afterAll, describe, expect, it } from "vitest";
import { MockAIProvider } from "~/server/providers/ai/mock-provider";
import { prisma } from "~/server/db/client";

afterAll(async () => {
  await prisma.$disconnect();
});

const provider = new MockAIProvider();

async function collect(req: Parameters<typeof provider.stream>[0]) {
  const out: { text: string; citations: string[]; itinerary?: unknown; tokens?: { input: number; output: number } } = {
    text: "",
    citations: [],
  };
  for await (const c of provider.stream(req)) {
    if (c.type === "text") out.text += c.delta;
    if (c.type === "citation") out.citations.push(c.slug);
    if (c.type === "itinerary") out.itinerary = c.itinerary;
    if (c.type === "tokens") out.tokens = { input: c.input, output: c.output };
  }
  return out;
}

describe("MockAIProvider", () => {
  it("info-style query streams text + citations", async () => {
    const r = await collect({
      messages: [{ role: "user", content: "Tell me about historical sites in Istanbul" }],
      locale: "en",
      sessionId: "test1",
      isPremium: false,
    });
    expect(r.text.length).toBeGreaterThan(20);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("itinerary-style query produces a draft with day count", async () => {
    const r = await collect({
      messages: [{ role: "user", content: "Plan a 3-day Cappadocia trip" }],
      locale: "en",
      sessionId: "test2",
      isPremium: false,
    });
    expect(r.itinerary).toBeDefined();
    const it = r.itinerary as { days: unknown[] };
    expect(it.days.length).toBe(3);
  });

  it("Turkish locale yields Turkish text", async () => {
    const r = await collect({
      messages: [{ role: "user", content: "Kapadokya'da 2 gün ne yapabilirim?" }],
      locale: "tr",
      sessionId: "test3",
      isPremium: false,
    });
    expect(r.text).toMatch(/Gün|harika|plan|öner/i);
  });
});
