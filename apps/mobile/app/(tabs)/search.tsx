import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "../../src/api/client";

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [q, setQ] = useState("");
  const enabled = q.trim().length >= 2;
  const { data } = useQuery({
    queryKey: ["search", q, i18n.language],
    enabled,
    queryFn: () =>
      api<{ hits: { id: string; slug: string; name: string; summary: string }[] }>(
        `/api/v1/search?q=${encodeURIComponent(q)}&locale=${i18n.language}`,
        { locale: i18n.language },
      ),
  });
  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={t("common.searchPlaceholder")}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#e5e5e5",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 16,
        }}
      />
      <ScrollView style={{ marginTop: 12 }}>
        {data?.hits.map((h) => (
          <Pressable
            key={h.id}
            onPress={() => router.push(`/attraction/${h.slug}`)}
            style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" }}
          >
            <Text style={{ fontSize: 16, fontWeight: "500" }}>{h.name}</Text>
            <Text numberOfLines={2} style={{ marginTop: 4, color: "#666" }}>
              {h.summary}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
