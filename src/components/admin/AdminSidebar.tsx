import * as React from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Armchair, Tags, ClipboardList, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { BrandLogo } from "@/components/locacare/BrandLogo";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Sidebar do dashboard administrativo.
 *
 * Regras de UX:
 * - No mobile, vira um menu em “drawer”.
 * - No desktop, pode colapsar para um modo “mini” (somente ícones).
 * - Mantém a navegação sempre acessível.
 */

type ItemSidebar = {
  titulo: string;
  url: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const itens: ItemSidebar[] = [
  { titulo: "Visão geral", url: "/admin", icon: LayoutDashboard, end: true },
  { titulo: "Clientes", url: "/admin/clientes", icon: Users, end: false },
  { titulo: "Poltronas", url: "/admin/poltronas", icon: Armchair, end: false },
  { titulo: "Planos", url: "/admin/planos", icon: Tags, end: false },
  { titulo: "Locações", url: "/admin/locacoes", icon: ClipboardList, end: false },
  { titulo: "Conteúdos", url: "/admin/conteudos", icon: FileText, end: false },
];

export function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();

  const collapsed = state === "collapsed";
  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-3 pt-3">
          <div className="rounded-2xl border bg-background/30 p-3 shadow-soft">
            <BrandLogo compact className="justify-center" />
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itens.map((item) => {
                const ativo = item.end ? currentPath === item.url : currentPath.startsWith(item.url);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={ativo} tooltip={item.titulo}>
                      <NavLink to={item.url} end={item.end} className="flex items-center gap-2" activeClassName="">
                        <Icon />
                        {!collapsed && <span>{item.titulo}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
