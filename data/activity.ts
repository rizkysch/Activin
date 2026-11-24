import { Activity } from "../types/activity";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

const ACTIVITIES_API_URL = "https://dummyjson.com/todos?limit=8";
const categoryOptions = ["Movie", "Sport", "Game", "Workshop"];
const activityImages: Record<string, string> = {
  Movie: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
  Sport: "https://images.unsplash.com/photo-1541534401786-2077eed87a74?auto=format&fit=crop&w=1200&q=80",
  Game: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
  Workshop: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
};

interface CommonsSearchResponse {
  query?: {
    pages?: Record<string, { imageinfo?: Array<{ thumburl?: string }> }>;
  };
}

const imageCache = new Map<string, string>();
const sessionCreatedActivities: Activity[] = [];

async function findActivityImage(title: string, fallback: string): Promise<string> {
  const cacheKey = title.trim().toLowerCase();
  const cachedImage = imageCache.get(cacheKey);
  if (cachedImage) return cachedImage;

  try {
    const query = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: title,
      gsrnamespace: "6",
      gsrlimit: "1",
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: "900",
      format: "json",
      origin: "*",
    });
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${query}`);
    if (!response.ok) return fallback;
    const result = (await response.json()) as CommonsSearchResponse;
    const imageUrl = Object.values(result.query?.pages ?? {})[0]?.imageinfo?.[0]?.thumburl;
    if (!imageUrl) return fallback;
    imageCache.set(cacheKey, imageUrl);
    return imageUrl;
  } catch {
    return fallback;
  }
}

function getActivityCategory(title: string, index: number): string {
  const normalizedTitle = title.toLowerCase();
  if (/film|movie|cinema|watch/.test(normalizedTitle)) return "Movie";
  if (/run|walk|sport|exercise|workout|bike|hike/.test(normalizedTitle)) return "Sport";
  if (/game|play|gaming|puzzle/.test(normalizedTitle)) return "Game";
  if (/paint|draw|cook|learn|class|workshop|create/.test(normalizedTitle)) return "Workshop";
  return categoryOptions[index % categoryOptions.length];
}

interface TodoApiItem {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

interface TodoApiResponse {
  todos: TodoApiItem[];
}

export interface NewActivityInput {
  title: string;
  category: string;
  location: string;
  date: string;
  time: string;
  maxParticipants: number;
}

interface CreatedTodoResponse {
  id: number;
  todo: string;
}

interface SupabaseActivityRow {
  id: number;
  title: string;
  category: string;
  location: string;
  date: string;
  time: string;
  participants: number;
  max_participants: number;
  image_url: string;
}

function mapSupabaseActivity(row: SupabaseActivityRow): Activity {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    date: row.date,
    time: row.time,
    participants: row.participants,
    maxParticipants: row.max_participants,
    imageUrl: row.image_url,
  };
}

function isTodoApiResponse(value: unknown): value is TodoApiResponse {
  if (typeof value !== "object" || value === null || !("todos" in value)) {
    return false;
  }

  return (
    Array.isArray(value.todos) &&
    value.todos.every(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item && typeof item.id === "number" &&
        "todo" in item && typeof item.todo === "string" &&
        "completed" in item && typeof item.completed === "boolean" &&
        "userId" in item && typeof item.userId === "number",
    )
  );
}

export async function fetchActivities(): Promise<Activity[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabaseClient()
      .from("activities")
      .select("id,title,category,location,date,time,participants,max_participants,image_url")
      .order("id", { ascending: false })
      .limit(1000);

    if (error) {
      throw new Error(`Gagal mengambil aktivitas dari Supabase: ${error.message}`);
    }

    return [
      ...sessionCreatedActivities,
      ...(data as SupabaseActivityRow[]).map(mapSupabaseActivity),
    ];
  }

  const response = await fetch(ACTIVITIES_API_URL);
  if (!response.ok) {
    throw new Error(`Gagal mengambil aktivitas (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!isTodoApiResponse(data)) {
    throw new Error("Format data aktivitas dari API tidak sesuai.");
  }

  // DummyJSON menyediakan data contoh todo; metadata meetup di bawah hanya untuk demo UI.
  const fetchedActivities = await Promise.all(data.todos.map(async (todo, index) => ({
    id: todo.id,
    title: todo.todo,
    category: getActivityCategory(todo.todo, index),
    location: "Malang",
    date: `${20 + (index % 10)} September 2026`,
    time: `${String(10 + (index % 10)).padStart(2, "0")}:00`,
    participants: todo.completed ? 3 : 1,
    maxParticipants: 5 + (index % 6),
    imageUrl: await findActivityImage(
      todo.todo,
      activityImages[getActivityCategory(todo.todo, index)],
    ),
  })));
  return [...sessionCreatedActivities, ...fetchedActivities];
}

export async function fetchActivityById(id: number): Promise<Activity | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabaseClient()
      .from("activities")
      .select("id,title,category,location,date,time,participants,max_participants,image_url")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal mengambil detail aktivitas: ${error.message}`);
    }

    return data ? mapSupabaseActivity(data as SupabaseActivityRow) : null;
  }

  const allActivities = await fetchActivities();
  return allActivities.find((activity) => activity.id === id) ?? null;
}

export async function createActivityOnApi(input: NewActivityInput): Promise<Activity> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabaseClient()
      .from("activities")
      .insert({
        title: input.title,
        category: input.category,
        location: input.location,
        date: input.date,
        time: input.time,
        participants: 1,
        max_participants: input.maxParticipants,
        image_url: activityImages[input.category] ?? activityImages.Workshop,
      })
      .select("id,title,category,location,date,time,participants,max_participants,image_url")
      .single();

    if (error) {
      throw new Error(`Gagal membuat aktivitas di Supabase: ${error.message}`);
    }

    const createdActivity = mapSupabaseActivity(data as SupabaseActivityRow);
    sessionCreatedActivities.unshift(createdActivity);
    return createdActivity;
  }

  const response = await fetch("https://dummyjson.com/todos/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ todo: input.title, completed: false, userId: 1 }),
  });
  if (!response.ok) {
    throw new Error(`Gagal membuat aktivitas (HTTP ${response.status}).`);
  }

  const result: unknown = await response.json();
  if (
    typeof result !== "object" || result === null ||
    !("id" in result) || typeof result.id !== "number" ||
    !("todo" in result) || typeof result.todo !== "string"
  ) {
    throw new Error("Respons pembuatan aktivitas dari API tidak sesuai.");
  }

  const created = result as CreatedTodoResponse;
  const category = input.category;
  const createdActivity: Activity = {
    id: created.id,
    title: created.todo,
    category,
    location: input.location,
    date: input.date,
    time: input.time,
    participants: 1,
    maxParticipants: input.maxParticipants,
    imageUrl: await findActivityImage(created.todo, activityImages[category] ?? activityImages.Workshop),
  };
  sessionCreatedActivities.unshift(createdActivity);
  return createdActivity;
}
