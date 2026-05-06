"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "~/lib/i18n/routing";
import { cn } from "~/lib/utils";
import type { SearchSuggestion } from "~/server/providers/search";

const RECENT_KEY = "tt:recentSearches:v1";

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("common");
  const tSearch = useTranslations("search");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion | null>(null);
  const [recents, setRecents] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  // Load recents on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecents(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  // Click-outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced suggestion fetch
  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions(null);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const resp = await fetch(
          `/api/v1/search/suggest?q=${encodeURIComponent(q)}&locale=${locale}`,
          { signal: ctrl.signal, headers: { "Accept-Language": locale } },
        );
        if (!resp.ok) return;
        const json = (await resp.json()) as SearchSuggestion;
        setSuggestions(json);
      } catch {
        /* aborted or network */
      }
    }, 200);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [q, locale]);

  function commit(query: string) {
    if (!query.trim()) return;
    const next = [query, ...recents.filter((r) => r !== query)].slice(0, 6);
    setRecents(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const flatItems: { label: string; href?: string; query?: string }[] = [];
  if (q.trim().length < 2) {
    for (const r of recents) flatItems.push({ label: r, query: r });
  } else if (suggestions) {
    for (const a of suggestions.attractions)
      flatItems.push({ label: a.name, href: `/${locale}/attractions/${a.slug}` });
  }

  return (
    <div className="relative" ref={containerRef}>
      <search>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (active >= 0 && flatItems[active]) {
              const it = flatItems[active];
              if (it.href) router.push(it.href);
              else if (it.query) commit(it.query);
            } else {
              commit(q);
            }
          }}
          className="relative w-full"
        >
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
          >
            <title>{t("search")}</title>
            <circle cx="9" cy="9" r="6" strokeWidth="1.5" />
            <path d="m14 14 4 4" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            name="q"
            value={q}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-owns={listboxId}
            aria-controls={listboxId}
            aria-activedescendant={active >= 0 ? `${listboxId}-${active}` : undefined}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, flatItems.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, -1));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            autoComplete="off"
            spellCheck={false}
            className={
              compact
                ? "h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                : "h-12 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            }
          />
        </form>
      </search>

      {open && flatItems.length > 0 && (
        <ul
          id={listboxId}
          tabIndex={-1}
          // biome-ignore lint/a11y/useSemanticElements: ARIA combobox listbox pattern
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: WAI-ARIA combobox listbox is a ul
          role="listbox"
          aria-label={t("search")}
          className="absolute left-0 right-0 z-30 mt-1 max-h-[60vh] overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-lg"
        >
          {q.trim().length < 2 && recents.length > 0 && (
            <li className="px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              {tSearch("recent")}
            </li>
          )}
          {q.trim().length >= 2 && (suggestions?.attractions.length ?? 0) > 0 && (
            <li className="px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              {tSearch("attractions")}
            </li>
          )}
          {flatItems.map((it, i) => (
            <li
              key={`${it.label}-${i}`}
              id={`${listboxId}-${i}`}
              tabIndex={-1}
              // biome-ignore lint/a11y/useSemanticElements: ARIA combobox option
              // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: WAI-ARIA combobox option is a li
              role="option"
              aria-selected={active === i}
              className={cn(
                "block w-full cursor-pointer px-3 py-2 text-sm hover:bg-secondary",
                active === i && "bg-secondary",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                if (it.href) router.push(it.href);
                else if (it.query) commit(it.query);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (it.href) router.push(it.href);
                  else if (it.query) commit(it.query);
                }
              }}
            >
              {it.label}
            </li>
          ))}
          {q.trim().length >= 2 && (
            <li className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              {t("search")}: <span className="font-medium text-foreground">"{q}"</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
