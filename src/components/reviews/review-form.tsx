"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";

const DRAFT_KEY = "tt:review-draft:v1";

export function ReviewForm({
  attractionSlug,
  attractionId,
  isAuthed,
  onClose,
  onSubmitted,
}: {
  attractionSlug: string;
  attractionId: string;
  isAuthed: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const t = useTranslations("reviews");
  const tc = useTranslations("common");
  void attractionId;
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Restore draft
  if (typeof window !== "undefined" && body === "" && !success) {
    try {
      const raw = window.localStorage.getItem(`${DRAFT_KEY}:${attractionSlug}`);
      if (raw) {
        const j = JSON.parse(raw) as { rating?: number; title?: string; body?: string };
        if (j.rating) setRating(j.rating);
        if (j.title) setTitle(j.title);
        if (j.body) setBody(j.body);
      }
    } catch {
      /* ignore */
    }
  }

  // Persist draft on each change
  function persistDraft(r = rating, ttl = title, b = body) {
    try {
      window.localStorage.setItem(
        `${DRAFT_KEY}:${attractionSlug}`,
        JSON.stringify({ rating: r, title: ttl, body: b }),
      );
    } catch {
      /* ignore */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthed) {
      window.location.href = "/sign-in";
      return;
    }
    if (rating < 1 || rating > 5) {
      setError(t("form.rating"));
      return;
    }
    if (body.trim().length < 20) {
      setError(`${t("form.body")} ≥ 20`);
      return;
    }
    if (!consent) {
      setError(t("form.consent"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const resp = await fetch(`/api/v1/attractions/${attractionSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
          consentAccepted: true,
        }),
      });
      const json = (await resp.json().catch(() => ({}))) as {
        title?: string;
        review?: { status: string };
      };
      if (!resp.ok) {
        setError(json.title ?? "Submit failed");
        return;
      }
      try {
        window.localStorage.removeItem(`${DRAFT_KEY}:${attractionSlug}`);
      } catch {
        /* ignore */
      }
      if (json.review?.status === "PENDING") {
        setSuccess(t("form.pendingMessage"));
      } else {
        setSuccess("✓");
        window.setTimeout(() => onSubmitted(), 600);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label={t("form.title")}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{t("form.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tc("close")}
            className="rounded-md p-1 hover:bg-secondary"
          >
            ✕
          </button>
        </header>
        <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
          <fieldset>
            <legend className="text-sm font-medium">{t("form.rating")}</legend>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setRating(n);
                    persistDraft(n, title, body);
                  }}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-3xl"
                  aria-label={t("stars", { count: n })}
                >
                  <span
                    className={
                      (hoverRating || rating) >= n ? "text-amber-500" : "text-muted-foreground/40"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="title" className="block text-sm font-medium">
              {t("form.titleField")}
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                persistDraft(rating, e.target.value, body);
              }}
              maxLength={100}
              placeholder={t("form.titlePlaceholder")}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="body" className="block text-sm font-medium">
              {t("form.body")}
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                persistDraft(rating, title, e.target.value);
              }}
              minLength={20}
              maxLength={2000}
              required
              placeholder={t("form.bodyPlaceholder")}
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
            <p className="text-right text-xs text-muted-foreground">
              {t("form.characterCount", { current: body.length, max: 2000 })}
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
              required
            />
            <span>{t("form.consent")}</span>
          </label>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {success}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending} variant="primary">
              {pending ? "…" : t("form.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
