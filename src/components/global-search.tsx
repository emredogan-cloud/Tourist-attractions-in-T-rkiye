"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "~/lib/i18n/routing";

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("common");
  const [q, setQ] = useState("");
  const router = useRouter();

  return (
    <search>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative w-full"
      >
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
        >
          <title>{t("search")}</title>
          <circle cx="9" cy="9" r="6" strokeWidth="1.5" />
          <path d="m14 14 4 4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          className={
            compact
              ? "h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              : "h-12 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          }
        />
      </form>
    </search>
  );
}
