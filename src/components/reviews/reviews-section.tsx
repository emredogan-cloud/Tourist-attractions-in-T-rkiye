"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { AuthUser } from "~/server/providers/auth";
import { ReviewForm } from "./review-form";
import { Button } from "~/components/ui/button";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  helpfulCount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  authorDisplayName: string | null;
  user: { displayName: string | null; avatarUrl: string | null } | null;
  createdAt: string;
};

type Reviews = {
  items: Review[];
  total: number;
  histogram: Record<"1" | "2" | "3" | "4" | "5", number>;
};

export function ReviewsSection({
  attractionId,
  attractionSlug,
  initial,
  user,
}: {
  attractionId: string;
  attractionSlug: string;
  initial: Reviews;
  user: AuthUser | null;
}) {
  const t = useTranslations("reviews");
  const td = useTranslations("detail");
  const tnav = useTranslations("nav");
  const [data, setData] = useState<Reviews>(initial);
  const [sort, setSort] = useState<"recent" | "helpful" | "rating_high" | "rating_low">("recent");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/attractions/${attractionSlug}/reviews?sort=${sort}&limit=20`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setData(j as Reviews);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sort, attractionSlug]);

  const total = data.total;
  const totalRated = (Object.values(data.histogram).reduce((a, b) => a + b, 0) || 1);
  const avg =
    totalRated > 0
      ? (
          (Number(data.histogram["1"]) * 1 +
            Number(data.histogram["2"]) * 2 +
            Number(data.histogram["3"]) * 3 +
            Number(data.histogram["4"]) * 4 +
            Number(data.histogram["5"]) * 5) /
          totalRated
        ).toFixed(1)
      : "—";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{td("reviews")}</h2>
          <p className="text-sm text-muted-foreground">
            <span aria-hidden className="text-amber-500">★</span>{" "}
            <span className="font-medium text-foreground">{avg}</span>
            {" / 5 · "}
            {t("totalReviews", { count: total })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label={t.has?.("sort.recent") ? "" : ""}
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="recent">{t("sort.recent")}</option>
            <option value="helpful">{t("sort.helpful")}</option>
            <option value="rating_high">{t("sort.ratingHigh")}</option>
            <option value="rating_low">{t("sort.ratingLow")}</option>
          </select>
          <Button onClick={() => setOpen(true)} variant="primary" size="md">
            {td("writeReview")}
          </Button>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border border-border bg-card p-4 sm:grid-cols-5">
        {(["5", "4", "3", "2", "1"] as const).map((bucket) => {
          const count = data.histogram[bucket];
          const pct = totalRated > 0 ? Math.round((count / totalRated) * 100) : 0;
          return (
            <div key={bucket} className="flex items-center gap-2 text-sm">
              <span className="w-4 tabular-nums text-muted-foreground">{bucket}</span>
              <span aria-hidden className="text-amber-500">★</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {data.items.length === 0 ? (
          <p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            {t("totalReviews", { count: 0 })}
          </p>
        ) : (
          data.items.map((r) => (
            <article key={r.id} className="rounded-md border border-border bg-card p-4">
              <header className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-content-center rounded-full bg-secondary text-xs font-medium">
                    {(r.user?.displayName ?? r.authorDisplayName ?? t("anonymous"))[0]}
                  </span>
                  <span className="font-medium">
                    {r.user?.displayName ?? r.authorDisplayName ?? t("anonymous")}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </header>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-amber-500" aria-label={t("stars", { count: r.rating })}>
                  {"★".repeat(r.rating)}
                  <span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span>
                </span>
                {r.title && <span className="font-semibold">{r.title}</span>}
              </div>
              <p className="mt-2 leading-relaxed text-foreground/90">{r.body}</p>
              <footer className="mt-3 flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return;
                    await fetch(`/api/v1/reviews/${r.id}/helpful`, { method: "POST" });
                    setData((d) => ({
                      ...d,
                      items: d.items.map((it) =>
                        it.id === r.id ? { ...it, helpfulCount: it.helpfulCount + 1 } : it,
                      ),
                    }));
                  }}
                  className="rounded-md border border-input bg-background px-2 py-1 hover:bg-secondary"
                >
                  ♥ {t("helpful")} · {r.helpfulCount}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return;
                    const reason = window.prompt(t("reportTitle"));
                    if (!reason) return;
                    await fetch(`/api/v1/reviews/${r.id}/report`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ reason }),
                    });
                  }}
                  className="rounded-md border border-input bg-background px-2 py-1 hover:bg-secondary"
                >
                  ⚠ {t("report")}
                </button>
              </footer>
            </article>
          ))
        )}
      </div>

      {open && (
        <ReviewForm
          attractionSlug={attractionSlug}
          attractionId={attractionId}
          isAuthed={!!user}
          onClose={() => setOpen(false)}
          onSubmitted={() => {
            setOpen(false);
            setSort("recent");
          }}
        />
      )}

      {!user && (
        <p className="text-sm text-muted-foreground">
          <a href="/sign-in" className="text-primary hover:underline">
            {tnav("signIn")}
          </a>{" "}
          → {td("writeReview")}
        </p>
      )}
    </section>
  );
}
