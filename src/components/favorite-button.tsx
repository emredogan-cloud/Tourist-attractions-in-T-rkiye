"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "~/lib/i18n/routing";
import { cn } from "~/lib/utils";

export function FavoriteButton({
  attractionId,
  initialFavorite,
  isAuthed,
  size = "md",
  className,
}: {
  attractionId: string;
  initialFavorite: boolean;
  isAuthed: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const t = useTranslations("detail");
  const [isFav, setIsFav] = useState(initialFavorite);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!isAuthed) {
      router.push("/sign-in");
      return;
    }
    if (pending) return;
    const optimistic = !isFav;
    setIsFav(optimistic);
    setPending(true);
    try {
      const resp = await fetch(`/api/v1/me/favorites/${attractionId}`, {
        method: optimistic ? "POST" : "DELETE",
      });
      if (!resp.ok) setIsFav(!optimistic);
    } catch {
      setIsFav(!optimistic);
    } finally {
      setPending(false);
    }
  }

  const sizes = {
    sm: "h-8 w-8 text-base",
    md: "h-10 w-10 text-lg",
    lg: "h-11 w-11 text-xl",
  } as const;

  return (
    <button
      type="button"
      aria-pressed={isFav}
      aria-label={isFav ? t("unfavorite") : t("favorite")}
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-input bg-background transition hover:bg-secondary",
        sizes[size],
        className,
      )}
    >
      <span aria-hidden className={isFav ? "text-rose-500" : "text-muted-foreground"}>
        {isFav ? "♥" : "♡"}
      </span>
    </button>
  );
}
