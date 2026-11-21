import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#142443",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "700",
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: "#f4f7fb",
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Aktivitas" }} />
      <Stack.Screen name="auth" options={{ title: "Akun" }} />
      <Stack.Screen
        name="activity/[id]"
        options={{ title: "Detail Aktivitas" }}
      />
    </Stack>
  );
}
