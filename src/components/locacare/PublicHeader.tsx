import React from "react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { Menu, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/locacare/BrandLogo";

/**
 * Cabeçalho do site público (mobile-first).
 *
 * Melhorias:
 * - Usa a logomarca oficial
 * - Menu móvel em Drawer (Sheet)
 * - CTAs sempre acessíveis no celular
 */
export function PublicHeader({ onSolicitarOrcamento }: { onSolicitarOrcamento: () => void }) {
  const mensagem = "Olá, quero alugar uma poltrona pós-cirúrgica com a LocaCare.";
  const whatsappHref = `https://wa.me/5562936180658?text=${encodeURIComponent(mensagem)}`;

  const links = [
    { label: "Benefícios", href: "#beneficios" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "FAQ", href: "#faq" },
    { label: "Pré-reserva", href: "#contato" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="min-w-0">
          <BrandLogo className="hover-lift" compact />
        </div>

        {/* Desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a key={l.href} className="text-sm text-muted-foreground hover:text-foreground" href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* CTA WhatsApp compacto (mobile) */}
          <Button asChild variant="soft" size="icon" className="sm:hidden hover-lift" aria-label="Chamar no WhatsApp">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle />
            </a>
          </Button>

          <Button asChild variant="soft" className="hidden sm:inline-flex hover-lift">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              Chamar no WhatsApp
            </a>
          </Button>

          <Button variant="default" onClick={onSolicitarOrcamento} className="hidden sm:inline-flex hover-lift">
            Solicitar orçamento
          </Button>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden hover-lift" aria-label="Abrir menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[380px]">
              <SheetHeader>
                <SheetTitle>
                  <span className="sr-only">Menu</span>
                  LocaCare
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-2">
                {links.map((l) => (
                  <a
                    key={l.href}
                    className="block rounded-lg border bg-background px-4 py-3 text-sm hover:bg-accent hover-lift"
                    href={l.href}
                  >
                    {l.label}
                  </a>
                ))}
              </div>

              <div className="mt-6 grid gap-2">
                <Button asChild variant="default" className="hover-lift">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    Chamar no WhatsApp
                  </a>
                </Button>
                <Button variant="hero" onClick={onSolicitarOrcamento} className="hover-lift">
                  Solicitar orçamento
                </Button>

                <Button asChild variant="link" className="justify-start">
                  <RouterNavLink to="/admin">Acessar área administrativa</RouterNavLink>
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Admin (desktop) */}
          <Button asChild variant="link" className="hidden lg:inline-flex">
            <RouterNavLink to="/admin">Admin</RouterNavLink>
          </Button>
        </div>
      </div>

      {/* Barra de CTA fixa no mobile (melhor conversão) */}
      <div className="border-t bg-background/70 backdrop-blur md:hidden">
        <div className="container flex items-center gap-2 py-2">
          <Button asChild className="flex-1 hover-lift">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </Button>
          <Button variant="hero" className="flex-1 hover-lift" onClick={onSolicitarOrcamento}>
            Orçamento
          </Button>
        </div>
      </div>
    </header>
  );
}
