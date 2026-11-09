import { useEffect, useState } from "react";
import {
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ActivityCard from "../components/ActivityCard";
import { activities as initialActivities } from "../data/activity";
import { fetchMalangWeather } from "../data/weather";
import { Activity } from "../types/activity";
import { Weather } from "../types/weather";

export default function Index() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherReloadKey, setWeatherReloadKey] = useState(0);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const loadedActivities = await Promise.resolve(initialActivities);
      if (!isMounted) return;

      setActivities(loadedActivities);
      setIsLoading(false);
    };

    void loadActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let isRequestInProgress = false;

    const loadWeather = async () => {
      if (isRequestInProgress) {
        return;
      }

      isRequestInProgress = true;
      setIsRefreshingWeather(true);
      try {
        const currentWeather = await fetchMalangWeather();
        if (isMounted) {
          setWeather(currentWeather);
          setWeatherError(null);
        }
      } catch (error) {
        if (isMounted) {
          setWeatherError(
            error instanceof Error
              ? error.message
              : "Tidak dapat mengambil data cuaca.",
          );
        }
      } finally {
        isRequestInProgress = false;
        if (isMounted) {
          setIsRefreshingWeather(false);
        }
      }
    };

    void loadWeather();
    const refreshInterval = setInterval(() => {
      void loadWeather();
    }, 15 * 60 * 1000);

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
      clearInterval(refreshInterval);
      appStateSubscription.remove();
    };
  }, [weatherReloadKey]);

  const categories = [
    "All",
    ...new Set(activities.map((activity) => activity.category)),
  ];

  const normalizedSearch = search.trim().toLowerCase();
  const filteredActivities = activities.filter((activity) => {
    const matchSearch = activity.title
      .toLowerCase()
      .includes(normalizedSearch);

    const matchCategory =
      selectedCategory === "All" ||
      activity.category === selectedCategory;

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
            <Pressable
              accessibilityRole="button"
              disabled={isRefreshingWeather}
              onPress={() => setWeatherReloadKey((current) => current + 1)}
              style={{ alignSelf: "flex-start", marginTop: 8 }}
            >
              <Text style={{ color: "#2f80ed", fontWeight: "600" }}>
                {isRefreshingWeather ? "Memperbarui..." : "Perbarui sekarang"}
              </Text>
            </Pressable>
            {weatherError ? (
              <Text style={{ marginTop: 4, color: "#b91c1c" }}>
                Gagal memperbarui. Menampilkan data terakhir yang berhasil:
                {" "}{weatherError}
              </Text>
            ) : null}
          </>
        ) : weatherError ? (
          <View>
            <Text style={{ marginTop: 6, color: "#b91c1c" }}>
              {weatherError}
            </Text>
            <Pressable
              onPress={() => setWeatherReloadKey((current) => current + 1)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "#2f80ed", fontWeight: "600" }}>
                Coba lagi
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={{ marginTop: 6, color: "#4b5563" }}>
            Memuat data cuaca...
          </Text>
        )}
      </View>
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
                color:
                  selectedCategory === category ? "white" : "#374151",
                fontWeight: "600",
              }}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <Text>Loading activities...</Text>
      ) : (
        <FlatList
          data={filteredActivities}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ActivityCard activity={item} />}
          ListEmptyComponent={<Text>No activities found.</Text>}
        />
      )}
      </View>
    </KeyboardAvoidingView>
  );
}
