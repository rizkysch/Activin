import { Post } from "../types/post";

const POSTS_API_URL = "https://jsonplaceholder.typicode.com/posts";

function isPost(value: unknown): value is Post {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const post = value as Record<string, unknown>;
  return (
    typeof post.id === "number" &&
    typeof post.userId === "number" &&
    typeof post.title === "string" &&
    typeof post.body === "string"
  );
}

function isPostArray(value: unknown): value is Post[] {
  return Array.isArray(value) && value.every(isPost);
}

export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch(POSTS_API_URL);
  if (!response.ok) {
    throw new Error(`Gagal mengambil data post (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!isPostArray(data)) {
    throw new Error("Format data dari API tidak sesuai dengan interface Post.");
  }

  return data;
}
