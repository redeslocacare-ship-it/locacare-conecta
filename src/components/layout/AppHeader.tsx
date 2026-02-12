import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { BrandLogo } from "@/components/locacare/BrandLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function AppHeader({ className }: { className?: string }) {
  const navigate = useNavigate();

  async function sair() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className={cn("sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo compact />
            <div className="leading-tight">
              <p className="text-sm font-semibold">LocaCare Conecta</p>
              <p className="text-xs text-muted-foreground">Painel operacional</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  isActive && "bg-accent text-foreground",
                )
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  isActive && "bg-accent text-foreground",
                )
              }
            >
              Admin
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <a href="/site" rel="noreferrer">
              Site
            </a>
          </Button>
          <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

