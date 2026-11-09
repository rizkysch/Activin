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
import { createActivityOnApi, fetchActivities, NewActivityInput } from "../data/activity";
import { fetchMalangWeather } from "../data/weather";
import { Activity } from "../types/activity";
import { Weather } from "../types/weather";

function validateNewActivity(input: NewActivityInput): Promise<NewActivityInput> {
  if (!input.title.trim() || !input.location.trim() || !input.date.trim() || !input.time.trim()) {
    return Promise.reject(new Error("Lengkapi judul, lokasi, tanggal, dan waktu aktivitas."));
  }
  if (!Number.isInteger(input.maxParticipants) || input.maxParticipants < 1) {
    return Promise.reject(new Error("Jumlah peserta maksimal harus berupa angka minimal 1."));
  }
  return Promise.resolve({ ...input, title: input.title.trim(), location: input.location.trim() });
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
  const [newActivity, setNewActivity] = useState<NewActivityInput>({
    title: "", category: "Workshop", location: "", date: "", time: "", maxParticipants: 5,
  });
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [createActivityResult, setCreateActivityResult] = useState<string | null>(null);
  const [createActivityError, setCreateActivityError] = useState<string | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherReloadKey, setWeatherReloadKey] = useState(0);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      try {
        const loadedActivities = await fetchActivities();
        if (isMounted) {
          setActivities(loadedActivities);
          setActivityReloadError(null);
        }
      } catch (error) {
        if (isMounted) {
          setActivityReloadError(
            error instanceof Error ? error.message : "Gagal memuat aktivitas.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateActivity = () => {
    setIsCreatingActivity(true);
    setCreateActivityError(null);
    setCreateActivityResult(null);

    // Alur custom async: validasi Promise -> POST API -> perbarui daftar.
    void Promise.resolve(validateNewActivity(newActivity))
      .then((validInput) => createActivityOnApi(validInput))
      .then((createdActivity) => {
        setActivities((current) => [createdActivity, ...current]);
        setActivityReloadError(null);
        setSelectedCategory("All");
        setSearch("");
        setCreateActivityResult(
          `Aktivitas "${createdActivity.title}" berhasil dibuat dan ditampilkan.`,
        );
      })
      .catch((error: unknown) => {
        setCreateActivityError(
          error instanceof Error ? error.message : "Gagal membuat aktivitas.",
        );
      })
      .finally(() => {
        setIsCreatingActivity(false);
      });
  };

  const handleReloadActivities = async () => {
    setIsReloadingActivities(true);
    setActivityReloadError(null);
    try {
      setActivities(await fetchActivities());
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

    let previousAppState = AppState.currentState ?? "active";
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
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        data={isLoading ? [] : filteredActivities}
        keyExtractor={(activity) => activity.id.toString()}
        renderItem={({ item }) => <ActivityCard activity={item} />}
        ListHeaderComponent={
          <View>
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    backgroundColor: "#eff6ff",
                  }}
                >
                  <Ionicons name="git-branch-outline" size={20} color="#2f80ed" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
                    Demo Promise
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: 13, color: "#6b7280" }}>
                    resolve, reject, dan then
                  </Text>
                </View>
              </View>
              <Text style={{ marginTop: 12, color: "#4b5563", lineHeight: 20 }}>
                Form valid diteruskan melalui Promise.resolve() ke proses API dan .then().
                Input tidak lengkap menghasilkan Promise.reject() dan ditampilkan sebagai error.
              </Text>
              <Text style={{ marginTop: 14, fontWeight: "600", color: "#374151" }}>
                Buat aktivitas baru
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                Custom async function memvalidasi formulir, mengirim POST ke API, lalu menambahkan hasil ke daftar.
              </Text>
              {([
                ["Judul aktivitas", "Contoh: Lari pagi bersama", "title"],
                ["Lokasi", "Contoh: Alun-alun Malang", "location"],
                ["Tanggal", "Contoh: 25 November 2026", "date"],
                ["Waktu", "Contoh: 07:00", "time"],
              ] as const).map(([label, placeholder, field]) => (
                <TextInput
                  key={field}
                  accessibilityLabel={label}
                  placeholder={placeholder}
                  placeholderTextColor="#9ca3af"
                  value={newActivity[field]}
                  onChangeText={(value) => {
                    setNewActivity((current) => ({ ...current, [field]: value }));
                    setCreateActivityError(null);
                    setCreateActivityResult(null);
                  }}
                  style={{
                    marginTop: 8,
                    minHeight: 44,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 8,
                    backgroundColor: "#f9fafb",
                    color: "#111827",
                  }}
                />
              ))}
              <Text style={{ marginTop: 12, fontSize: 13, fontWeight: "600", color: "#374151" }}>
                Kategori
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {["Movie", "Sport", "Game", "Workshop"].map((category) => (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    onPress={() => setNewActivity((current) => ({ ...current, category }))}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: newActivity.category === category ? "#2f80ed" : "#e5e7eb",
                    }}
                  >
                    <Text style={{ color: newActivity.category === category ? "white" : "#374151", fontWeight: "600" }}>
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                accessibilityLabel="Jumlah peserta maksimal"
                placeholder="Jumlah peserta maksimal (contoh: 8)"
                placeholderTextColor="#9ca3af"
                value={String(newActivity.maxParticipants)}
                keyboardType="number-pad"
                onChangeText={(value) => {
                  setNewActivity((current) => ({ ...current, maxParticipants: Number(value) }));
                  setCreateActivityError(null);
                }}
                style={{
                  marginTop: 8,
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                }}
              />
              <Pressable
                accessibilityRole="button"
                disabled={isCreatingActivity}
                onPress={handleCreateActivity}
                style={{
                  marginTop: 8,
                  minHeight: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: isCreatingActivity ? "#93c5fd" : "#2f80ed",
                }}
              >
                {isCreatingActivity ? <ActivityIndicator color="white" /> : (
                  <Text style={{ color: "white", fontWeight: "600" }}>Buat aktivitas</Text>
                )}
              </Pressable>
              {createActivityResult ? (
                <View
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: "#f0fdf4",
                  }}
                >
                  <Text style={{ color: "#166534", lineHeight: 20 }}>{createActivityResult}</Text>
                  <Text style={{ marginTop: 4, fontSize: 12, color: "#4b5563", lineHeight: 18 }}>
                    API DummyJSON hanya menyimulasikan POST; aktivitas ini tidak tersimpan permanen di server.
                  </Text>
                </View>
              ) : null}
              {createActivityError ? (
                <View
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: "#fef2f2",
                  }}
                >
                  <Text style={{ color: "#b91c1c", lineHeight: 20 }}>{createActivityError}</Text>
                </View>
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
                  Aktivitas
                </Text>
                <Text style={{ marginTop: 2, fontSize: 13, color: "#6b7280" }}>
                  Temukan kegiatan yang cocok untukmu
                </Text>
              </View>
              <View
                style={{
                  minWidth: 36,
                  minHeight: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 10,
                  borderRadius: 16,
                  backgroundColor: "#eff6ff",
                }}
              >
                <Text style={{ color: "#2f80ed", fontWeight: "700" }}>
                  {filteredActivities.length}
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 28,
              borderRadius: 12,
              backgroundColor: "white",
            }}
          >
            <Ionicons
              name={isLoading ? "time-outline" : "search-outline"}
              size={28}
              color="#2f80ed"
            />
            <Text
              style={{
                marginTop: 10,
                fontSize: 16,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              {isLoading
                ? "Memuat aktivitas..."
                : activityReloadError
                  ? "Aktivitas gagal dimuat"
                  : "Aktivitas tidak ditemukan"}
            </Text>
            {!isLoading && activityReloadError ? (
              <>
                <Text
                  style={{
                    marginTop: 4,
                    textAlign: "center",
                    color: "#6b7280",
                    lineHeight: 20,
                  }}
                >
                  {activityReloadError}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleReloadActivities()}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: "#2f80ed",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    Coba lagi
                  </Text>
                </Pressable>
              </>
            ) : !isLoading ? (
              <Text
                style={{
                  marginTop: 4,
                  textAlign: "center",
                  color: "#6b7280",
                  lineHeight: 20,
                }}
              >
                Coba ubah kata pencarian atau pilih kategori lain.
              </Text>
            ) : null}
          </View>
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}
