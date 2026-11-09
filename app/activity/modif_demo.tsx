import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import ActivityCard from "../../components/ActivityCard";
import { fetchActivities } from "../../data/activity";
import { Activity } from "../../types/activity";

export default function ActivityDemoScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    let isMounted = true;
    void fetchActivities().then((items) => {
      if (isMounted) setActivities(items);
    }).catch(() => {
      if (isMounted) setActivities([]);
    });
    return () => { isMounted = false; };
  }, []);

  const categories = [
    "All",
    ...new Set(activities.map((activity) => activity.category)),
  ];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = activity.title
      .toLowerCase()
      .includes(normalizedSearch);
    const matchesCategory =
      selectedCategory === "All" || activity.category === selectedCategory;

    return matchesSearch && matchesCategory;
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
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
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
                color: selectedCategory === category ? "white" : "black",
              }}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredActivities}
        keyExtractor={(activity) => activity.id.toString()}
        renderItem={({ item }) => <ActivityCard activity={item} />}
        ListEmptyComponent={<Text>No activities found.</Text>}
      />
    </View>
  );
}
