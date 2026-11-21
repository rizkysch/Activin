import type { PropsWithChildren } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function AuthGuard({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f4f7fb",
        }}
      >
        <ActivityIndicator color="#2f80ed" />
        <Text style={{ marginTop: 10, color: "#4b5563" }}>
          Memeriksa sesi...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return children;
}
