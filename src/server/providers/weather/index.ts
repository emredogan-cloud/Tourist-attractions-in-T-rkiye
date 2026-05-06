import { getConfig } from "~/lib/config";
import { logger } from "~/lib/logger";
import { MockWeatherProvider } from "./mock-provider";
import { OpenWeatherProvider } from "./openweather-provider";
import type { WeatherProvider } from "./types";

export type { WeatherCondition, WeatherProvider, WeatherSnapshot } from "./types";

let cached: WeatherProvider | undefined;

export function getWeatherProvider(): WeatherProvider {
  if (cached) return cached;
  const config = getConfig();
  if (config.OPENWEATHER_API_KEY) {
    cached = new OpenWeatherProvider();
    logger.info("weather: using OpenWeather");
  } else {
    cached = new MockWeatherProvider();
  }
  return cached;
}
