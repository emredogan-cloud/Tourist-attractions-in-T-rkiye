// Static mid-range FX rates updated quarterly. Real-time rates can be wired via TCMB later.
export const FX_RATES_VS_TRY = {
  TRY: 1,
  USD: 0.0285,
  EUR: 0.0265,
  GBP: 0.0225,
} as const;

export type Currency = keyof typeof FX_RATES_VS_TRY;

export function convertFromTry(amountTry: number, currency: Currency): number {
  return amountTry * FX_RATES_VS_TRY[currency];
}

export function formatCurrency(amount: number, currency: Currency, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "TRY" ? 0 : 2,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  locale: string,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(
    locale,
    opts ?? { day: "numeric", month: "short", year: "numeric" },
  ).format(d);
}

export function formatNumber(
  value: number,
  locale: string,
  opts?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, opts).format(value);
}
