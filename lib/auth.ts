import type { AuthResponse } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse["data"]> {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse["data"]> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) throw error;
}
