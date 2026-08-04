import React from "react";
import { Home, HeartHandshake, Tags, Send } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Barra de navegação inferior (somente mobile) — sensação de app nativo.
 *
 * - Pílula flutuante com vidro (blur) e sombra suave
 * - Respeita a área segura do iOS (env(safe-area-inset-bottom))
 * - Âncoras para as seções da home
 */
export function MobileTabBar({ onSolicitarOrcamento }: { onSolicitarOrcamento: () => void }) {
  const tabs = [
    { label: "Início", href: "#topo", icon: Home },
    { label: "Benefícios", href: "#beneficios", icon: HeartHandshake },
    { label: "Planos", href: "#planos", icon: Tags },
  ];

  return (
    <nav
      aria-label="Navegação principal (mobile)"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden pb-safe"
    >
      <div className="mx-4 mb-3 flex items-center justify-between gap-1 rounded-3xl border bg-background/85 px-2 py-2 shadow-lift backdrop-blur-xl">
        {tabs.map((t) => (
          <a
            key={t.href}
            href={t.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2",
              "text-[11px] font-medium text-muted-foreground transition-colors",
              "active:scale-95 active:bg-secondary",
            )}
          >
            <t.icon className="h-5 w-5" strokeWidth={1.75} />
            {t.label}
          </a>
        ))}

        <button
          type="button"
          onClick={onSolicitarOrcamento}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2",
            "bg-primary text-[11px] font-semibold text-primary-foreground shadow-soft",
            "transition-transform active:scale-95",
          )}
        >
          <Send className="h-5 w-5" strokeWidth={1.75} />
          Orçamento
        </button>
      </div>
    </nav>
  );
}
