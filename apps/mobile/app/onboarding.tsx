import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 28, fontWeight: "700", textAlign: "center" }}>
        {t("home.heroTitle")}
      </Text>
      <Text style={{ fontSize: 16, color: "#666", textAlign: "center" }}>
        {t("home.heroSubtitle")}
      </Text>
      <Pressable
        onPress={() => router.replace("/(tabs)/")}
        style={{ marginTop: 24, padding: 14, backgroundColor: "#E30A17", borderRadius: 10 }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>{t("home.heroCta")}</Text>
      </Pressable>
    </View>
  );
}
