import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: "Europe/Istanbul",
    now: new Date(),
    formats: {
      dateTime: {
        short: { day: "numeric", month: "short", year: "numeric" },
        long: {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      },
      number: {
        currencyTRY: { style: "currency", currency: "TRY" },
        currencyUSD: { style: "currency", currency: "USD" },
        currencyEUR: { style: "currency", currency: "EUR" },
      },
    },
  };
});
