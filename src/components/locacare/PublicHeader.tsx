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
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        
        {/* Logo (Esquerda) */}
        <div className="flex-shrink-0">
          <BrandLogo 
            size="2xl" 
            className="hover-lift drop-shadow-[0_0_20px_rgba(20,184,166,0.6)] transition-all duration-500 hover:drop-shadow-[0_0_30px_rgba(20,184,166,0.8)] hover:scale-105" 
          />
        </div>

        {/* Desktop Nav (Centro) */}
        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a 
              key={l.href} 
              className="text-base font-semibold tracking-wide text-muted-foreground transition-all hover:text-primary relative group py-2" 
              href={l.href}
            >
              {l.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </nav>

        {/* Ações (Direita) */}
        <div className="flex items-center gap-6">
          <Button variant="ghost" asChild className="hidden md:inline-flex text-base hover:bg-primary/5 hover:text-primary transition-colors">
             <RouterNavLink to="/login">Área do Parceiro</RouterNavLink>
          </Button>

          <Button 
            variant="hero" 
            onClick={onSolicitarOrcamento} 
            className="hidden md:inline-flex shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all duration-300 animate-pulse-slow text-base px-6 h-12"
          >
            Solicitar Orçamento
          </Button>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-primary/20 hover:bg-primary/5">
                  <Menu className="h-6 w-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] border-l-primary/10">
                <SheetHeader className="text-left border-b pb-4 mb-4">
                  <BrandLogo size="lg" />
                </SheetHeader>

                <div className="flex flex-col gap-2">
                  {links.map((l) => (
                    <a
                      key={l.href}
                      className="block rounded-md px-4 py-3 text-base font-medium text-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors"
                      href={l.href}
                    >
                      {l.label}
                    </a>
                  ))}
                  <RouterNavLink 
                    to="/login"
                    className="block rounded-md px-4 py-3 text-base font-medium text-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    Área do Parceiro
                  </RouterNavLink>
                </div>

                <div className="mt-8 space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start gap-2 border-green-500/20 text-green-600 hover:bg-green-50 hover:text-green-700">
                    <a href={whatsappHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                  <Button variant="hero" onClick={onSolicitarOrcamento} className="w-full shadow-md">
                    Solicitar orçamento
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
