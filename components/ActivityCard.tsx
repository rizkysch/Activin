import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Activity } from "../types/activity";

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({
  activity,
}: ActivityCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/activity/[id]",
      params: { id: String(activity.id) },
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: activity.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <View style={styles.details}>
        <View style={styles.categoryPill}>
          <Text style={styles.category}>{activity.category}</Text>
        </View>
        <Text numberOfLines={2} style={styles.title}>
          {activity.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color="#7b8799" />
          <Text numberOfLines={1} style={styles.location}>
            {activity.location}
          </Text>
        </View>
        <View style={styles.participantRow}>
          <Ionicons name="people-outline" size={15} color="#2f80ed" />
          <Text style={styles.participants}>
            {activity.participants}/{activity.maxParticipants} peserta
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#2f80ed" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e8edf5",
    shadowColor: "#142443",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  imageContainer: {
    width: 132,
    height: 132,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#e8edf5",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  details: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },
  category: {
    color: "#2f80ed",
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    marginTop: 8,
    color: "#142443",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  location: {
    flexShrink: 1,
    color: "#7b8799",
    fontSize: 13,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  participants: {
    flex: 1,
    color: "#52647c",
    fontSize: 12,
    fontWeight: "600",
  },
});
