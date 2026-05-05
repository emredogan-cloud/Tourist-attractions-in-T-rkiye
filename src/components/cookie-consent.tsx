"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "~/lib/i18n/routing";

const STORAGE_KEY = "tt:consent:v1";

type Consent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Consent;
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  document.dispatchEvent(new CustomEvent("consent:change", { detail: c }));
}

export function CookieConsent() {
  const t = useTranslations("consent");
  const [decided, setDecided] = useState<Consent | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDecided(readConsent());
  }, []);

  if (!mounted || decided) return null;

  const decide = (analytics: boolean, marketing: boolean) => {
    const next: Consent = {
      essential: true,
      analytics,
      marketing,
      decidedAt: new Date().toISOString(),
    };
    writeConsent(next);
    setDecided(next);
  };

  return (
    <dialog
      open
      aria-live="polite"
      aria-label={t("bannerTitle")}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl bg-transparent px-4 pb-4"
    >
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-xl">
        <div className="p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold">{t("bannerTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("bannerBody")}{" "}
            <Link href="/legal/cookies" className="underline underline-offset-2">
              {t("policyLink")}
            </Link>
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => decide(false, false)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary"
            >
              {t("rejectAll")}
            </button>
            <button
              type="button"
              onClick={() => decide(true, true)}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("acceptAll")}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
