import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Navigate } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { useZenflowStore } from "../../state/zenflow-store";
import { loadOrSeedWorkspace } from "../workspace/workspace-sync.service";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  isDevelopmentFallback: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(isSupabaseConfigured);
  const hydrateWorkspace = useZenflowStore((state) => state.hydrateWorkspace);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    let isActive = true;

    loadOrSeedWorkspace()
      .then((snapshot) => {
        if (!isActive || !snapshot) return;
        hydrateWorkspace(snapshot);
        document.documentElement.classList.toggle("dark", snapshot.userSettings.theme === "dark");
        document.documentElement.style.setProperty("--color-primary", snapshot.userSettings.primaryColor);
        document.documentElement.style.setProperty("--color-secondary", snapshot.userSettings.secondaryColor);
      })
      .catch((error) => {
        console.error("No se pudo cargar el workspace de ZenFlow.", error);
      });

    return () => {
      isActive = false;
    };
  }, [hydrateWorkspace, session]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isLoading,
    isSupabaseConfigured,
    isDevelopmentFallback: !isSupabaseConfigured,
  }), [isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) return <div className="min-h-screen bg-background p-8 text-on-background">Cargando sesion...</div>;
  if (!auth.isDevelopmentFallback && !auth.session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) return <div className="min-h-screen bg-background p-8 text-on-background">Cargando sesion...</div>;
  if (!auth.isDevelopmentFallback && auth.session) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
