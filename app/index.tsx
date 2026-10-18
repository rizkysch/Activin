import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import ActivityCard from "../components/ActivityCard";
import { activities as initialActivities } from "../data/activity";
import { Activity } from "../types/activity";

export default function Index() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <View style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#eb0909",
          borderRadius: 8,
          paddingHorizontal: 12,
          marginBottom: 16,
        }}
      >
        <Ionicons name="search" size={18} color="#ff0606" />
        <TextInput
          placeholder="Search Activity..."
          value={search}
          onChangeText={setSearch}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingLeft: 8,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
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
                selectedCategory === category ? "#060606" : "#f30404",
            }}
          >
            <Text
              style={{
                color:
                  selectedCategory === category ? "white" : "black",
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
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ActivityCard activity={item} />}
          ListEmptyComponent={<Text>No activities found.</Text>}
        />
      )}
    </View>
  );
}
