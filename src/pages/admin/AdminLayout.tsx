import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

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

  async function sair() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
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
                <div className="leading-tight">
                  <p className="text-sm font-semibold">LocaCare</p>
                  <p className="text-xs text-muted-foreground">Painel administrativo</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="link" className="hidden sm:inline-flex">
                  <a href="/" rel="noreferrer">
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
