"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function DirectionsButton({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  const t = useTranslations("detail");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios");
    else if (/android/.test(ua)) setPlatform("android");
  }, []);

  const links = {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_name=${encodeURIComponent(name)}`,
    apple: `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`,
    yandex: `https://yandex.com/maps/?rtext=~${lat},${lng}&rtt=auto`,
  };

  const ordered: { key: keyof typeof links; label: string }[] =
    platform === "ios"
      ? [
          { key: "apple", label: t("directionsApple") },
          { key: "google", label: t("directionsGoogle") },
          { key: "yandex", label: t("directionsYandex") },
        ]
      : platform === "android"
        ? [
            { key: "google", label: t("directionsGoogle") },
            { key: "apple", label: t("directionsApple") },
            { key: "yandex", label: t("directionsYandex") },
          ]
        : [
            { key: "google", label: t("directionsGoogle") },
            { key: "apple", label: t("directionsApple") },
            { key: "yandex", label: t("directionsYandex") },
          ];

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="primary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span aria-hidden>🧭</span>
        {tc("directions")}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
        >
          {ordered.map((o) => (
            <a
              key={o.key}
              role="menuitem"
              href={links[o.key]}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm hover:bg-secondary"
            >
              {o.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              await navigator.clipboard.writeText(`${lat}, ${lng}`);
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
          >
            {t("copyCoords")}
          </button>
        </div>
      )}
    </div>
  );
}
