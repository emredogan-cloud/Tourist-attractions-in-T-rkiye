import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { api } from "../../src/api/client";

type AttractionDetail = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  heroImage: { url: string; alt: string } | null;
  category: { name: string };
  province: { name: string };
};

export default function AttractionDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["attraction", slug, i18n.language],
    queryFn: () =>
      api<AttractionDetail>(`/api/v1/attractions/${slug}?locale=${i18n.language}`, {
        locale: i18n.language,
      }),
  });
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack.Screen options={{ title: data?.name ?? "" }} />
      {isLoading && <Text style={{ padding: 16 }}>Loading…</Text>}
      {data && (
        <>
          {data.heroImage && (
            <Image source={{ uri: data.heroImage.url }} style={{ height: 240 }} contentFit="cover" />
          )}
          <View style={{ padding: 16, gap: 8 }}>
            <Text style={{ fontSize: 14, color: "#666" }}>
              {data.category.name} · {data.province.name}
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "700" }}>{data.name}</Text>
            <Text style={{ fontSize: 16, color: "#444" }}>{data.summary}</Text>
            <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 22 }}>{data.description}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}
