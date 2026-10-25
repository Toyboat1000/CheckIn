import { AppDataProvider } from "@/context/AppDataContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AppDataProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
      </Stack>
    </AppDataProvider>
  );
}
