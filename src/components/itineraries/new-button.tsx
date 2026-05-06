"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export function ItinerariesNew() {
  const t = useTranslations("itineraries");
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const resp = await fetch("/api/v1/itineraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!resp.ok) return;
      const j = (await resp.json()) as { itinerary: { id: string } };
      window.location.href = `/itineraries/${j.itinerary.id}`;
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>{t("create")}</Button>;
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        // biome-ignore lint/a11y/noAutofocus: focus is intentional when the create form opens
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("create")}
        maxLength={200}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={pending || title.length === 0}>
        {pending ? "…" : "+"}
      </Button>
      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
        ✕
      </Button>
    </form>
  );
}
