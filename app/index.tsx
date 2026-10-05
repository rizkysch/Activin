import { useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import ActivityCard from "../components/ActivityCard";
import { activities } from "../data/activity";

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

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          paddingHorizontal: 12,
          marginBottom: 16,
        }}
      >
        <Ionicons name="search" size={18} color="#666" />
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

