"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { type Currency, convertFromTry, formatCurrency } from "~/lib/format";
import { cn } from "~/lib/utils";
import type { AttractionPrice } from "~/types/attraction";

export function PricingTable({ pricing }: { pricing: AttractionPrice[] }) {
  const locale = useLocale();
  const t = useTranslations("detail");
  const tc = useTranslations("common");
  const [currency, setCurrency] = useState<Currency>("TRY");
  const currencies: Currency[] = locale === "en" ? ["USD", "EUR", "TRY"] : ["TRY", "USD", "EUR"];

  if (pricing.length === 0) {
    return <p className="text-sm text-muted-foreground">{tc("noResults")}</p>;
  }

  return (
    <div className="space-y-3">
      <fieldset className="flex items-center gap-2">
        <legend className="text-sm text-muted-foreground">{tc("currency")}</legend>
        <div className="flex rounded-md border border-input">
          {currencies.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                "px-3 py-1 text-sm transition-colors first:rounded-l-md last:rounded-r-md",
                currency === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-secondary",
              )}
              aria-pressed={currency === c}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">{t("audience.ADULT")}</th>
              <th className="px-4 py-2 text-right">
                {tc("free").charAt(0).toUpperCase() + tc("free").slice(1)} / Fiyat
              </th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((p) => (
              <tr key={`${p.audience}-${p.priceTry}`} className="border-t border-border">
                <td className="px-4 py-2">
                  {/* fall back to code if i18n missing */}
                  {(t.has?.(`audience.${p.audience}`) ?? true)
                    ? t(`audience.${p.audience}` as never)
                    : p.audience}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {p.isFree
                    ? tc("free")
                    : formatCurrency(convertFromTry(p.priceTry, currency), currency, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
