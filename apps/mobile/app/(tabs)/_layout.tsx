import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#E30A17" }}>
      <Tabs.Screen name="index" options={{ title: t("nav.home") }} />
      <Tabs.Screen name="search" options={{ title: t("nav.attractions") }} />
      <Tabs.Screen name="map" options={{ title: t("nav.map") }} />
      <Tabs.Screen name="favorites" options={{ title: t("nav.favorites") }} />
      <Tabs.Screen name="profile" options={{ title: t("nav.profile") }} />
    </Tabs>
  );
}
