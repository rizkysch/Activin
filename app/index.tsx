import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import ActivityCard from "../components/ActivityCard";
import { activities as initialActivities } from "../data/activity";
import { fetchMalangWeather } from "../data/weather";
import { Activity } from "../types/activity";
import { Weather } from "../types/weather";

async function loadActivitiesAsync(): Promise<Activity[]> {
  // Pre-built Async Function: setTimeout() simulates the activity loading delay.
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  return initialActivities;
}

export default function Index() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloadingActivities, setIsReloadingActivities] = useState(false);
  const [activityReloadError, setActivityReloadError] = useState<string | null>(
    null,
  );
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  const isWeatherRequestInProgress = useRef(false);
  const isScreenMounted = useRef(false);

  // Custom Async Function: loads weather and activities through their async data functions.
  const loadDashboardData = useCallback(
    async (target: "all" | "weather" | "activities") => {
      const shouldLoadWeather =
        target !== "activities" && !isWeatherRequestInProgress.current;
      const shouldLoadActivities = target !== "weather";
      const loads: Promise<void>[] = [];

      if (shouldLoadWeather) {
        isWeatherRequestInProgress.current = true;
        setIsRefreshingWeather(true);
        setWeatherError(null);
        loads.push(
          (async () => {
            try {
              const currentWeather = await fetchMalangWeather();
              if (isScreenMounted.current) {
                setWeather(currentWeather);
              }
            } catch (error) {
              if (isScreenMounted.current) {
                setWeatherError(
                  error instanceof Error
                    ? error.message
                    : "Tidak dapat mengambil data cuaca.",
                );
              }
            } finally {
              isWeatherRequestInProgress.current = false;
              if (isScreenMounted.current) {
                setIsRefreshingWeather(false);
              }
            }
          })(),
        );
      }

      if (shouldLoadActivities) {
        if (target !== "all") {
          setIsReloadingActivities(true);
        }
        setActivityReloadError(null);
        loads.push(
          (async () => {
            try {
              const loadedActivities = await loadActivitiesAsync();
              if (isScreenMounted.current) {
                setActivities(loadedActivities);
              }
            } catch (error) {
              if (isScreenMounted.current) {
                setActivityReloadError(
                  error instanceof Error
                    ? error.message
                    : "Gagal memuat aktivitas.",
                );
              }
            } finally {
              if (isScreenMounted.current) {
                setIsLoading(false);
                setIsReloadingActivities(false);
              }
            }
          })(),
        );
      }

      await Promise.all(loads);
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    isScreenMounted.current = true;

    const loadWeather = async () => {
      if (isMounted) {
        await loadDashboardData("weather");
      }
    };

    void Promise.resolve().then(() => {
      if (isMounted) {
        return loadDashboardData("all");
      }
    });
    const refreshInterval = setInterval(
      () => {
        void loadWeather();
      },
      15 * 60 * 1000,
    );

    let previousAppState = AppState.currentState;
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (
          previousAppState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          void loadWeather();
        }
        previousAppState = nextAppState;
      },
    );

    return () => {
      isMounted = false;
      isScreenMounted.current = false;
      clearInterval(refreshInterval);
      appStateSubscription.remove();
    };
  }, [loadDashboardData]);

  const categories = [
    "All",
    ...new Set(activities.map((activity) => activity.category)),
  ];

  const normalizedSearch = search.trim().toLowerCase();
  const filteredActivities = activities.filter((activity) => {
    const matchSearch = activity.title.toLowerCase().includes(normalizedSearch);

    const matchCategory =
      selectedCategory === "All" || activity.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 12,
            backgroundColor: "white",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
            Cuaca {weather?.location ?? "Malang"}
          </Text>
          {weather ? (
            <>
              <Text style={{ marginTop: 6, fontSize: 16, color: "#374151" }}>
                {weather.description} · {weather.temperature}°C
              </Text>
              <Text style={{ marginTop: 4, color: "#4b5563" }}>
                Terasa {weather.feelsLike}°C · Kelembapan {weather.humidity}% ·
                Angin {weather.windSpeed} km/jam
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                Waktu data: {weather.observedAt.replace("T", " ")}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                Diperbarui otomatis tiap 15 menit saat aplikasi aktif.
              </Text>
              {weatherError ? (
                <Text style={{ marginTop: 4, color: "#b91c1c" }}>
                  Gagal memperbarui. Menampilkan data terakhir yang berhasil:{" "}
                  {weatherError}
                </Text>
              ) : null}
            </>
          ) : weatherError ? (
            <Text style={{ marginTop: 6, color: "#b91c1c" }}>
              {weatherError}
            </Text>
          ) : (
            <Text style={{ marginTop: 6, color: "#4b5563" }}>
              Memuat data cuaca...
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={isRefreshingWeather}
            onPress={() => void loadDashboardData("weather")}
            style={{
              alignSelf: "flex-start",
              marginTop: 10,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: "#e5e7eb",
            }}
          >
            <Text style={{ color: "#374151", fontWeight: "600" }}>
              {isRefreshingWeather ? "Memperbarui cuaca..." : "Perbarui cuaca"}
            </Text>
          </Pressable>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
            Aktivitas
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={isLoading || isReloadingActivities}
            onPress={() => void loadDashboardData("activities")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: "#e5e7eb",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {isReloadingActivities ? (
                <ActivityIndicator size="small" color="#2f80ed" />
              ) : null}
              <Text style={{ color: "#374151", fontWeight: "600" }}>
                {isReloadingActivities ? "Memuat..." : "Muat ulang aktivitas"}
              </Text>
            </View>
          </Pressable>
        </View>
        {activityReloadError ? (
          <Text style={{ marginBottom: 8, color: "#b91c1c" }}>
            {activityReloadError}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 10,
            backgroundColor: "white",
            paddingHorizontal: 14,
            marginBottom: 16,
            minHeight: 50,
          }}
        >
          <Ionicons name="search" size={18} color="#6b7280" />
          <TextInput
            accessibilityLabel="Cari aktivitas"
            placeholder="Cari aktivitas..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
            underlineColorAndroid="transparent"
            style={{
              flex: 1,
              minWidth: 0,
              paddingVertical: 10,
              paddingHorizontal: 10,
              borderWidth: 0,
              outlineStyle: "solid",
              outlineWidth: 0,
              outlineColor: "transparent",
              color: "#111827",
              fontSize: 16,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: 16,
            gap: 8,
          }}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor:
                  selectedCategory === category ? "#2f80ed" : "#e5e7eb",
              }}
            >
              <Text
                style={{
                  color: selectedCategory === category ? "white" : "#374151",
                  fontWeight: "600",
                }}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <Text>Memuat aktivitas...</Text>
        ) : (
          <FlatList
            data={filteredActivities}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ActivityCard activity={item} />}
            ListEmptyComponent={<Text>Belum ada aktivitas yang cocok.</Text>}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
