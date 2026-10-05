import { useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { activities } from "../data/activity";
import ActivityCard from "../components/ActivtyCard";

export default function Index() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredActivities = activities.filter((activity) => {
    const matchSearch = activity.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory =
      selectedCategory === "All" ||
      activity.category === selectedCategory;

    return matchSearch && matchCategory;
  });

export default function Index() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Search Activity..."
        value={search}
        onChangeText={setSearch}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          marginBottom: 16,
          gap: 8,
        }}
      >
        {["All", "Movie", "Food", "Sport"].map((category) => (
          <Pressable
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor:
                selectedCategory === category ? "#333" : "#eee",
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

      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ActivityCard activity={item} />
        )}
      />
    </View>
  );
}
