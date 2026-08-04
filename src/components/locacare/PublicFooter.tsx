import React from "react";
import { BrandLogo } from "@/components/locacare/BrandLogo";

/**
 * Rodapé do site público — clean / white luxury.
 * (Telefone removido temporariamente a pedido.)
 */
export function PublicFooter() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Conforto e autonomia no pós-operatório. Atendemos Goiânia e região metropolitana com entrega e instalação.
            </p>
          </div>

          <div>
            <p className="font-display text-lg">Contato</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a className="underline-offset-4 transition-colors hover:text-foreground hover:underline" href="mailto:contato@locacare.com.br">
                  contato@locacare.com.br
                </a>
              </li>
              <li>Goiânia — GO</li>
            </ul>
          </div>

          <div>
            <p className="font-display text-lg">Políticas</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Privacidade (resumo)</li>
              <li>Termos de uso (resumo)</li>
              <li>Trocas e suporte</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} LocaCare. Todos os direitos reservados.</p>
          <p className="text-gold">Cuidando do seu pós-cirúrgico.</p>
        </div>
      </div>
    </footer>
  );
}
