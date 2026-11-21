import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";

function RootStack() {
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

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootStack />
    </AuthProvider>
  );
}
