"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { useAccessibility } from "./accessibility-context";
import { Button } from "./ui/button";

export function AccessibilityToolbar() {
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { settings, set } = useAccessibility();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-base hover:bg-secondary"
        aria-label="Accessibility"
        aria-expanded={open}
      >
        <span aria-hidden>♿</span>
      </button>
      {open && (
        <dialog
          open
          aria-label="Accessibility settings"
          className="absolute right-0 z-30 mt-2 w-72 rounded-md border border-border bg-popover p-3 shadow-lg"
        >
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Font size
            </legend>
            <div className="flex gap-1">
              {([1, 1.125, 1.25, 1.5] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={settings.fontScale === s}
                  onClick={() => set({ fontScale: s })}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs",
                    settings.fontScale === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-secondary",
                  )}
                >
                  {Math.round(s * 100)}%
                </button>
              ))}
            </div>
          </fieldset>
          <hr className="my-2 border-border" />
          <label className="flex items-center justify-between gap-2 text-sm">
            <span>High contrast</span>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => set({ highContrast: e.target.checked })}
            />
          </label>
          <label className="mt-2 flex items-center justify-between gap-2 text-sm">
            <span>Reduce motion</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => set({ reducedMotion: e.target.checked })}
            />
          </label>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {tc("close")}
            </Button>
          </div>
        </dialog>
      )}
    </div>
  );
}
