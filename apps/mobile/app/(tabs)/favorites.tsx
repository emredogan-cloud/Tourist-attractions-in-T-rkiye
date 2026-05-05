import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../src/api/client";

type Favorite = {
  attractionId: string;
  attraction: { id: string; translations: { locale: string; name: string; slug: string }[] };
};

export default function FavoritesScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["favorites", i18n.language],
    queryFn: () => api<{ favorites: Favorite[] }>("/api/v1/me/favorites", { locale: i18n.language }),
  });
  const items = data?.favorites ?? [];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>{t("favorites.title")}</Text>
      {items.length === 0 ? (
        <Text style={{ marginTop: 12, color: "#666" }}>{t("favorites.empty")}</Text>
      ) : (
        items.map((f) => {
          const tr =
            f.attraction.translations.find((t) => t.locale === i18n.language) ??
            f.attraction.translations[0];
          if (!tr) return null;
          return (
            <Pressable
              key={f.attractionId}
              onPress={() => router.push(`/attraction/${tr.slug}`)}
              style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" }}
            >
              <Text style={{ fontSize: 16, fontWeight: "500" }}>{tr.name}</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
