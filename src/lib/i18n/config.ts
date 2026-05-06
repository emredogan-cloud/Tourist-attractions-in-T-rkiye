export const locales = ["tr", "en", "ar", "ru", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "tr";

export const mvpLocales: readonly Locale[] = ["tr", "en", "ar", "ru", "de"] as const;

export const rtlLocales: ReadonlySet<Locale> = new Set<Locale>(["ar"]);

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return rtlLocales.has(locale);
}

export const localeMeta: Record<
  Locale,
  { native: string; english: string; direction: "ltr" | "rtl"; currencies: readonly string[] }
> = {
  tr: { native: "Türkçe", english: "Turkish", direction: "ltr", currencies: ["TRY", "USD", "EUR"] },
  en: {
    native: "English",
    english: "English",
    direction: "ltr",
    currencies: ["USD", "EUR", "TRY"],
  },
  ar: { native: "العربية", english: "Arabic", direction: "rtl", currencies: ["USD", "TRY", "EUR"] },
  ru: {
    native: "Русский",
    english: "Russian",
    direction: "ltr",
    currencies: ["USD", "TRY", "EUR"],
  },
  de: { native: "Deutsch", english: "German", direction: "ltr", currencies: ["EUR", "USD", "TRY"] },
};
