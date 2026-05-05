"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "~/lib/i18n/config";
import { Button } from "~/components/ui/button";

export function DangerZone({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (confirm !== "DELETE") return;
    setPending(true);
    setError(null);
    try {
      const resp = await fetch("/api/v1/me", { method: "DELETE" });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { title?: string };
        setError(body.title ?? "Delete failed");
        return;
      }
      // Sign out is implicit since session cookie is now invalid (deletedAt set)
      await fetch("/api/v1/auth/sign-out", { method: "POST" });
      window.location.href = `/${locale}`;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">{t("deleteWarning")}</p>
      <p className="text-xs text-muted-foreground">
        {locale === "tr"
          ? "Hesabınız 30 gün içinde anonimleştirilir. Yeniden kayıt 90 gün boyunca engellenir."
          : "Your account will be anonymized within 30 days. Re-registration is blocked for 90 days."}
      </p>
      <label className="block text-sm">
        {t("deleteConfirm")}
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          className="mt-1 block w-full max-w-xs rounded-md border border-input bg-background px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="button"
        variant="destructive"
        disabled={pending || confirm !== "DELETE"}
        onClick={onDelete}
      >
        {pending ? "…" : t("deleteAccount")}
      </Button>
    </div>
  );
}
