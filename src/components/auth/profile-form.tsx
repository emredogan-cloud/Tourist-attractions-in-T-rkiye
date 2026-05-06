"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { Locale } from "~/lib/i18n/config";
import { mvpLocales } from "~/lib/i18n/config";

export function ProfileForm({ initial }: { initial: { displayName: string; locale: Locale } }) {
  const t = useTranslations("auth");
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [locale, setLocale] = useState<Locale>(initial.locale);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setSuccess(false);
    setError(null);
    try {
      const resp = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, locale }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { title?: string };
        setError(body.title ?? "Update failed");
        return;
      }
      setSuccess(true);
      window.setTimeout(() => window.location.reload(), 600);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="displayName" className="block text-sm font-medium">
          {t("displayName")}
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="locale" className="block text-sm font-medium">
          Locale
        </label>
        <select
          id="locale"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="rounded-md border border-input bg-background px-3 py-2"
        >
          {mvpLocales.map((l) => (
            <option key={l} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">✓</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Save"}
      </Button>
    </form>
  );
}
