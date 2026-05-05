import { getConfig } from "~/lib/config";
import { logger } from "~/lib/logger";
import { MockBookingProvider, MockFoursquareProvider } from "./mock-providers";
import type { NearbyProvider, NearbyType } from "./types";

export type { NearbyProvider, NearbyType, NearbyPlaceFetched } from "./types";

let cachedHotels: NearbyProvider | undefined;
let cachedRestaurants: NearbyProvider | undefined;

export function getHotelsProvider(): NearbyProvider {
  if (cachedHotels) return cachedHotels;
  const config = getConfig();
  if (config.NEARBY_PROVIDER_HOTELS === "booking" && !config.BOOKING_API_KEY) {
    logger.warn("NEARBY_PROVIDER_HOTELS=booking but no API key — using mock");
  }
  cachedHotels = new MockBookingProvider();
  return cachedHotels;
}

export function getRestaurantsProvider(): NearbyProvider {
  if (cachedRestaurants) return cachedRestaurants;
  const config = getConfig();
  if (config.NEARBY_PROVIDER_RESTAURANTS === "foursquare" && !config.FOURSQUARE_API_KEY) {
    logger.warn("NEARBY_PROVIDER_RESTAURANTS=foursquare but no API key — using mock");
  }
  cachedRestaurants = new MockFoursquareProvider();
  return cachedRestaurants;
}

export function getProviderFor(type: NearbyType): NearbyProvider {
  return type === "HOTEL" ? getHotelsProvider() : getRestaurantsProvider();
}
