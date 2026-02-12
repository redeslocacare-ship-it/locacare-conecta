import React, { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { leadSchema, type LeadFormValues } from "@/lib/validacoes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Formulário de pré-reserva (lead).
 *
 * Regras:
 * - Cria um registro em `clientes`.
 * - Em seguida cria um registro em `locacoes` com status "lead".
 * - Exibe feedback amigável.
 */
export function PreReservaForm({ id }: { id: string }) {
  const [enviando, setEnviando] = useState(false);

  // Busca planos ativos
  const { data: planos = [] } = useQuery({
    queryKey: ["public", "planos_locacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_locacao")
        .select("id, nome_plano, dias_duracao, preco_base")
        .eq("ativo", true)
        .order("preco_base", { ascending: true });
      
      if (error) {
        console.error("Erro ao carregar planos:", error);
        return [];
      }
      return data;
    },
  });

  const tiposCirurgia = useMemo(
    () => [
      "Abdominoplastia",
      "Mamoplastia",
      "Lipoescultura",
      "Cirurgia ortopédica",
      "Recuperação de idoso/mobilidade reduzida",
      "Outro",
    ],
    [],
  );

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome_completo: "",
      telefone_whatsapp: "",
      email: "",
      cidade: "Goiânia",
      bairro: "",
      tipo_cirurgia: "",
      data_inicio_desejada: "",
      mensagem: "",
      codigo_indicacao: "",
      plano_locacao_id: "",
    },
  });

  async function onSubmit(values: LeadFormValues) {
    setEnviando(true);

    try {
      // Normaliza e-mail opcional
      const email = values.email?.trim() ? values.email.trim() : null;

      // 1) Cria cliente
      const { data: cliente, error: erroCliente } = await supabase
        .from("clientes")
        .insert({
          nome_completo: values.nome_completo.trim(),
          telefone_whatsapp: values.telefone_whatsapp.trim(),
          email,
          cidade: values.cidade.trim(),
          bairro: values.bairro?.trim() || null,
          observacoes: [
            values.tipo_cirurgia?.trim() ? `Tipo de cirurgia: ${values.tipo_cirurgia.trim()}` : null,
            values.mensagem?.trim() ? `Mensagem: ${values.mensagem.trim()}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        })
        .select("id")
        .single();

      if (erroCliente) throw erroCliente;

      // 2) Cria locação em status inicial (lead)
      const { error: erroLocacao } = await supabase.from("locacoes").insert({
        cliente_id: cliente.id,
        origem_lead: "site",
        status_locacao: "lead",
        data_inicio_prevista: values.data_inicio_desejada?.trim() ? values.data_inicio_desejada : null,
        codigo_indicacao_usado: values.codigo_indicacao?.trim() || null,
        plano_locacao_id: values.plano_locacao_id || null,
      });

      if (erroLocacao) throw erroLocacao;

      toast.success("Pedido enviado! Em breve a LocaCare entra em contato.");
      form.reset();
    } catch (e: any) {
      // Não logamos dados sensíveis; apenas mensagem genérica
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section id={id} className="scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Contato / Pré-reserva</CardTitle>
            <CardDescription>Preencha os dados para receber um orçamento e disponibilidade.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nome_completo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Maria Aparecida" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone_whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input placeholder="(62) 9xxxx-xxxx" inputMode="tel" autoComplete="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="voce@exemplo.com" inputMode="email" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Goiânia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Setor Bueno" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_cirurgia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de cirurgia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposCirurgia.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plano_locacao_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Interesse</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {planos.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome_plano} - R$ {Number(p.preco_base).toFixed(2)} ({p.dias_duracao} dias)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_inicio_desejada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da cirurgia / início desejado</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigo_indicacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Indicação (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Cupom ou código" 
                          {...field} 
                          className="border-dashed border-primary/50 bg-primary/5 focus:border-solid focus:bg-background transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mensagem"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Mensagem</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Conte um pouco sobre sua necessidade (opcional)" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Ao enviar, você autoriza contato da LocaCare para continuidade do atendimento.
                  </p>
                  <Button type="submit" disabled={enviando}>
                    {enviando ? "Enviando…" : "Enviar pré-reserva"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
