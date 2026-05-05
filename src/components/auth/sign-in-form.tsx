"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "~/lib/i18n/config";
import { Button } from "~/components/ui/button";

export function SignInForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const resp = await fetch("/api/v1/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { title?: string };
        setError(body.title ?? "Sign-in failed");
        return;
      }
      window.location.href = `/${locale}/profile`;
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field id="email" label={t("email")}>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </Field>
      <Field id="password" label={t("password")}>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          minLength={8}
        />
      </Field>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("signIn") + "…" : t("signIn")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <a href={`/${locale}/forgot-password`} className="hover:text-primary">
          {t("forgot")}
        </a>
      </p>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
