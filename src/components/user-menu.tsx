"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AuthUser } from "~/server/providers/auth";

export function UserMenu({ user }: { user: AuthUser }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const initial = (user.displayName ?? user.email)[0]?.toUpperCase() ?? "U";

  async function signOut() {
    await fetch("/api/v1/auth/sign-out", { method: "POST" });
    window.location.href = `/${user.locale}`;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-content-center rounded-full bg-primary text-primary-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.displayName ?? user.email}
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
        >
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {user.displayName ?? user.email}
          </div>
          <a
            role="menuitem"
            href={`/${user.locale}/profile`}
            className="block px-3 py-2 text-sm hover:bg-secondary"
          >
            {t("profile")}
          </a>
          <a
            role="menuitem"
            href={`/${user.locale}/favorites`}
            className="block px-3 py-2 text-sm hover:bg-secondary"
          >
            {t("favorites")}
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
