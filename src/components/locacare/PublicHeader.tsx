import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Cabeçalho do site público.
 *
 * Foco: conversão e acesso rápido ao orçamento/WhatsApp.
 */
export function PublicHeader({ onSolicitarOrcamento }: { onSolicitarOrcamento: () => void }) {
  const mensagem = "Olá, quero alugar uma poltrona pós-cirúrgica com a LocaCare.";
  const whatsappHref = `https://wa.me/5562936180658?text=${encodeURIComponent(mensagem)}`;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-hero shadow-soft" aria-hidden />
          <div className="leading-tight">
            <p className="font-semibold">LocaCare</p>
            <p className="text-xs text-muted-foreground">Goiânia e região metropolitana</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#beneficios">
            Benefícios
          </a>
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#como-funciona">
            Como funciona
          </a>
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#faq">
            FAQ
          </a>
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#contato">
            Pré-reserva
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="soft" className="hidden sm:inline-flex">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              Chamar no WhatsApp
            </a>
          </Button>
          <Button variant="default" onClick={onSolicitarOrcamento}>
            Solicitar orçamento
          </Button>

          <Button asChild variant="link" className="hidden lg:inline-flex">
            <NavLink to="/admin">Admin</NavLink>
          </Button>
        </div>
      </div>
    </header>
  );
}
