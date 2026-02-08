import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BrandLogo } from "@/components/locacare/BrandLogo";

/**
 * Layout do dashboard administrativo (mobile-first).
 *
 * - Usa Sidebar (shadcn):
 *   - Mobile: drawer (Sheet)
 *   - Desktop: colapsável para modo mini (ícones)
 *
 * Observação:
 * - As permissões (admin/atendimento/logistica) são controladas no banco.
 * - O frontend apenas exige autenticação para acessar a área.
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

  async function sair() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen w-full">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Conteúdo */}
        <SidebarInset>
          <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
              <div className="flex items-center gap-2">
                {/* ÚNICO trigger global (requisito) */}
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <BrandLogo compact />
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">LocaCare Conecta</p>
                    <p className="text-xs text-muted-foreground">Painel administrativo</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="link" className="hidden sm:inline-flex">
                  <a href="/site" rel="noreferrer">
                    Voltar ao site
                  </a>
                </Button>
                <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
                  <LogOut />
                </Button>
              </div>
            </div>
          </header>

          <main className="container py-6 md:py-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
