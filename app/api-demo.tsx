import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fetchPosts } from "../data/posts";
import { Post } from "../types/post";

export default function ApiDemoScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const loadedPosts = await fetchPosts();
        if (isMounted) {
          setPosts(loadedPosts);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Data diambil dari JSONPlaceholder dan disimpan sebagai object dengan
        interface Post.
      </Text>

      {isLoading ? (
        <Text style={styles.status}>Mengambil data dari API...</Text>
      ) : errorMessage ? (
        <View>
          <Text style={styles.error}>{errorMessage}</Text>
          <Pressable
            onPress={() => setRefreshKey((current) => current + 1)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Coba lagi</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(post) => post.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postBody}>{item.body}</Text>
              <Text style={styles.userId}>User ID: {item.userId}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.status}>API tidak mengembalikan post.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  description: {
    marginBottom: 16,
    color: "#4b5563",
    lineHeight: 20,
  },
  status: {
    color: "#4b5563",
  },
  error: {
    marginBottom: 12,
    color: "#b91c1c",
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#2f80ed",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  card: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "white",
  },
  postTitle: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  postBody: {
    color: "#374151",
    lineHeight: 20,
  },
  userId: {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
  },
});
