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
    <div className="fixed bottom-6 right-6 z-50">
      <Button asChild variant="default" size="icon" className="h-14 w-14 rounded-full shadow-xl shadow-green-500/30 bg-green-500 hover:bg-green-600 border-none animate-bounce-slow relative group">
        <a href={href} target="_blank" rel="noreferrer" aria-label="Chamar no WhatsApp">
          <span className="absolute -inset-2 rounded-full bg-green-500 opacity-20 group-hover:animate-ping"></span>
          <MessageCircle className="h-7 w-7 text-white" />
        </a>
      </Button>
    </div>
  );
}
