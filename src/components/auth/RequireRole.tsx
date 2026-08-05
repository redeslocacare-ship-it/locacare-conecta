import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/contexts/AuthContext";

/**
 * Protege uma rota exigindo um papel específico.
 *
 * Isto é apenas navegação: mesmo que alguém force o componente pelo devtools,
 * as policies de RLS no Supabase impedem a leitura/escrita dos dados.
 */
export function RequireRole({ role, children }: { role: AppRole; children: React.ReactNode }) {
  const { carregando, user, papeis } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!papeis.includes(role)) {
    // Autenticado, mas sem permissão: manda para a área que lhe cabe.
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
