import "../src/lib/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";

export default function RootLayout() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } }));
  return (
    <QueryClientProvider client={client}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#0b1220",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="attraction/[slug]"
          options={{ headerBackTitle: "Back", title: "Attraction" }}
        />
        <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: "modal" }} />
      </Stack>
    </QueryClientProvider>
  );
}
