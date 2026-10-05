import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';

// 1. PENILAIAN 10%: Menerapkan TYPE (TypeScript)
type Participant = {
  id: number;
  name: string;
  role: string;
};

export default function DetailActivity() {
  const activityTitle: string = "Futsal Bareng Activin";
  const activityDescription: string = "Main futsal bareng anggota Activin sekalian bahas kodingan modul 1.";
  const imageUri: string = "https://picsum.photos/400/200";
  const maxParticipants: number = 5;

  // 2. PENILAIAN 10%: Menerapkan ARRAY OF OBJECTS
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: "Budi Santoso", role: "Kapten" },
    { id: 2, name: "Siti Aminah", role: "Kiper" },
    { id: 3, name: "Rizky Febian", role: "Striker" },
    { id: 4, name: "Andi Wijaya", role: "Bek" },
  ]);

  const [isJoined, setIsJoined] = useState<boolean>(false);

  const currentCount: number = participants.length;
  const isFull: boolean = currentCount >= maxParticipants;

  // 3. PENILAIAN 10%: Menerapkan CUSTOM FUNCTION
  const handleToggleJoin = (): void => {
    if (isJoined) {
      setParticipants((prev) => prev.filter((p) => p.name !== "Kamu (User)"));
      setIsJoined(false);
      Alert.alert("Informasi", "Kamu batal mengikuti kegiatan ini.");
    } else {
      if (isFull) {
        Alert.alert("Gagal", "Kuota peserta sudah penuh!");
        return;
      }
      const newUser: Participant = {
        id: Date.now(),
        name: "Kamu (User)",
        role: "Pemain Baru",
      };
      setParticipants((prev) => [...prev, newUser]);
      setIsJoined(true);
      Alert.alert("Berhasil", "Kamu berhasil bergabung di kegiatan Activin!");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.bannerImage} />

      <View style={styles.content}>
        <Text style={styles.title}>{activityTitle}</Text>
        <Text style={styles.description}>{activityDescription}</Text>

        <View style={styles.participantBox}>
          <Text style={styles.participantText}>
            Peserta: {currentCount} / {maxParticipants}
          </Text>

          {/* 4. PENILAIAN 10%: Menerapkan INLINE STYLES */}
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: isFull ? '#ef4444' : '#22c55e',
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>
              {isFull ? 'PENUH' : 'TERSEDIA'}
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
                ? '#6b7280'
                : isFull
                ? '#9ca3af'
                : '#2563eb',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.buttonText}>
            {isJoined ? 'Batal Join' : isFull ? 'Kuota Penuh' : 'Join Kegiatan'}
          </Text>
        </Pressable>

        {/* 5. PENILAIAN 10%: Menerapkan LOOP (.map) */}
        <Text style={styles.sectionHeader}>Daftar Peserta Terdaftar:</Text>
        {participants.map((item: Participant, index: number) => (
          <View key={item.id} style={styles.cardItem}>
            <Text style={styles.itemText}>
              {index + 1}. {item.name}
            </Text>
            {/* INLINE STYLE tambahan */}
            <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold' }}>
              {item.role}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// 6. PENILAIAN 10%: Menerapkan EXTERNAL / STYLESHEET STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bannerImage: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 20,
  },
  participantBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  participantText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  joinButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  itemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
});