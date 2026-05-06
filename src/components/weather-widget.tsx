"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { WeatherSnapshot } from "~/server/providers/weather/types";

const ICON: Record<string, string> = {
  clear: "☀️",
  partly_cloudy: "🌤️",
  cloudy: "☁️",
  rain: "🌧️",
  storm: "⛈️",
  snow: "❄️",
  fog: "🌫️",
  wind: "💨",
  hot: "🔥",
};

export function WeatherWidget({ lat, lng }: { lat: number; lng: number }) {
  const locale = useLocale();
  const t = useTranslations("events");
  const [data, setData] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/weather?lat=${lat}&lng=${lng}&locale=${locale === "en" ? "en" : "tr"}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("weather"))))
      .then((j: { weather: WeatherSnapshot }) => {
        if (!cancelled) setData(j.weather);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lat, lng, locale]);

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {t("weatherToday")}…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("weatherToday")}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl" aria-hidden>
          {ICON[data.iconKey] ?? "✦"}
        </span>
        <span className="text-2xl font-semibold tabular-nums">{Math.round(data.tempC)}°C</span>
        <span className="text-sm text-muted-foreground">
          {data.description} · {Math.round(data.feelsC)}°
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {locale === "en" ? "Humidity" : "Nem"} {data.humidity}% ·{" "}
        {locale === "en" ? "Wind" : "Rüzgâr"} {data.windKph} km/h
      </p>
    </div>
  );
}
