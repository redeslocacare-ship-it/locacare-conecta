import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Componente de proteção de rotas.
 *
 * - Se estiver carregando sessão, mostramos um estado simples.
 * - Se não houver usuário autenticado, redireciona para /auth.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { carregando, user } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
