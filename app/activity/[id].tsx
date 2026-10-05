import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { activities } from "../../data/activity";

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const activity = activities.find((item) => item.id.toString() === id);
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState(activity?.participants ?? 0);

  if (!activity) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Activity not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
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

      <Pressable onPress={() => router.back()} style={styles.backButton}>
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
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  metaBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  joinButton: {
    marginTop: 8,
    backgroundColor: "#2f80ed",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  joinButtonDisabled: {
    backgroundColor: "#bdbdbd",
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