import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Botão flutuante de WhatsApp.
 *
 * Requisito: abrir o link wa.me com mensagem pré-preenchida.
 */
export function WhatsAppFloatingButton() {
  const mensagem = "Olá, quero alugar uma poltrona pós-cirúrgica com a LocaCare.";
  const href = `https://wa.me/5562936180658?text=${encodeURIComponent(mensagem)}`;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button asChild variant="default" size="icon" className="rounded-full shadow-lift">
        <a href={href} target="_blank" rel="noreferrer" aria-label="Chamar no WhatsApp">
          <MessageCircle />
        </a>
      </Button>
    </div>
  );
}
