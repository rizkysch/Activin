import React, { useState } from "react";

import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import { activities } from "../../data/activities";

type Participant = {
  id: number;
  name: string;
  role: string;
};

export default function DetailActivity() {
  const { id } = useLocalSearchParams();

  const activityId = Number(id);

  const activity = activities.find(
    (item) => item.id === activityId
  );

  const [participants, setParticipants] =
    useState<Participant[]>([
      {
        id: 1,
        name: "Budi Santoso",
        role: "Kapten",
      },
      {
        id: 2,
        name: "Siti Aminah",
        role: "Kiper",
      },
      {
        id: 3,
        name: "Rizky Febian",
        role: "Striker",
      },
      {
        id: 4,
        name: "Andi Wijaya",
        role: "Bek",
      },
    ]);

  const [isJoined, setIsJoined] =
    useState<boolean>(false);

  if (!activity) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>
          Aktivitas tidak ditemukan.
        </Text>
      </View>
    );
  }

  const currentCount = participants.length;

  const isFull =
    currentCount >= activity.maxParticipants;

  const handleToggleJoin = (): void => {
    if (isJoined) {
      setParticipants((prev) =>
        prev.filter(
          (participant) =>
            participant.name !== "Kamu (User)"
        )
      );

      setIsJoined(false);

      Alert.alert(
        "Informasi",
        "Kamu batal mengikuti kegiatan ini."
      );

      return;
    }

    if (isFull) {
      Alert.alert(
        "Gagal",
        "Kuota peserta sudah penuh!"
      );

      return;
    }

    const newUser: Participant = {
      id: Date.now(),
      name: "Kamu (User)",
      role: "Pemain Baru",
    };

    setParticipants((prev) => [
      ...prev,
      newUser,
    ]);

    setIsJoined(true);

    Alert.alert(
      "Berhasil",
      "Kamu berhasil bergabung di kegiatan!"
    );
  };

  return (
    <ScrollView style={styles.container}>

      <Image
        source={{ uri: activity.image }}
        style={styles.bannerImage}
      />

      <View style={styles.content}>

        <Text style={styles.title}>
          {activity.title}
        </Text>

        <Text style={styles.category}>
          {activity.category}
        </Text>

        <Text style={styles.info}>
          📍 {activity.location}
        </Text>

        <Text style={styles.info}>
          📅 {activity.date}
        </Text>

        <Text style={styles.info}>
          🕐 {activity.time}
        </Text>

        <Text style={styles.description}>
          Ikuti kegiatan ini dan bergabung
          bersama peserta lainnya.
        </Text>

        <View style={styles.participantBox}>

          <Text style={styles.participantText}>
            Peserta: {currentCount} /{" "}
            {activity.maxParticipants}
          </Text>

          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: isFull
                ? "#ef4444"
                : "#22c55e",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: 12,
              }}
            >
              {isFull
                ? "PENUH"
                : "TERSEDIA"}
            </Text>
          </View>

        </View>

        <Pressable
          onPress={handleToggleJoin}
          disabled={isFull && !isJoined}
          style={({ pressed }) => [
            styles.joinButton,
            {
              backgroundColor: isJoined
                ? "#6b7280"
                : isFull
                ? "#9ca3af"
                : "#2563eb",

              opacity: pressed
                ? 0.8
                : 1,
            },
          ]}
        >
          <Text style={styles.buttonText}>
            {isJoined
              ? "Batal Join"
              : isFull
              ? "Kuota Penuh"
              : "Join Kegiatan"}
          </Text>
        </Pressable>

        <Text style={styles.sectionHeader}>
          Daftar Peserta Terdaftar:
        </Text>

        {participants.map(
          (
            item: Participant,
            index: number
          ) => (
            <View
              key={item.id}
              style={styles.cardItem}
            >
              <Text style={styles.itemText}>
                {index + 1}. {item.name}
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  color: "#2563eb",
                  fontWeight: "bold",
                }}
              >
                {item.role}
              </Text>
            </View>
          )
        )}

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  bannerImage: {
    width: "100%",
    height: 220,
  },

  content: {
    padding: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },

  category: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 12,
  },

  info: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 6,
  },

  description: {
    fontSize: 14,
    color: "#475569",
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 20,
  },

  participantBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
  },

  participantText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },

  joinButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
  },

  cardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },

  itemText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },

  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  notFoundText: {
    fontSize: 16,
    color: "#64748b",
  },
});