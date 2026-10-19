import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2f80ed",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "700",
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: "#f5f5f5",
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Aktivitas" }} />
      <Stack.Screen
        name="activity/[id]"
        options={{ title: "Detail Aktivitas" }}
      />
    </Stack>
  );
}
