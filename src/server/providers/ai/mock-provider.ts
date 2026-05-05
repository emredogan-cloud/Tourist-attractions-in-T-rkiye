import type { Prisma } from "@prisma/client";
import { prisma } from "~/server/db/client";
import { turkishNormalize } from "~/lib/utils";
import type { Locale } from "~/lib/i18n/config";
import type { AIProvider, ConciergeChunk, ConciergeRequest, ItineraryDraft } from "./types";

// A deterministic mock concierge: parses simple natural-language patterns,
// retrieves real attractions from the DB, and streams a response that mirrors
// the structure of the Anthropic provider (text deltas + citations + optional
// itinerary block + done). Useful for offline demos and tests.

function detectIntent(text: string, locale: Locale): {
  kind: "itinerary" | "info" | "explore";
  days: number;
  city: string | null;
  themes: string[];
} {
  const norm = turkishNormalize(text);
  const dayMatches = norm.match(/(\d+)[\s-]*(g[uü]n|day|days)/i);
  const days = dayMatches ? Math.min(Math.max(Number(dayMatches[1] ?? 3), 1), 14) : 0;
  const city = ["istanbul", "kapadokya", "cappadocia", "izmir", "antalya", "ankara", "trabzon", "denizli", "sanliurfa", "adiyaman"]
    .find((c) => norm.includes(c)) ?? null;
  const themes: string[] = [];
  for (const theme of ["history", "tarih", "doga", "nature", "yemek", "food", "kultur", "culture", "macera", "adventure"]) {
    if (norm.includes(theme)) themes.push(theme);
  }
  let kind: "itinerary" | "info" | "explore" = "info";
  if (days >= 1) kind = "itinerary";
  else if (city) kind = "explore";
  return { kind, days, city, themes };
}

async function retrieveAttractions(args: {
  city: string | null;
  themes: string[];
  locale: Locale;
  limit: number;
}) {
  const themeMap: Record<string, "HISTORICAL" | "NATURAL" | "CULTURAL" | "FOOD_DRINK" | "ADVENTURE"> = {
    history: "HISTORICAL",
    tarih: "HISTORICAL",
    nature: "NATURAL",
    doga: "NATURAL",
    culture: "CULTURAL",
    kultur: "CULTURAL",
    food: "FOOD_DRINK",
    yemek: "FOOD_DRINK",
    adventure: "ADVENTURE",
    macera: "ADVENTURE",
  };
  const codes = args.themes
    .map((t) => themeMap[t])
    .filter((v): v is "HISTORICAL" | "NATURAL" | "CULTURAL" | "FOOD_DRINK" | "ADVENTURE" => !!v);

  const filters: Prisma.AttractionWhereInput = { status: "PUBLISHED" };
  if (args.city) {
    filters.OR = [
      { province: { slug: { contains: args.city } } },
      { translations: { some: { name: { contains: args.city } } } },
    ];
  }
  if (codes.length > 0) {
    filters.category = { code: { in: codes } };
  }

  return prisma.attraction.findMany({
    where: filters,
    include: {
      translations: { where: { locale: args.locale } },
      province: true,
      category: true,
    },
    orderBy: [{ popularityScore: "desc" }],
    take: args.limit,
  });
}

function localized(s: { tr: string; en: string }, locale: Locale): string {
  return locale === "en" ? s.en : s.tr;
}

