import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { api } from "../../src/api/client";

type MapMarker = { id: string; slug: string; lat: number; lng: number; name: string };

export default function MapScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["map", i18n.language],
    queryFn: () =>
      api<{ markers: MapMarker[] }>(`/api/v1/attractions/map?locale=${i18n.language}`, {
        locale: i18n.language,
      }),
  });
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: 39.0, longitude: 35.0, latitudeDelta: 12, longitudeDelta: 18 }}
      >
        {data?.markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            title={m.name}
            onCalloutPress={() => router.push(`/attraction/${m.slug}`)}
          />
        ))}
      </MapView>
      {isLoading && (
        <View style={{ position: "absolute", inset: 0, justifyContent: "center", alignItems: "center" }}>
          <Text>Loading…</Text>
        </View>
      )}
    </View>
  );
}
