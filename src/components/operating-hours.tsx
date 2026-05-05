"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "~/lib/utils";
import type { AttractionHours } from "~/types/attraction";

type Season = "ALL_YEAR" | "SUMMER" | "WINTER";

export function OperatingHoursTable({ hours }: { hours: AttractionHours[] }) {
  const t = useTranslations("detail");
  const seasons = Array.from(new Set(hours.map((h) => h.season))) as Season[];
  const [season, setSeason] = useState<Season>(seasons[0] ?? "ALL_YEAR");
  const filtered = hours
    .filter((h) => h.season === season)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const todayDay = new Date().getDay();

  return (
    <div className="space-y-3">
      {seasons.length > 1 && (
        <div
          role="tablist"
          aria-label="Season"
          className="inline-flex rounded-md border border-input"
        >
          {seasons.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={season === s}
              onClick={() => setSeason(s)}
              className={cn(
                "px-3 py-1 text-sm transition-colors first:rounded-l-md last:rounded-r-md",
                season === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-secondary",
              )}
            >
              {t(`season.${s}` as never)}
            </button>
          ))}
        </div>
      )}
      <ul className="overflow-hidden rounded-md border border-border text-sm">
        {filtered.map((h) => (
          <li
            key={`${h.season}-${h.dayOfWeek}`}
            className={cn(
              "flex items-center justify-between border-b border-border px-4 py-2 last:border-0",
              h.dayOfWeek === todayDay && "bg-secondary/40 font-medium",
            )}
          >
            <span>{t(`days.${h.dayOfWeek}` as never)}</span>
            <span className="tabular-nums">
              {h.isClosed
                ? t.has?.("days.0") // dummy guard for type safety
                  ? "—"
                  : "—"
                : `${h.openTime ?? "—"} – ${h.closeTime ?? "—"}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
