"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { Locale } from "~/lib/i18n/config";

type Prefs = {
  themeInterests: string[];
  preferredRegions: string[];
  budgetTier: "BUDGET" | "MID" | "LUXURY" | null;
  travelStyle: "FAST" | "RELAXED" | "BALANCED" | null;
  groupType: "SOLO" | "COUPLE" | "FAMILY" | "FRIENDS" | null;
};

const THEMES = [
  "HISTORICAL",
  "NATURAL",
  "RELIGIOUS",
  "CULTURAL",
  "BEACH",
  "MUSEUM",
  "ARCHAEOLOGICAL",
  "ADVENTURE",
  "URBAN",
  "FOOD_DRINK",
] as const;
const REGIONS = [
  "MARMARA",
  "AEGEAN",
  "MEDITERRANEAN",
  "BLACK_SEA",
  "CENTRAL_ANATOLIA",
  "EASTERN_ANATOLIA",
  "SOUTHEASTERN_ANATOLIA",
] as const;

const LABELS: Record<string, { tr: string; en: string }> = {
  HISTORICAL: { tr: "Tarihi yerler", en: "Historical sites" },
  NATURAL: { tr: "Doğa", en: "Nature" },
  RELIGIOUS: { tr: "Dini yerler", en: "Religious" },
  CULTURAL: { tr: "Kültür", en: "Culture" },
  BEACH: { tr: "Plaj", en: "Beach" },
  MUSEUM: { tr: "Müze", en: "Museum" },
  ARCHAEOLOGICAL: { tr: "Arkeoloji", en: "Archaeology" },
  ADVENTURE: { tr: "Macera", en: "Adventure" },
  URBAN: { tr: "Şehir", en: "Urban" },
  FOOD_DRINK: { tr: "Yeme içme", en: "Food & drink" },
  MARMARA: { tr: "Marmara", en: "Marmara" },
  AEGEAN: { tr: "Ege", en: "Aegean" },
  MEDITERRANEAN: { tr: "Akdeniz", en: "Mediterranean" },
  BLACK_SEA: { tr: "Karadeniz", en: "Black Sea" },
  CENTRAL_ANATOLIA: { tr: "İç Anadolu", en: "Central Anatolia" },
  EASTERN_ANATOLIA: { tr: "Doğu Anadolu", en: "Eastern Anatolia" },
  SOUTHEASTERN_ANATOLIA: { tr: "Güneydoğu Anadolu", en: "Southeast Anatolia" },
};

function label(key: string, locale: Locale): string {
  const m = LABELS[key];
  return m ? (locale === "en" ? m.en : m.tr) : key;
}

export function PreferencesForm({ initial, locale }: { initial: Prefs | null; locale: Locale }) {
  const [prefs, setPrefs] = useState<Prefs>({
    themeInterests: initial?.themeInterests ?? [],
    preferredRegions: initial?.preferredRegions ?? [],
    budgetTier: initial?.budgetTier ?? null,
    travelStyle: initial?.travelStyle ?? null,
    groupType: initial?.groupType ?? null,
  });
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  function toggle<K extends "themeInterests" | "preferredRegions">(field: K, value: string) {
    setPrefs((p) => {
      const list = p[field];
      return list.includes(value)
        ? { ...p, [field]: list.filter((v) => v !== value) }
        : { ...p, [field]: [...list, value] };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const r = await fetch("/api/v1/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (r.ok) setSuccess(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Section title={locale === "tr" ? "İlgi alanları" : "Interests"}>
        <Pills
          values={[...THEMES]}
          selected={prefs.themeInterests}
          onToggle={(v) => toggle("themeInterests", v)}
          label={(v) => label(v, locale)}
        />
      </Section>
      <Section title={locale === "tr" ? "Tercih ettiğiniz bölgeler" : "Favorite regions"}>
        <Pills
          values={[...REGIONS]}
          selected={prefs.preferredRegions}
          onToggle={(v) => toggle("preferredRegions", v)}
          label={(v) => label(v, locale)}
        />
      </Section>

      <Section title={locale === "tr" ? "Bütçe" : "Budget"}>
        <Single
          values={[
            { v: "BUDGET", l: locale === "tr" ? "Ekonomik" : "Budget" },
            { v: "MID", l: locale === "tr" ? "Orta" : "Mid-range" },
            { v: "LUXURY", l: locale === "tr" ? "Lüks" : "Luxury" },
          ]}
          selected={prefs.budgetTier}
          onSelect={(v) => setPrefs((p) => ({ ...p, budgetTier: v as Prefs["budgetTier"] }))}
        />
      </Section>
      <Section title={locale === "tr" ? "Tarz" : "Style"}>
        <Single
          values={[
            { v: "FAST", l: locale === "tr" ? "Yoğun" : "Fast-paced" },
            { v: "BALANCED", l: locale === "tr" ? "Dengeli" : "Balanced" },
            { v: "RELAXED", l: locale === "tr" ? "Sakin" : "Relaxed" },
          ]}
          selected={prefs.travelStyle}
          onSelect={(v) => setPrefs((p) => ({ ...p, travelStyle: v as Prefs["travelStyle"] }))}
        />
      </Section>
      <Section title={locale === "tr" ? "Grup" : "Group"}>
        <Single
          values={[
            { v: "SOLO", l: locale === "tr" ? "Tek başıma" : "Solo" },
            { v: "COUPLE", l: locale === "tr" ? "Çift" : "Couple" },
            { v: "FAMILY", l: locale === "tr" ? "Aile" : "Family" },
            { v: "FRIENDS", l: locale === "tr" ? "Arkadaşlar" : "Friends" },
          ]}
          selected={prefs.groupType}
          onSelect={(v) => setPrefs((p) => ({ ...p, groupType: v as Prefs["groupType"] }))}
        />
      </Section>

      <Button type="submit" disabled={pending}>
        {pending ? "…" : locale === "tr" ? "Kaydet" : "Save"}
      </Button>
      {success && <span className="ml-3 text-emerald-600">✓</span>}
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">{title}</legend>
      {children}
    </fieldset>
  );
}

function Pills({
  values,
  selected,
  onToggle,
  label,
}: {
  values: string[];
  selected: string[];
  onToggle: (v: string) => void;
  label: (v: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => {
        const active = selected.includes(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onToggle(v)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-secondary"
            }`}
          >
            {label(v)}
          </button>
        );
      })}
    </div>
  );
}

function Single({
  values,
  selected,
  onSelect,
}: {
  values: { v: string; l: string }[];
  selected: string | null;
  onSelect: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map(({ v, l }) => {
        const active = selected === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(active ? null : v)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-secondary"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
