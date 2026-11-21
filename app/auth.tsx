import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import type { User } from "@supabase/supabase-js";
import { signInWithEmail, signOut, signUpWithEmail } from "../lib/auth";
import { isSupabaseConfigured, getSupabaseClient } from "../lib/supabase";

type AuthMode = "signIn" | "signUp";

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(
    isSupabaseConfigured,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;
    const client = getSupabaseClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setIsCheckingSession(false);
      }
    });

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setErrorMessage(error.message);
        } else {
          setUser(data.session?.user ?? null);
        }
        setIsCheckingSession(false);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Gagal memuat sesi.",
          );
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setNotice(null);

    if (!email.trim() || !password) {
      setErrorMessage("Masukkan email dan kata sandi.");
      return;
    }
    if (mode === "signUp" && password.length < 6) {
      setErrorMessage("Kata sandi harus terdiri dari minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    let shouldNavigateToActivities = false;
    try {
      if (mode === "signUp") {
        const { session } = await signUpWithEmail(email, password);
        if (session) {
          shouldNavigateToActivities = true;
        } else {
          setNotice(
            "Akun berhasil dibuat. Periksa email Anda untuk konfirmasi sebelum masuk.",
          );
        }
      } else {
        await signInWithEmail(email, password);
        shouldNavigateToActivities = true;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Autentikasi gagal.",
      );
    } finally {
      setIsSubmitting(false);
    }

    if (shouldNavigateToActivities) {
      router.replace("/");
    }
  };

  const handleSignOut = async () => {
    setErrorMessage(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await signOut();
      setNotice("Anda berhasil keluar.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal keluar dari akun.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showMessage = (message: string, isError: boolean) => (
    <View
      accessibilityLiveRegion="polite"
      style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: isError ? "#fef2f2" : "#f0fdf4",
      }}
    >
      <Text style={{ color: isError ? "#b91c1c" : "#166534", lineHeight: 20 }}>
        {message}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            padding: 20,
            borderRadius: 16,
            backgroundColor: "white",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#111827" }}>
            {user ? "Akun Anda" : mode === "signIn" ? "Masuk" : "Buat akun"}
          </Text>
          <Text style={{ marginTop: 6, color: "#6b7280", lineHeight: 20 }}>
            {user
              ? Platform.OS === "web"
                ? "Sesi tersimpan di browser."
                : "Sesi tersimpan dengan aman di perangkat."
              : "Masuk atau daftar untuk menggunakan akun Activin."}
          </Text>

          {!isSupabaseConfigured ? (
            <View
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                backgroundColor: "#fef2f2",
              }}
            >
              <Text style={{ color: "#b91c1c", lineHeight: 20 }}>
                Konfigurasi Supabase belum diisi. Isi
                EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY pada
                file .env.
              </Text>
            </View>
          ) : isCheckingSession ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 28,
              }}
            >
              <ActivityIndicator color="#2f80ed" />
              <Text style={{ marginTop: 10, color: "#4b5563" }}>
                Memeriksa sesi...
              </Text>
            </View>
          ) : user ? (
            <>
              <Text
                accessibilityLabel="Email akun"
                style={{ marginTop: 18, color: "#374151" }}
              >
                {user.email}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void handleSignOut()}
                style={{
                  marginTop: 18,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  backgroundColor: isSubmitting ? "#93c5fd" : "#2f80ed",
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Keluar
                  </Text>
                )}
              </Pressable>
            </>
          ) : isSupabaseConfigured ? (
            <>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                style={{
                  marginTop: 20,
                  minHeight: 48,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  color: "#111827",
                }}
              />
              <TextInput
                accessibilityLabel="Kata sandi"
                autoComplete={mode === "signUp" ? "new-password" : "password"}
                placeholder="Kata sandi (minimal 6 karakter)"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{
                  marginTop: 10,
                  minHeight: 48,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  color: "#111827",
                }}
              />
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void handleSubmit()}
                style={{
                  marginTop: 14,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  backgroundColor: isSubmitting ? "#93c5fd" : "#2f80ed",
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    {mode === "signIn" ? "Masuk" : "Daftar"}
                  </Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => {
                  setMode(mode === "signIn" ? "signUp" : "signIn");
                  setErrorMessage(null);
                  setNotice(null);
                }}
                style={{ alignItems: "center", paddingVertical: 16 }}
              >
                <Text style={{ color: "#2f80ed", fontWeight: "600" }}>
                  {mode === "signIn"
                    ? "Belum punya akun? Daftar"
                    : "Sudah punya akun? Masuk"}
                </Text>
              </Pressable>
            </>
          ) : null}

          {errorMessage ? showMessage(errorMessage, true) : null}
          {notice ? showMessage(notice, false) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}