"use client";

import maplibregl, { type Map as MlMap, type Marker } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import Supercluster from "supercluster";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Locale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import type { MapMarker } from "~/types/attraction";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const TILE_STYLE = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
  : null;
const STYLE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${MAPBOX_TOKEN}`
  : "https://tiles.openfreemap.org/styles/liberty";

void TILE_STYLE;

export function MapInner({ markers, locale }: { markers: MapMarker[]; locale: Locale }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [selected, setSelected] = useState<MapMarker | null>(null);

  const cluster = useMemo(() => {
    const sc = new Supercluster<{ id: string }, Record<string, never>>({
      radius: 60,
      maxZoom: 14,
    });
    sc.load(
      markers.map((m) => ({
        type: "Feature",
        properties: { id: m.id },
        geometry: { type: "Point", coordinates: [m.lng, m.lat] as [number, number] },
      })),
    );
    return sc;
  }, [markers]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [35.0, 39.0],
      zoom: 5,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({ trackUserLocation: false, showAccuracyCircle: false }),
      "top-right",
    );
    mapRef.current = map;
    const draw = () => {
      const m = mapRef.current;
      if (!m) return;
      const bounds = m.getBounds();
      const zoom = Math.floor(m.getZoom());
      const clusters = cluster.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom,
      );
      for (const mk of markersRef.current) mk.remove();
      markersRef.current = [];
      for (const c of clusters) {
        const [lng, lat] = c.geometry.coordinates as [number, number];
        const isCluster = !!(c.properties as Record<string, unknown>).cluster;
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", isCluster ? "Cluster" : "Attraction");
        if (isCluster) {
          const count = (c.properties as { point_count: number }).point_count;
          el.className =
            "grid place-content-center rounded-full bg-primary text-primary-foreground font-semibold shadow-lg";
          el.style.width = `${28 + Math.min(count, 24)}px`;
          el.style.height = `${28 + Math.min(count, 24)}px`;
          el.textContent = String(count);
          el.addEventListener("click", () => {
            const z = cluster.getClusterExpansionZoom(
              (c.properties as { cluster_id: number }).cluster_id,
            );
            m.flyTo({ center: [lng, lat], zoom: z });
          });
        } else {
          const id = (c.properties as { id: string }).id;
          const data = markers.find((mk) => mk.id === id);
          el.className =
            "grid h-7 w-7 place-content-center rounded-full bg-card text-foreground border border-primary shadow";
          el.textContent = "★";
          if (data) el.addEventListener("click", () => setSelected(data));
        }
        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(m);
        markersRef.current.push(marker);
      }
    };
    map.on("moveend", draw);
    map.on("zoomend", draw);
    map.once("load", draw);
    return () => {
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [markers, cluster]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      {selected && (
        <aside
          aria-label={selected.name}
          className="absolute right-4 top-4 w-[300px] max-w-[80vw] rounded-xl border border-border bg-background p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {selected.category}
              </p>
              <h2 className="font-display text-lg font-semibold">{selected.name}</h2>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="rounded-md p-1 hover:bg-secondary"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-sm">
            <span aria-hidden className="text-amber-500">
              ★
            </span>{" "}
            {selected.averageRating.toFixed(1)}
          </p>
          <Link
            href={`/attractions/${selected.slug}`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {locale === "tr" ? "Detayları gör" : "View details"}
          </Link>
        </aside>
      )}
    </div>
  );
}
