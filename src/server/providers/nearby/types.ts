export type NearbyType = "HOTEL" | "RESTAURANT";

export type NearbyPlaceFetched = {
  externalId: string;
  providerName: string;
  name: string;
  lat: number;
  lng: number;
  rating: number | null;
  priceLevel: number | null;
  photoUrl: string | null;
  externalUrl: string;
  metadata?: Record<string, unknown>;
};

export interface NearbyProvider {
  readonly providerName: string;
  fetchNearby(args: {
    type: NearbyType;
    lat: number;
    lng: number;
    radiusM: number;
    limit?: number;
  }): Promise<NearbyPlaceFetched[]>;
}
