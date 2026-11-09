import { useEffect, useState } from "react";
import {
  AppState,
  ActivityIndicator,
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

async function loadActivitiesAsync(): Promise<Activity[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  return initialActivities;
}

async function runCustomAsyncFunction(input: string): Promise<string> {
  await new Promise<void>((resolve) => setTimeout(resolve, 2000));
  return `Tugas "${input}" berhasil ditambahkan di latar belakang.`;
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
  const [customTask, setCustomTask] = useState("");
  const [isRunningCustomTask, setIsRunningCustomTask] = useState(false);
  const [customTaskResult, setCustomTaskResult] = useState<string | null>(null);
  const [customTaskError, setCustomTaskError] = useState<string | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherReloadKey, setWeatherReloadKey] = useState(0);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      const loadedActivities = await loadActivitiesAsync();
      if (!isMounted) return;

      setActivities(loadedActivities);
      setIsLoading(false);
    };

    void loadActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRunCustomTask = async () => {
    const input = customTask.trim();
    if (!input) {
      setCustomTaskResult(null);
      setCustomTaskError("Masukkan tugas sebelum menjalankan fungsi.");
      return;
    }

    setIsRunningCustomTask(true);
    setCustomTaskError(null);
    setCustomTaskResult(null);
    try {
      setCustomTaskResult(await runCustomAsyncFunction(input));
    } catch (error) {
      setCustomTaskError(
        error instanceof Error ? error.message : "Custom task gagal dijalankan.",
      );
    } finally {
      setIsRunningCustomTask(false);
    }
  };

  const handleReloadActivities = async () => {
    setIsReloadingActivities(true);
    setActivityReloadError(null);
    try {
      setActivities(await loadActivitiesAsync());
    } catch (error) {
      setActivityReloadError(
        error instanceof Error
          ? error.message
          : "Gagal memuat ulang aktivitas.",
      );
    } finally {
      setIsReloadingActivities(false);
    }
  };

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
          marginBottom: 16,
          padding: 14,
          borderRadius: 12,
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
          Async Functions
        </Text>
        <Text style={{ marginTop: 10, fontWeight: "600", color: "#374151" }}>
          Custom Async Function
        </Text>
        <TextInput
          accessibilityLabel="Tugas custom async"
          placeholder="Masukkan tugas custom..."
          placeholderTextColor="#9ca3af"
          value={customTask}
          onChangeText={(value) => {
            setCustomTask(value);
            setCustomTaskError(null);
            setCustomTaskResult(null);
          }}
          returnKeyType="done"
          onSubmitEditing={() => void handleRunCustomTask()}
          style={{
            marginTop: 8,
            minHeight: 44,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 8,
            color: "#111827",
          }}
        />
        <Pressable
          accessibilityRole="button"
          disabled={isRunningCustomTask}
          onPress={() => void handleRunCustomTask()}
          style={{
            alignSelf: "flex-start",
            marginTop: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: isRunningCustomTask ? "#93c5fd" : "#2f80ed",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            {isRunningCustomTask ? "Menjalankan..." : "Jalankan custom task"}
          </Text>
        </Pressable>
        {customTaskResult ? (
          <Text style={{ marginTop: 8, color: "#166534" }}>
            {customTaskResult}
          </Text>
        ) : null}
        {customTaskError ? (
          <Text style={{ marginTop: 8, color: "#b91c1c" }}>
            {customTaskError}
          </Text>
        ) : null}
        <Text style={{ marginTop: 14, fontWeight: "600", color: "#374151" }}>
          Pre-built Async Functions
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          <Pressable
            accessibilityRole="button"
            disabled={isReloadingActivities}
            onPress={() => void handleReloadActivities()}
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
          <Pressable
            accessibilityRole="button"
            disabled={isRefreshingWeather}
            onPress={() => setWeatherReloadKey((current) => current + 1)}
            style={{
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
        {activityReloadError ? (
          <Text style={{ marginTop: 8, color: "#b91c1c" }}>
            {activityReloadError}
          </Text>
        ) : null}
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
