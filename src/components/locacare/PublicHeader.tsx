import React from "react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/locacare/BrandLogo";

/**
 * Cabeçalho do site público — clean / white luxury.
 *
 * - Desktop: logo + navegação central + CTA discreto
 * - Mobile: apenas a marca (a navegação vive na MobileTabBar, como um app)
 */
export function PublicHeader({ onSolicitarOrcamento }: { onSolicitarOrcamento: () => void }) {
  const links = [
    { label: "Benefícios", href: "#beneficios" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Planos", href: "#planos" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between md:h-20">
        <BrandLogo size="default" className="transition-opacity hover:opacity-80" />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative py-2 text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
              <span className="absolute bottom-0 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex">
            <RouterNavLink to="/login">Área do Parceiro</RouterNavLink>
          </Button>

          <Button
            onClick={onSolicitarOrcamento}
            className="hidden rounded-full px-6 md:inline-flex"
          >
            Solicitar orçamento
          </Button>

          {/* Mobile: acesso discreto à área do parceiro */}
          <Button variant="outline" size="sm" asChild className="rounded-full md:hidden">
            <RouterNavLink to="/login">Entrar</RouterNavLink>
          </Button>
        </div>
      </div>
    </header>
  );
}
