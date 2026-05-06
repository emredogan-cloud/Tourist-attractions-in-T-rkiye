import { createHash } from "node:crypto";
import type { NearbyPlaceFetched, NearbyProvider, NearbyType } from "./types";

// Deterministic mock provider: seeds RNG from (attractionLat, attractionLng, type)
// so the same attraction always gets the same nearby places. Real provider plugs
// in by replacing this class with a Booking.com / Foursquare client.
function rngFrom(seed: string): () => number {
  let h = Number.parseInt(createHash("sha256").update(seed).digest("hex").slice(0, 12), 16);
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

const HOTEL_NAMES = [
  "Konak Boutique Hotel",
  "Anatolia Pearl Inn",
  "Bosphorus View Suites",
  "Old Town Heritage House",
  "Cappadocia Caves Resort",
  "Aegean Breeze Hotel",
  "Sultan's Garden Hotel",
  "Marble Yard Boutique",
  "Karadeniz Bay Lodge",
  "Pamukkale Spa Retreat",
];

const RESTAURANT_NAMES = [
  "Kebapçı Mahmut",
  "Meze & Rakı",
  "Sultan'ın Sofrası",
  "Fish & Olive",
  "Ottoman Kitchen",
  "Aegean Garden",
  "Black Sea Pide House",
  "Lokum Café",
  "Saray Mantı",
  "Anatolian Spice",
];

function makePlace(args: {
  lat: number;
  lng: number;
  index: number;
  type: NearbyType;
  rng: () => number;
  provider: string;
}): NearbyPlaceFetched {
  const dLat = (args.rng() - 0.5) * 0.04; // ~ within 2km
  const dLng = (args.rng() - 0.5) * 0.04;
  const names = args.type === "HOTEL" ? HOTEL_NAMES : RESTAURANT_NAMES;
  const name = names[args.index % names.length] ?? "Unnamed Place";
  const rating = 3.5 + Math.round(args.rng() * 15) / 10; // 3.5–5.0
  const priceLevel = 1 + Math.floor(args.rng() * 4);
  const externalId = createHash("sha256")
    .update(`${args.provider}:${args.type}:${args.lat}:${args.lng}:${args.index}`)
    .digest("hex")
    .slice(0, 24);
  const url =
    args.type === "HOTEL"
      ? `https://www.booking.com/hotel/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}.html`
      : `https://foursquare.com/v/${externalId}`;
  return {
    externalId,
    providerName: args.provider,
    name,
    lat: args.lat + dLat,
    lng: args.lng + dLng,
    rating,
    priceLevel,
    photoUrl: null,
    externalUrl: url,
    metadata: { source: "mock" },
  };
}

export class MockBookingProvider implements NearbyProvider {
  readonly providerName = "booking-mock";
  async fetchNearby({
    lat,
    lng,
    type,
    limit = 10,
  }: { lat: number; lng: number; type: NearbyType; radiusM: number; limit?: number }) {
    if (type !== "HOTEL") return [];
    const rng = rngFrom(`${lat},${lng},HOTEL`);
    const out: NearbyPlaceFetched[] = [];
    for (let i = 0; i < limit; i++) {
      out.push(makePlace({ lat, lng, index: i, type, rng, provider: this.providerName }));
    }
    return out;
  }
}

export class MockFoursquareProvider implements NearbyProvider {
  readonly providerName = "foursquare-mock";
  async fetchNearby({
    lat,
    lng,
    type,
    limit = 10,
  }: { lat: number; lng: number; type: NearbyType; radiusM: number; limit?: number }) {
    if (type !== "RESTAURANT") return [];
    const rng = rngFrom(`${lat},${lng},RESTAURANT`);
    const out: NearbyPlaceFetched[] = [];
    for (let i = 0; i < limit; i++) {
      out.push(makePlace({ lat, lng, index: i, type, rng, provider: this.providerName }));
    }
    return out;
  }
}
