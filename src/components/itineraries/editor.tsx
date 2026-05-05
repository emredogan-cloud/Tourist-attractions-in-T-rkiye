"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { Locale } from "~/lib/i18n/config";

type Stop = {
  id: string;
  sortOrder: number;
  attractionId: string;
  attraction: { id: string; latitude: number; longitude: number; translations: { locale: string; name: string; slug: string }[] };
  plannedDurationMin: number | null;
};
type Day = { id: string; dayNumber: number; date: Date | null; stops: Stop[]; notes: string | null };
type Itinerary = { id: string; title: string; description: string | null; isPublic: boolean; shareToken: string; days: Day[] };

export function ItineraryEditor({
  itinerary,
  locale,
  t,
}: {
  itinerary: Itinerary;
  locale: Locale;
  t: { day: string; addStop: string; removeStop: string; optimize: string; share: string; clone: string; exportPdf: string };
}) {
  const [data, setData] = useState(itinerary);

  async function refresh() {
    const r = await fetch(`/api/v1/itineraries/${itinerary.id}`);
    if (!r.ok) return;
    const j = (await r.json()) as { itinerary: Itinerary };
    setData(j.itinerary);
  }

  async function addDay() {
    await fetch(`/api/v1/itineraries/${data.id}/days`, { method: "POST" });
    await refresh();
  }
  async function deleteDay(dayId: string) {
    if (!confirm("Delete day?")) return;
    await fetch(`/api/v1/itinerary-days/${dayId}`, { method: "DELETE" });
    await refresh();
  }
  async function deleteStop(stopId: string) {
    await fetch(`/api/v1/itinerary-stops/${stopId}`, { method: "DELETE" });
    await refresh();
  }
  async function optimize(dayId: string) {
    await fetch(`/api/v1/itinerary-days/${dayId}/optimize`, { method: "POST" });
    await refresh();
  }
  async function moveStop(dayId: string, stopId: string, direction: -1 | 1) {
    const day = data.days.find((d) => d.id === dayId);
    if (!day) return;
    const ids = day.stops.map((s) => s.id);
    const idx = ids.indexOf(stopId);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target]!, ids[idx]!];
    await fetch(`/api/v1/itinerary-days/${dayId}/stops`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stopIds: ids }),
    });
    await refresh();
  }
  async function togglePublic() {
    await fetch(`/api/v1/itineraries/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !data.isPublic }),
    });
    await refresh();
  }
  async function clone() {
    const r = await fetch(`/api/v1/itineraries/${data.id}/clone`, { method: "POST" });
    if (!r.ok) return;
    const j = (await r.json()) as { itinerary: { id: string } };
    window.location.href = `/${locale}/itineraries/${j.itinerary.id}`;
  }
  async function copyShareLink() {
    const url = `${window.location.origin}/${locale}/share/${data.shareToken}`;
    await navigator.clipboard.writeText(url);
    alert(`Share link copied: ${url}`);
  }

  function nameOf(stop: Stop) {
    return (
      stop.attraction.translations.find((t) => t.locale === locale)?.name ??
      stop.attraction.translations[0]?.name ??
      stop.attraction.id
    );
  }
  function slugOf(stop: Stop) {
    return (
      stop.attraction.translations.find((t) => t.locale === locale)?.slug ??
      stop.attraction.translations[0]?.slug ??
      stop.attraction.id
    );
  }

  return (
    <div className="container py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{data.title}</h1>
          {data.description && <p className="mt-1 text-muted-foreground">{data.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={togglePublic}>
            {data.isPublic ? "Public ✓" : "Make public"}
          </Button>
          <Button variant="outline" onClick={copyShareLink}>{t.share}</Button>
          <Button variant="outline" onClick={clone}>{t.clone}</Button>
          <a
            href={`/${locale}/itineraries/${data.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary"
          >
            {t.exportPdf}
          </a>
        </div>
      </header>

      <div className="mt-8 space-y-6">
        {data.days.map((day) => (
          <section key={day.id} className="rounded-xl border border-border bg-card p-5">
            <header className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                {t.day.replace("{n}", String(day.dayNumber))}
              </h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => optimize(day.id)} disabled={day.stops.length < 3}>
                  {t.optimize}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteDay(day.id)}>
                  ✕
                </Button>
              </div>
            </header>
            <ol className="mt-3 space-y-2">
              {day.stops.length === 0 ? (
                <li className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No stops yet. Use "Add to itinerary" on an attraction page.
                </li>
              ) : (
                day.stops.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
                  >
                    <span className="grid h-7 w-7 place-content-center rounded-full bg-primary text-primary-foreground text-xs">
                      {i + 1}
                    </span>
                    <a
                      href={`/${locale}/attractions/${slugOf(s)}`}
                      className="flex-1 font-medium hover:text-primary"
                    >
                      {nameOf(s)}
                    </a>
                    <Button size="sm" variant="ghost" aria-label="Move up" onClick={() => moveStop(day.id, s.id, -1)} disabled={i === 0}>
                      ↑
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="Move down" onClick={() => moveStop(day.id, s.id, 1)} disabled={i === day.stops.length - 1}>
                      ↓
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={t.removeStop} onClick={() => deleteStop(s.id)}>
                      ✕
                    </Button>
                  </li>
                ))
              )}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={addDay} variant="outline">
          + Day
        </Button>
      </div>
    </div>
  );
}
