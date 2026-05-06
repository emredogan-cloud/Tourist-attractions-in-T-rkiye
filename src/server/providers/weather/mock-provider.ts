import { createHash } from "node:crypto";
import type { WeatherCondition, WeatherProvider, WeatherSnapshot } from "./types";

// Deterministic seasonal mock weather, seeded by lat/lng + day-of-year.
// Lets the UI demo the widget without an API key.
function rng(seed: string): () => number {
  let h = Number.parseInt(createHash("sha256").update(seed).digest("hex").slice(0, 12), 16);
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

const COND_TR: Record<WeatherCondition, string> = {
  CLEAR: "Açık",
  PARTLY_CLOUDY: "Parçalı bulutlu",
  CLOUDY: "Bulutlu",
  RAIN: "Yağmurlu",
  STORM: "Fırtınalı",
  SNOW: "Karlı",
  FOG: "Sisli",
  WIND: "Rüzgârlı",
  HOT: "Sıcak",
};
const COND_EN: Record<WeatherCondition, string> = {
  CLEAR: "Clear",
  PARTLY_CLOUDY: "Partly cloudy",
  CLOUDY: "Cloudy",
  RAIN: "Rainy",
  STORM: "Stormy",
  SNOW: "Snowy",
  FOG: "Foggy",
  WIND: "Windy",
  HOT: "Hot",
};

export class MockWeatherProvider implements WeatherProvider {
  readonly name = "mock";

  async current({
    lat,
    lng,
    locale,
  }: { lat: number; lng: number; locale: "tr" | "en" }): Promise<WeatherSnapshot> {
    const day = Math.floor(Date.now() / (24 * 3600 * 1000));
    const r = rng(`${lat.toFixed(2)},${lng.toFixed(2)},${day}`);

    const month = new Date().getUTCMonth(); // 0..11
    // Türkiye seasonal baseline: warmer June–Sept, cooler Dec–Feb
    const baseTemp = month >= 5 && month <= 8 ? 26 : month <= 1 || month === 11 ? 6 : 16;
    const tempC = Math.round((baseTemp + (r() - 0.5) * 8) * 10) / 10;
    const feelsC = Math.round((tempC + (r() - 0.5) * 3) * 10) / 10;

    const conditions: WeatherCondition[] =
      tempC >= 30
        ? ["CLEAR", "HOT", "PARTLY_CLOUDY"]
        : tempC <= 0
          ? ["SNOW", "CLOUDY", "FOG"]
          : ["CLEAR", "PARTLY_CLOUDY", "CLOUDY", "RAIN", "WIND"];
    const condition = conditions[Math.floor(r() * conditions.length)] ?? "CLEAR";
    const humidity = Math.round(40 + r() * 50);
    const windKph = Math.round(r() * 30);
    const description = locale === "en" ? COND_EN[condition] : COND_TR[condition];
    return {
      tempC,
      feelsC,
      condition,
      description,
      humidity,
      windKph,
      iconKey: condition.toLowerCase(),
      observedAt: new Date().toISOString(),
    };
  }
}