async function* generateItineraryResponse(req: ConciergeRequest): AsyncGenerator<ConciergeChunk, void, unknown> {
  const last = req.messages[req.messages.length - 1];
  const text = last?.content ?? "";
  const intent = detectIntent(text, req.locale);
  const days = Math.max(intent.days, 3);
  const cityAttrs = await retrieveAttractions({
    city: intent.city,
    themes: intent.themes,
    locale: req.locale,
    limit: days * 3,
  });
  const allAttrs = [...cityAttrs];
  // If filter narrowed too aggressively, top up with broadly popular attractions
  // so we always have enough material to fill the requested days.
  if (allAttrs.length < days * 2) {
    const seenIds = new Set(allAttrs.map((a) => a.id));
    const more = await retrieveAttractions({
      city: null,
      themes: intent.themes,
      locale: req.locale,
      limit: days * 3,
    });
    for (const m of more) {
      if (!seenIds.has(m.id)) allAttrs.push(m);
      if (allAttrs.length >= days * 3) break;
    }
  }

  const intro = localized(
    {
      tr: `Harika! ${days} günlük bir plan hazırlayayım${intent.city ? ` ${intent.city.charAt(0).toUpperCase() + intent.city.slice(1)} merkezli` : ""}. İşte önerilerim:\n\n`,
      en: `Great — I'll draft a ${days}-day plan${intent.city ? ` centered on ${intent.city.charAt(0).toUpperCase() + intent.city.slice(1)}` : ""}. Here's what I recommend:\n\n`,
    },
    req.locale,
  );
  for (const word of intro.split(/(\s+)/)) {
    yield { type: "text", delta: word };
    await new Promise((r) => setTimeout(r, 12));
  }

  const draft: ItineraryDraft = {
    title:
      req.locale === "en"
        ? `${days}-day ${intent.city ? intent.city.charAt(0).toUpperCase() + intent.city.slice(1) : "Türkiye"} trip`
        : `${days} günlük ${intent.city ? intent.city.charAt(0).toUpperCase() + intent.city.slice(1) : "Türkiye"} turu`,
    days: [],
  };

  for (let d = 1; d <= days; d++) {
    const subset = allAttrs.slice((d - 1) * 3, d * 3);
    if (subset.length === 0) break;
    const dayLine = localized({ tr: `**${d}. Gün:** `, en: `**Day ${d}:** ` }, req.locale);
    yield { type: "text", delta: dayLine };
    const stopSlugs: string[] = [];
    for (const a of subset) {
      const tr = a.translations[0];
      if (!tr) continue;
      yield { type: "text", delta: tr.name };
      yield { type: "citation", slug: tr.slug, name: tr.name };
      yield { type: "text", delta: ", " };
      stopSlugs.push(tr.slug);
    }
    yield { type: "text", delta: "\n" };
    draft.days.push({ dayNumber: d, stopSlugs });
  }

  yield { type: "text", delta: "\n" };
  yield {
    type: "text",
    delta: localized(
      {
        tr: "İsterseniz bunu rotanıza kaydedebilirim — \"Rota olarak kaydet\" butonuna tıklayın.",
        en: "Want me to save this to your itineraries? Click \"Save as itinerary\" below.",
      },
      req.locale,
    ),
  };

  yield { type: "itinerary", itinerary: draft };
  yield { type: "tokens", input: text.length / 4, output: 250 };
  yield { type: "done" };
}

async function* generateInfoResponse(req: ConciergeRequest): AsyncGenerator<ConciergeChunk, void, unknown> {
  const last = req.messages[req.messages.length - 1];
  const text = last?.content ?? "";
  const intent = detectIntent(text, req.locale);
  const attrs = await retrieveAttractions({
    city: intent.city,
    themes: intent.themes,
    locale: req.locale,
    limit: 5,
  });

  const intro = attrs.length > 0
    ? localized(
        {
          tr: `İşte size özetleyebileceğim birkaç gezi yeri:\n\n`,
          en: `Here are a few attractions I can highlight:\n\n`,
        },
        req.locale,
      )
    : localized(
        {
          tr: `Sorunuza biraz daha somut yanıt vermek için şehir, tarih veya ilgi alanı belirtirseniz yardımcı olurum.`,
          en: `If you share a city, date, or interest area, I can be more specific.`,
        },
        req.locale,
      );

  for (const word of intro.split(/(\s+)/)) {
    yield { type: "text", delta: word };
    await new Promise((r) => setTimeout(r, 8));
  }
  for (const a of attrs) {
    const tr = a.translations[0];
    if (!tr) continue;
    yield { type: "text", delta: `- **${tr.name}** — ${tr.summary}\n` };
    yield { type: "citation", slug: tr.slug, name: tr.name };
  }
  yield { type: "tokens", input: text.length / 4, output: 200 };
  yield { type: "done" };
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async *stream(req: ConciergeRequest): AsyncGenerator<ConciergeChunk, void, unknown> {
    const last = req.messages[req.messages.length - 1]?.content ?? "";
    const intent = detectIntent(last, req.locale);
    if (intent.kind === "itinerary") {
      yield* generateItineraryResponse(req);
    } else {
      yield* generateInfoResponse(req);
    }
  }
}
