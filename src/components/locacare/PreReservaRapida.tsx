import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/**
 * Pré-reserva rápida (2 campos): nome e sobrenome + telefone.
 *
 * Segurança: envia pela mesma RPC `criar_pre_reserva`; o banco valida
 * nome (>= 3 chars) e telefone (10–13 dígitos) e grava o lead sem
 * conceder nenhum privilégio direto ao visitante anônimo.
 */

const rapidaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe seu nome e sobrenome")
    .max(100, "Nome muito longo")
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome"),
  telefone: z
    .string()
    .trim()
    .refine((v) => {
      const digitos = v.replace(/\D/g, "");
      return digitos.length >= 10 && digitos.length <= 13;
    }, "Informe um telefone válido com DDD"),
});

type RapidaValues = z.infer<typeof rapidaSchema>;

/** Máscara leve: (62) 99999-9999 conforme digita. */
function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function PreReservaRapida({ className }: { className?: string }) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const reduzir = useReducedMotion();

  const form = useForm<RapidaValues>({
    resolver: zodResolver(rapidaSchema),
    defaultValues: { nome: "", telefone: "" },
  });

  async function onSubmit(values: RapidaValues) {
    setEnviando(true);
    try {
      // `cidade` é NOT NULL em `clientes`; a operação hoje é só em Goiânia.
      const { error } = await supabase.rpc("criar_pre_reserva", {
        p_nome: values.nome.trim(),
        p_telefone: values.telefone.trim(),
        p_cidade: "Goiânia",
        p_observacoes: "Origem: pré-reserva rápida (site)",
      });
      if (error) throw error;

      setEnviado(true);
      form.reset();
    } catch {
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={className}>
      {/* Modal de confirmação */}
      <Dialog open={enviado} onOpenChange={setEnviado}>
        <DialogContent className="max-w-sm rounded-3xl border-gold/30 p-8 text-center">
          <motion.span
            initial={reduzir ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
            className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-mint/15 text-mint"
          >
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
          </motion.span>
          <h3 className="mt-2 font-display text-2xl">Pré-reserva recebida!</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Um consultor já vai entrar em contato pelo telefone informado para confirmar datas e disponibilidade.
          </p>
          <Button className="mt-4 h-11 w-full rounded-full" onClick={() => setEnviado(false)}>
            Combinado!
          </Button>
        </DialogContent>
      </Dialog>

      <div className="relative rounded-3xl border border-gold/30 bg-card/95 p-6 shadow-lift backdrop-blur-xl md:p-8">
        {/* brilho decorativo no topo do card */}
        <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" strokeWidth={1.75} />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Pré-reserva em 30 segundos</p>
        </div>
        <h3 className="mt-3 font-display text-2xl leading-snug">Garanta sua poltrona</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Só o essencial: seu nome e um telefone. A gente cuida do resto.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 grid gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome e sobrenome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex.: Maria Aparecida"
                      autoComplete="name"
                      className="h-12 rounded-2xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone para contato</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(62) 90000-0000"
                      inputMode="tel"
                      autoComplete="tel"
                      className="h-12 rounded-2xl"
                      {...field}
                      onChange={(e) => field.onChange(formatarTelefone(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={enviando} size="lg" className="group mt-1 h-12 w-full rounded-full">
              {enviando ? "Enviando…" : "Quero minha pré-reserva"}
              {!enviando && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </Button>

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Sem compromisso. Ao enviar, você autoriza o contato da LocaCare pelo WhatsApp.
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
