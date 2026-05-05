import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { apiBaseUrl } from "../../src/api/client";

export default function ProfileScreen() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>{t("nav.profile")}</Text>
      <Text style={{ marginTop: 12, color: "#666" }}>
        Sign-in/up flows are delivered via the web app at {apiBaseUrl}/sign-in. The mobile
        app reuses the same session cookie when running on the same domain in production.
      </Text>
      <Pressable
        onPress={() => {
          // open hosted sign-in via Linking
        }}
        style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: "#E30A17",
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>{t("nav.signIn")}</Text>
      </Pressable>
    </View>
  );
}
