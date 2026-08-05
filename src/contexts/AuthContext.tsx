import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Contexto de autenticação (sessão).
 *
 * IMPORTANTE:
 * - Guardamos a sessão completa (Session), não apenas o usuário.
 * - O listener (onAuthStateChange) é configurado ANTES do getSession.
 * - O callback do listener não pode ser async (evita deadlocks).
 */

export type AppRole = "admin" | "atendimento" | "logistica";

type AuthContextValue = {
  carregando: boolean;
  session: Session | null;
  user: User | null;
  /** Papéis do usuário, lidos de public.user_roles (o RLS só devolve os próprios). */
  papeis: AppRole[];
  ehAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [papeis, setPapeis] = useState<AppRole[]>([]);
  const [carregandoPapeis, setCarregandoPapeis] = useState(false);

  // Papéis servem apenas para a navegação. A autorização real é do RLS no banco:
  // forjar isto no devtools não dá acesso a nenhum dado.
  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setPapeis([]);
      setCarregandoPapeis(false);
      return;
    }

    let cancelado = false;
    setCarregandoPapeis(true);

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .then(({ data }) => {
        if (cancelado) return;
        setPapeis((data ?? []).map((r) => r.role as AppRole));
        setCarregandoPapeis(false);
      });

    return () => {
      cancelado = true;
    };
  }, [user?.id]);

  useEffect(() => {
    // 1) Listener primeiro (padrão recomendado)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // 2) Depois, recupera sessão existente
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .finally(() => setCarregando(false));

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      carregando: carregando || carregandoPapeis,
      session,
      user,
      papeis,
      ehAdmin: papeis.includes("admin"),
    }),
    [carregando, carregandoPapeis, session, user, papeis],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider />");
  return ctx;
}
