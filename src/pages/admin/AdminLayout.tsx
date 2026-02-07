import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Users, Armchair, Tags, ClipboardList, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Layout do dashboard administrativo.
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

  const linkBase = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors";
  const linkActive = "bg-sidebar-accent text-sidebar-accent-foreground";
  const linkIdle = "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/70";

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen md:grid-cols-[280px_1fr]">
        <aside className="border-r bg-sidebar text-sidebar-foreground">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
            <div>
              <p className="font-semibold">LocaCare</p>
              <p className="text-xs text-sidebar-foreground/70">Painel administrativo</p>
            </div>
            <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
              <LogOut />
            </Button>
          </div>

          <nav className="p-3 space-y-1">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              <LayoutDashboard className="h-4 w-4" /> Visão geral
            </NavLink>
            <NavLink to="/admin/clientes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
              <Users className="h-4 w-4" /> Clientes
            </NavLink>
            <NavLink to="/admin/poltronas" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
              <Armchair className="h-4 w-4" /> Poltronas
            </NavLink>
            <NavLink to="/admin/planos" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
              <Tags className="h-4 w-4" /> Planos
            </NavLink>
            <NavLink to="/admin/locacoes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
              <ClipboardList className="h-4 w-4" /> Locações
            </NavLink>
            <NavLink
              to="/admin/conteudos"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              <FileText className="h-4 w-4" /> Conteúdos do site
            </NavLink>
          </nav>

          <div className="p-4">
            <div className="rounded-xl border bg-sidebar-accent/40 p-4 text-xs text-sidebar-foreground/80">
              Suporte/contato:
              <div className="mt-2">
                <div>(62) 93618-0658</div>
                <div>contato@locacare.com.br</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-b bg-background">
            <div className="container flex h-14 items-center justify-between">
              <p className="text-sm text-muted-foreground">Gerenciamento interno</p>
              <Button asChild variant="link">
                <a href="/" rel="noreferrer">
                  Voltar ao site
                </a>
              </Button>
            </div>
          </header>

          <main className="container py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
