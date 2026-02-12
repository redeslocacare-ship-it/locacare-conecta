import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Armchair, 
  Tags, 
  ClipboardList, 
  FileText, 
  LogOut, 
  Menu,
  DollarSign
} from "lucide-react";
import { BrandLogo } from "@/components/locacare/BrandLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  { titulo: "Parceiros", url: "/admin/usuarios", icon: Users, end: false },
  { titulo: "Saques", url: "/admin/saques", icon: DollarSign, end: false },
  { titulo: "Conteúdos", url: "/admin/conteudos", icon: FileText, end: false },
  { titulo: "Contratos", url: "/admin/contratos", icon: FileText, end: false },
];

export function AdminHeader() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function sair() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo e Nome */}
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2">
            <BrandLogo compact />
            <div className="hidden md:block leading-tight">
              <p className="text-sm font-semibold">LocaCare Admin</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Painel de Gestão</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {itens.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.titulo}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/app">
               Voltar ao App
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" onClick={sair} title="Sair">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sair</span>
          </Button>

          {/* Mobile Menu Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <SheetHeader className="px-1 text-left">
                <SheetTitle>Menu Admin</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-4">
                {itens.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.titulo}
                    </NavLink>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
