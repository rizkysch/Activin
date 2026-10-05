import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
    <Pressable onPress={handlePress}>
      <View style={styles.card}>
        <Image
          source={{ uri: activity.imageUrl }}
          style={styles.image}
        />

        <Text style={styles.title}>{activity.title}</Text>

        <Text style={styles.category}>{activity.category}</Text>

        <Text style={styles.location}>{activity.location}</Text>

        <Text style={styles.participants}>
          {activity.participants}/{activity.maxParticipants}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "white",
  },

  image: {
    width: "100%",
    height: 180,
    borderRadius: 10,
  },

  title: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },

  category: {
    marginTop: 4,
    fontSize: 14,
  },

  location: {
    marginTop: 4,
    fontSize: 14,
  },

  participants: {
    marginTop: 4,
    fontSize: 14,
  },
});
