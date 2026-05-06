export type WeatherCondition =
  | "CLEAR"
  | "PARTLY_CLOUDY"
  | "CLOUDY"
  | "RAIN"
  | "STORM"
  | "SNOW"
  | "FOG"
  | "WIND"
  | "HOT";

export type WeatherSnapshot = {
  tempC: number;
  feelsC: number;
  condition: WeatherCondition;
  description: string;
  humidity: number;
  windKph: number;
  iconKey: string;
  observedAt: string;
};

export interface WeatherProvider {
  readonly name: string;
  current(args: { lat: number; lng: number; locale: "tr" | "en" }): Promise<WeatherSnapshot>;
}
