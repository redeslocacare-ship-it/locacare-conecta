import React from "react";

/**
 * Rodapé do site público.
 */
export function PublicFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-semibold">LocaCare</p>
            <p className="mt-2 text-sm text-muted-foreground">Atendemos Goiânia e região metropolitana.</p>
          </div>
          <div>
            <p className="font-semibold">Contato</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                WhatsApp: <a className="underline-offset-4 hover:underline" href="tel:+5562936180658">(62) 93618-0658</a>
              </li>
              <li>
                E-mail: <a className="underline-offset-4 hover:underline" href="mailto:contato@locacare.com.br">contato@locacare.com.br</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Políticas</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Privacidade (resumo)</li>
              <li>Termos de uso (resumo)</li>
              <li>Trocas e suporte</li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">© {new Date().getFullYear()} LocaCare. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
