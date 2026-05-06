"use client";

import { useState } from "react";
import type { Locale } from "~/lib/i18n/config";
import { Button } from "./ui/button";

export function PremiumActions({
  plan,
  locale,
  isActive,
  hasActive,
}: {
  plan: "turkiye_plus_monthly" | "turkiye_plus_yearly";
  locale: Locale;
  isActive: boolean;
  hasActive: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function startCheckout() {
    setPending(true);
    try {
      const r = await fetch("/api/v1/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, locale }),
      });
      if (!r.ok) return;
      const j = (await r.json()) as { checkout: { url: string } };
      window.location.href = j.checkout.url;
    } finally {
      setPending(false);
    }
  }

  async function cancel() {
    if (!confirm(locale === "tr" ? "Aboneliği iptal et?" : "Cancel subscription?")) return;
    setPending(true);
    try {
      await fetch("/api/v1/me/subscription", { method: "DELETE" });
      window.location.reload();
    } finally {
      setPending(false);
    }
  }

  if (isActive) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={cancel}
        disabled={pending}
        className="mt-5 w-full"
      >
        {locale === "tr" ? "İptal et" : "Cancel"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={startCheckout}
      disabled={pending || hasActive}
      className="mt-5 w-full"
    >
      {pending
        ? "…"
        : hasActive
          ? locale === "tr"
            ? "Diğer plan aktif"
            : "Other plan active"
          : locale === "tr"
            ? "Aboneliğe başla"
            : "Subscribe"}
    </Button>
  );
}
