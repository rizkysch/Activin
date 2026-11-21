import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    let authEventVersion = 0;
    const client = getSupabaseClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      authEventVersion += 1;
      if (!isActive) return;

      setUser(session?.user ?? null);
      setError(null);
      setIsLoading(false);
    });
    const initialRequestVersion = authEventVersion;

    void client.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isActive || authEventVersion !== initialRequestVersion) return;

        if (sessionError) {
          setError(sessionError.message);
          setUser(null);
        } else {
          setError(null);
          setUser(data.session?.user ?? null);
        }
        setIsLoading(false);
      })
      .catch((sessionError: unknown) => {
        if (!isActive || authEventVersion !== initialRequestVersion) return;

        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Gagal memeriksa sesi autentikasi.",
        );
        setUser(null);
        setIsLoading(false);
      });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      error,
    }),
    [user, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }
  return context;
}
