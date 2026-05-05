"use client";

import dynamic from "next/dynamic";
import type { Locale } from "~/lib/i18n/config";
import type { MapMarker } from "~/types/attraction";

const MapInner = dynamic(() => import("./map-inner").then((m) => m.MapInner), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-content-center bg-muted text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function MapView({ markers, locale }: { markers: MapMarker[]; locale: Locale }) {
  return <MapInner markers={markers} locale={locale} />;
}
