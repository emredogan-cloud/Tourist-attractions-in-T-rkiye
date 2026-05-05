"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";

type NearbyItem = {
  id: string;
  providerName: string;
  name: string;
  lat: number;
  lng: number;
  rating: number | null;
  priceLevel: number | null;
  distanceM: number;
  photoUrl: string | null;
  affiliateRedirectUrl: string;
};

export function NearbySection({ slug }: { slug: string }) {
  const t = useTranslations("nearby");
  const [tab, setTab] = useState<"hotel" | "restaurant">("hotel");
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/attractions/${slug}/nearby?type=${tab}&limit=10`)
      .then((r) => r.json())
      .then((j: { items: NearbyItem[] }) => {
        if (!cancelled) setItems(j.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, slug]);

  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between">
        <h2 className="font-display text-xl font-semibold">{t("title")}</h2>
        <div role="tablist" aria-label={t("title")} className="inline-flex rounded-md border border-input">
          {(["hotel", "restaurant"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={tab === kind}
              onClick={() => setTab(kind)}
              className={
                "px-3 py-1 text-sm transition-colors first:rounded-l-md last:rounded-r-md " +
                (tab === kind
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-secondary")
              }
            >
              {kind === "hotel" ? t("hotels") : t("restaurants")}
            </button>
          ))}
        </div>
      </header>

      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
        {t("affiliateDisclosure")}
      </p>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          —
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="overflow-hidden rounded-md border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-medium">{it.name}</h3>
                {typeof it.rating === "number" && (
                  <span className="shrink-0 text-sm">
                    <span aria-hidden className="text-amber-500">★</span>{" "}
                    {it.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {(it.distanceM / 1000).toFixed(1)} km
                </span>
                {it.priceLevel && <span>{"₺".repeat(it.priceLevel)}</span>}
                <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase">
                  {it.providerName.split("-")[0]}
                </span>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                <a href={it.affiliateRedirectUrl} target="_blank" rel="noopener noreferrer sponsored">
                  {t("visit")} →
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
