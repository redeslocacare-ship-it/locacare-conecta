import React from "react";
import { Outlet } from "react-router-dom";
import { AdminHeader } from "@/components/admin/AdminHeader";

/**
 * Layout do dashboard administrativo (Horizontal).
 *
 * O controle de acesso fica no <RequireRole role="admin"> em App.tsx (navegação)
 * e nas policies de RLS do Supabase (autorização de verdade).
 */
export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-muted/5">
      <AdminHeader />
      <main className="flex-1 container py-6 md:py-8 animate-in fade-in-50">
        <Outlet />
      </main>
    </div>
  );
}
