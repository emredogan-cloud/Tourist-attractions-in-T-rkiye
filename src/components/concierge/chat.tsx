"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import type { Locale } from "~/lib/i18n/config";

type Msg = { role: "user" | "assistant"; content: string; citations?: { slug: string; name: string }[] };

export function ConciergeChat({ locale }: { locale: Locale }) {
  const t = useTranslations("concierge");
  const [sessionId] = useState(() => `s_${Math.random().toString(36).slice(2)}`);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [draftItin, setDraftItin] = useState<{ title: string; days: { dayNumber: number; stopSlugs: string[] }[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputId = useId();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(prompt: string) {
    if (!prompt.trim() || streaming) return;
    const newMsgs: Msg[] = [...messages, { role: "user", content: prompt }];
    setMessages([...newMsgs, { role: "assistant", content: "", citations: [] }]);
    setInput("");
    setStreaming(true);
    setSavedNotice(null);
    setDraftItin(null);
    try {
      const resp = await fetch("/api/v1/concierge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, sessionId, locale }),
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: (err as { title?: string }).title ?? "Error",
            citations: [],
          };
          return copy;
        });
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const cites: { slug: string; name: string }[] = [];
      let textBuffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const evt of events) {
          if (!evt.startsWith("data: ")) continue;
          const json = evt.slice(6).trim();
          if (!json) continue;
          try {
            const parsed = JSON.parse(json) as
              | { type: "text"; delta: string }
              | { type: "citation"; slug: string; name: string }
              | { type: "itinerary"; itinerary: { title: string; days: { dayNumber: number; stopSlugs: string[] }[] } }
              | { type: "tokens"; input: number; output: number }
              | { type: "done" }
              | { type: "end" }
              | { type: "error"; message: string };
            if (parsed.type === "text") {
              textBuffer += parsed.delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: textBuffer, citations: cites };
                return copy;
              });
            } else if (parsed.type === "citation") {
              cites.push({ slug: parsed.slug, name: parsed.name });
            } else if (parsed.type === "itinerary") {
              setDraftItin(parsed.itinerary);
            } else if (parsed.type === "error") {
              textBuffer = parsed.message;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: textBuffer, citations: [] };
                return copy;
              });
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  async function saveAsItinerary() {
    if (!draftItin) return;
    const create = await fetch("/api/v1/itineraries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draftItin.title }),
    });
    if (!create.ok) {
      // Likely unauthenticated — redirect to sign-in
      if (create.status === 401) {
        window.location.href = `/${locale}/sign-in`;
        return;
      }
      setSavedNotice("Save failed");
      return;
    }
    const j = (await create.json()) as { itinerary: { id: string; days: { id: string }[] } };
    let dayId = j.itinerary.days[0]?.id;
    for (const d of draftItin.days) {
      if (d.dayNumber > 1) {
        const dayResp = await fetch(`/api/v1/itineraries/${j.itinerary.id}/days`, { method: "POST" });
        const dj = (await dayResp.json()) as { day: { id: string } };
        dayId = dj.day.id;
      }
      if (!dayId) continue;
      for (const slug of d.stopSlugs) {
        const att = await fetch(`/api/v1/attractions/${slug}`);
        if (!att.ok) continue;
        const a = (await att.json()) as { id: string };
        await fetch(`/api/v1/itinerary-days/${dayId}/stops`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attractionId: a.id }),
        });
      }
    }
    window.location.href = `/${locale}/itineraries/${j.itinerary.id}`;
  }

  const examples = (() => {
    try {
      // next-intl raw arrays — call returns string but we know it's an array
      return (t.raw("exampleQueries") as string[]) ?? [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="mt-6 space-y-4">
      <div
        ref={scrollRef}
        className="h-[60vh] space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-4"
      >
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => send(ex)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground"
                  : "mr-auto max-w-[90%] rounded-2xl rounded-tl-sm border border-border bg-background px-3 py-2"
              }
            >
              <div
                className="prose prose-sm whitespace-pre-wrap dark:prose-invert"
                style={{ fontFamily: "inherit" }}
              >
                {m.content || (streaming && i === messages.length - 1 ? t("thinking") : "")}
              </div>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Array.from(
                    new Map(m.citations.map((c) => [c.slug, c.name])).entries(),
                  ).map(([slug, name]) => (
                    <a
                      key={slug}
                      href={`/${locale}/attractions/${slug}`}
                      className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs hover:border-primary hover:text-primary"
                    >
                      {name} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {draftItin && !streaming && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-medium">{draftItin.title}</p>
          <p className="text-xs">
            {draftItin.days.length} day{draftItin.days.length === 1 ? "" : "s"} ·{" "}
            {draftItin.days.reduce((s, d) => s + d.stopSlugs.length, 0)} stops
          </p>
          <Button size="sm" className="mt-2" onClick={saveAsItinerary}>
            {t("saveAsItinerary")}
          </Button>
          {savedNotice && <p className="mt-2 text-xs">{savedNotice}</p>}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          disabled={streaming}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2"
          aria-label={t("placeholder")}
        />
        <Button type="submit" disabled={streaming || input.trim().length === 0}>
          {streaming ? "…" : t("send")}
        </Button>
      </form>
    </div>
  );
}
