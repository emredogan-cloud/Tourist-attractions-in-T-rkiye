"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { type Locale, localeMeta, mvpLocales } from "~/lib/i18n/config";
import { usePathname, useRouter } from "~/lib/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("language")}</span>
      <select
        defaultValue={locale}
        onChange={(e) => {
          const next = e.target.value as Locale;
          startTransition(() => {
            router.replace(pathname, { locale: next });
          });
        }}
        disabled={pending}
        className="appearance-none rounded-md border border-input bg-background px-3 py-2 pr-7 text-sm hover:bg-secondary"
        aria-label={t("language")}
      >
        {mvpLocales.map((loc) => (
          <option key={loc} value={loc}>
            {localeMeta[loc].native}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-2 h-4 w-4 text-muted-foreground"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <title>{t("language")}</title>
        <path d="M5.5 7.5l4.5 4.5 4.5-4.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
      </svg>
    </label>
  );
}
