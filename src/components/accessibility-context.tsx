"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "tt:a11y:v1";

export type AccessibilitySettings = {
  fontScale: 1 | 1.125 | 1.25 | 1.5;
  highContrast: boolean;
  reducedMotion: boolean;
};

const DEFAULTS: AccessibilitySettings = {
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
};

type Ctx = {
  settings: AccessibilitySettings;
  set: (next: Partial<AccessibilitySettings>) => void;
};

const AccessibilityContext = createContext<Ctx | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<AccessibilitySettings>) });
    } catch {
      /* ignore */
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSettings((s) => ({ ...s, reducedMotion: true }));
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--a11y-font-scale", String(settings.fontScale));
    document.documentElement.classList.toggle("high-contrast", settings.highContrast);
    document.documentElement.classList.toggle("reduced-motion", settings.reducedMotion);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const set = useCallback((next: Partial<AccessibilitySettings>) => {
    setSettings((s) => ({ ...s, ...next }));
  }, []);

  return <AccessibilityContext.Provider value={{ settings, set }}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): Ctx {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be inside AccessibilityProvider");
  return ctx;
}
