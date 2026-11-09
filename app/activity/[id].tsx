import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { fetchActivities } from "../../data/activity";
import { Activity } from "../../types/activity";

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadActivity = async () => {
      try {
        const allActivities = await fetchActivities();
        const foundActivity = allActivities.find((item) => item.id.toString() === id);
        if (isMounted) {
          setActivity(foundActivity ?? null);
          setParticipants(foundActivity?.participants ?? 0);
          setLoadError(null);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat aktivitas.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadActivity();
    return () => { isMounted = false; };
  }, [id]);

  const handleGoBack = () => router.back();
  const handleGoHome = () => router.replace("/");

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator color="#2f80ed" />
        <Text style={styles.emptyTitle}>Memuat detail aktivitas...</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>
          {loadError ?? "Aktivitas tidak ditemukan"}
        </Text>
        <Pressable onPress={handleGoHome} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  const canJoin = participants < activity.maxParticipants && !isJoined;

  const handleJoin = () => {
    if (!canJoin) {
      return;
    }

    setParticipants((current) => current + 1);
    setIsJoined(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: activity.imageUrl }} style={styles.image} />

      <Text style={styles.category}>{activity.category}</Text>
      <Text style={styles.title}>{activity.title}</Text>

      <View style={styles.metaBox}>
        <Text style={styles.metaLabel}>Location</Text>
        <Text style={styles.metaValue}>{activity.location}</Text>
      </View>

      <View style={styles.metaBox}>
        <Text style={styles.metaLabel}>Date</Text>
        <Text style={styles.metaValue}>{activity.date}</Text>
      </View>

      <View style={styles.metaBox}>
        <Text style={styles.metaLabel}>Time</Text>
        <Text style={styles.metaValue}>{activity.time}</Text>
      </View>

      <View style={styles.metaBox}>
        <Text style={styles.metaLabel}>Participants</Text>
        <Text style={styles.metaValue}>
          {participants}/{activity.maxParticipants}
        </Text>
      </View>

      <Pressable
        onPress={handleJoin}
        disabled={!canJoin}
        style={[styles.joinButton, !canJoin && styles.joinButtonDisabled]}
      >
        <Text style={styles.joinButtonText}>
          {isJoined ? "Joined" : "Join Activity"}
        </Text>
      </Pressable>

      <Pressable onPress={handleGoBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  image: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#111827",
  },
  metaBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  joinButton: {
    marginTop: 8,
    backgroundColor: "#0f6ce4",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  joinButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  joinButtonText: {
    color: "white",
    fontWeight: "700",
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "#333",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "white",
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
});
