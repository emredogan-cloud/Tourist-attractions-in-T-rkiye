"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "./ui/button";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);

  async function onClick() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ url, title });
        return;
      } catch {
        // user canceled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} aria-label={t("share")}>
      <span aria-hidden>🔗</span>
      {copied ? t("linkCopied") : t("share")}
    </Button>
  );
}
