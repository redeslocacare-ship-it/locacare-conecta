import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";

/**
 * Layout do dashboard administrativo (Horizontal).
 *
 * - Usa AdminHeader para navegação horizontal.
 * - Conteúdo centralizado em container.
 */
export function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Simple admin check by email for MVP
      const isAdmin = session.user.email === "admin@locacare.com.br";
      
      if (!isAdmin) {
        toast.error("Acesso negado. Apenas administradores.");
        navigate("/app");
      }
    };
    checkAdmin();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col w-full bg-muted/5">
      <AdminHeader />
      <main className="flex-1 container py-6 md:py-8 animate-in fade-in-50">
        <Outlet />
      </main>
    </div>
  );
}
