"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { Locale } from "~/lib/i18n/config";

const CONSENT_VERSION = "2026-05-05";

export function SignUpForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError(t("consentRequired"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const resp = await fetch("/api/v1/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || undefined,
          locale,
          consentAccepted: true,
          consentVersion: CONSENT_VERSION,
          marketingOptIn,
        }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { title?: string };
        setError(body.title ?? "Sign-up failed");
        return;
      }
      window.location.href = `/${locale}/profile`;
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="displayName" className="block text-sm font-medium">
          {t("displayName")}
        </label>
        <input
          id="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
        <p className="text-xs text-muted-foreground">≥ 8 characters</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-1"
        />
        <span>{t("consent")}</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="mt-1"
        />
        <span className="text-muted-foreground">
          {locale === "tr"
            ? "Pazarlama e-postaları almak istiyorum (opsiyonel)"
            : "Send me occasional product updates (optional)"}
        </span>
      </label>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? `${t("signUp")}…` : t("signUp")}
      </Button>
    </form>
  );
}
