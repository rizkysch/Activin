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
import { router } from "expo-router";
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
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
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
        style={{ flex: 1, backgroundColor: "#f4f7fb" }}
        contentContainerStyle={{
          flexGrow: 1,
          width: "100%",
          maxWidth: 1040,
          alignSelf: "center",
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 48,
        }}
        data={isLoading ? [] : filteredActivities}
        keyExtractor={(activity) => activity.id.toString()}
        renderItem={({ item }) => <ActivityCard activity={item} />}
        ListHeaderComponent={
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#2f80ed",
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 1.4,
                  }}
                >
                  ACTIVIN · MALANG
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: "#142443",
                    fontSize: 28,
                    fontWeight: "800",
                  }}
                >
                  Cari kegiatan seru
                </Text>
                <Text style={{ marginTop: 4, color: "#68758a", fontSize: 15 }}>
                  Temukan teman dan aktivitas baru di sekitarmu.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Buka akun Activin"
                onPress={() => router.push("./auth")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  paddingHorizontal: 13,
                  paddingVertical: 11,
                  borderRadius: 14,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#e5eaf2",
                }}
              >
                <Ionicons name="person-outline" size={18} color="#2f80ed" />
                <Text style={{ color: "#2f80ed", fontWeight: "700" }}>Akun</Text>
              </Pressable>
            </View>
            <View
              style={{
                marginBottom: 18,
                padding: 18,
                borderRadius: 18,
                backgroundColor: "#e8f4ff",
                borderWidth: 1,
                borderColor: "#d8eaff",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 15,
                    backgroundColor: "white",
                  }}
                >
                  <Ionicons
                    name={weather ? "partly-sunny-outline" : "cloud-outline"}
                    size={24}
                    color="#2f80ed"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#58708f", fontSize: 13, fontWeight: "600" }}>
                    CUACA SEKARANG · {weather?.location ?? "MALANG"}
                  </Text>
                  {weather ? (
                    <Text style={{ marginTop: 3, color: "#142443", fontSize: 18, fontWeight: "700" }}>
                      {weather.description}
                    </Text>
                  ) : weatherError ? (
                    <Text style={{ marginTop: 3, color: "#b91c1c", fontWeight: "600" }}>
                      Cuaca tidak tersedia
                    </Text>
                  ) : (
                    <Text style={{ marginTop: 3, color: "#142443", fontWeight: "600" }}>
                      Memuat cuaca...
                    </Text>
                  )}
                </View>
                {weather ? (
                  <Text style={{ color: "#142443", fontSize: 26, fontWeight: "800" }}>
                    {weather.temperature}°
                  </Text>
                ) : null}
              </View>
              {weather ? (
                <>
                  <Text style={{ marginTop: 14, color: "#52647c", lineHeight: 20 }}>
                    Terasa {weather.feelsLike}°C · Kelembapan {weather.humidity}% ·
                    Angin {weather.windSpeed} km/jam
                  </Text>
                  <Text style={{ marginTop: 6, fontSize: 12, color: "#71829a" }}>
                    Diperbarui otomatis tiap 15 menit
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
                  <Text style={{ marginTop: 8, color: "#b91c1c", fontSize: 12 }}>
                    {weatherError}
                  </Text>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={isRefreshingWeather}
                onPress={() => setWeatherReloadKey((current) => current + 1)}
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                  paddingHorizontal: 11,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: "white",
                }}
              >
                {isRefreshingWeather ? (
                  <ActivityIndicator size="small" color="#2f80ed" />
                ) : (
                  <Ionicons name="refresh-outline" size={15} color="#2f80ed" />
                )}
                <Text style={{ color: "#2f80ed", fontSize: 12, fontWeight: "700" }}>
                  {isRefreshingWeather ? "Memperbarui..." : "Perbarui cuaca"}
                </Text>
              </Pressable>
            </View>
            <View
              style={{
                marginBottom: 18,
                padding: 18,
                borderRadius: 18,
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#e8edf5",
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isCreateFormVisible }}
                onPress={() => setIsCreateFormVisible((visible) => !visible)}
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 15,
                    backgroundColor: "#eff6ff",
                  }}
                >
                  <Ionicons name="add" size={25} color="#2f80ed" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#142443" }}>
                    Buat aktivitas
                  </Text>
                  <Text style={{ marginTop: 3, fontSize: 13, color: "#7b8799" }}>
                    Bagikan kegiatan dan ajak teman
                  </Text>
                </View>
                <Ionicons
                  name={isCreateFormVisible ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#71829a"
                />
              </Pressable>
              {isCreateFormVisible ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ marginBottom: 8, color: "#71829a", lineHeight: 20 }}>
                    Isi detail kegiatanmu. Form divalidasi sebelum dikirim; semua
                    kolom wajib diisi.
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
                    minHeight: 48,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 12,
                    backgroundColor: "#f8fafc",
                    color: "#142443",
                  }}
                />
              ))}
              <Text style={{ marginTop: 14, fontSize: 13, fontWeight: "700", color: "#52647c" }}>
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
                      paddingVertical: 9,
                      borderRadius: 12,
                      backgroundColor: newActivity.category === category ? "#2f80ed" : "#f1f5f9",
                    }}
                  >
                    <Text style={{ color: newActivity.category === category ? "white" : "#52647c", fontWeight: "600" }}>
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
                  minHeight: 48,
                  paddingHorizontal: 14,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 12,
                  backgroundColor: "#f8fafc",
                  color: "#142443",
                }}
              />
              <Pressable
                accessibilityRole="button"
                disabled={isCreatingActivity}
                onPress={handleCreateActivity}
                style={{
                  marginTop: 8,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 14,
                  borderRadius: 12,
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
                </View>
              ) : null}
            </View>
            {activityReloadError ? (
              <Text style={{ marginBottom: 12, color: "#b91c1c" }}>
                {activityReloadError}
              </Text>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e5eaf2",
                borderRadius: 14,
                backgroundColor: "white",
                paddingHorizontal: 16,
                marginBottom: 14,
                minHeight: 54,
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
                  color: "#142443",
                  fontSize: 16,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: 20,
                gap: 10,
              }}
            >
              {categories.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor:
                      selectedCategory === category ? "#142443" : "#e8edf5",
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedCategory === category ? "white" : "#52647c",
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Muat ulang aktivitas"
                  disabled={isReloadingActivities}
                  onPress={() => void handleReloadActivities()}
                  style={{
                    width: 36,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    backgroundColor: "white",
                    borderWidth: 1,
                    borderColor: "#e5eaf2",
                  }}
                >
                  {isReloadingActivities ? (
                    <ActivityIndicator size="small" color="#2f80ed" />
                  ) : (
                    <Ionicons name="refresh-outline" size={17} color="#52647c" />
                  )}
                </Pressable>
                <View
                  style={{
                    minWidth: 36,
                    minHeight: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 10,
                    borderRadius: 16,
                    backgroundColor: "#e7f0ff",
                  }}
                >
                  <Text style={{ color: "#2f80ed", fontWeight: "700" }}>
                    {filteredActivities.length}
                  </Text>
                </View>
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
