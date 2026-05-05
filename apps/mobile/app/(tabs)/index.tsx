import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../src/api/client";

type Attraction = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  heroImage: { url: string; alt: string } | null;
};

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["attractions", "popular", i18n.language],
    queryFn: () =>
      api<{ items: Attraction[] }>(`/api/v1/attractions?limit=10&sort=popular`, {
        locale: i18n.language,
      }),
  });
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>{t("home.heroTitle")}</Text>
        <Text style={{ marginTop: 8, color: "#555" }}>{t("home.heroSubtitle")}</Text>
      </View>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>{t("home.featured")}</Text>
        {isLoading && <Text>{t("common.loading")}</Text>}
        {data?.items.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => router.push(`/attraction/${a.slug}`)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#f5f5f5",
            })}
          >
            {a.heroImage && (
              <Image source={{ uri: a.heroImage.url }} style={{ height: 180 }} contentFit="cover" />
            )}
            <View style={{ padding: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>{a.name}</Text>
              <Text numberOfLines={2} style={{ marginTop: 4, color: "#555" }}>
                {a.summary}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
