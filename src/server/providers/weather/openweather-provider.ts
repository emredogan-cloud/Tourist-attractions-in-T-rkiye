import { getConfig } from "~/lib/config";
import { UpstreamError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import type { WeatherCondition, WeatherProvider, WeatherSnapshot } from "./types";

const ICON_MAP: Record<number, WeatherCondition> = {
  200: "STORM",
  300: "RAIN",
  500: "RAIN",
  600: "SNOW",
  700: "FOG",
  800: "CLEAR",
  801: "PARTLY_CLOUDY",
  802: "PARTLY_CLOUDY",
  803: "CLOUDY",
  804: "CLOUDY",
};

function mapCondition(id: number): WeatherCondition {
  const bucket = Math.floor(id / 100) * 100;
  return ICON_MAP[id] ?? ICON_MAP[bucket] ?? "CLEAR";
}

export class OpenWeatherProvider implements WeatherProvider {
  readonly name = "openweather";

  async current({
    lat,
    lng,
    locale,
  }: { lat: number; lng: number; locale: "tr" | "en" }): Promise<WeatherSnapshot> {
    const config = getConfig();
    if (!config.OPENWEATHER_API_KEY) {
      throw new UpstreamError("openweather", "OPENWEATHER_API_KEY missing");
    }
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("appid", config.OPENWEATHER_API_KEY);
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", locale);
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = (await resp.json()) as {
        weather: { id: number; description: string }[];
        main: { temp: number; feels_like: number; humidity: number };
        wind: { speed: number };
      };
      const weather = json.weather[0];
      const condition = weather ? mapCondition(weather.id) : "CLEAR";
      return {
        tempC: Math.round(json.main.temp * 10) / 10,
        feelsC: Math.round(json.main.feels_like * 10) / 10,
        condition,
        description: weather?.description ?? "",
        humidity: json.main.humidity,
        windKph: Math.round(json.wind.speed * 3.6),
        iconKey: condition.toLowerCase(),
        observedAt: new Date().toISOString(),
      };
    } catch (err) {
      logger.warn({ err }, "openweather fetch failed");
      throw new UpstreamError("openweather", "Weather fetch failed", err);
    }
  }
}
