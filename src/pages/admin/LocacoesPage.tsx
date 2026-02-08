import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * Módulo: Locações
 *
 * MVP:
 * - Lista com filtro por status
 * - Cadastro (vincula cliente + plano + poltrona)
 * - Atualização de status em lote simples
 */

const statusLocacao = [
  "lead",
  "orcamento_enviado",
  "aguardando_pagamento",
  "confirmada",
  "em_entrega",
  "em_uso",
  "em_coleta",
  "finalizada",
  "cancelada",
] as const;

const schema = z.object({
  cliente_id: z.string().uuid("Selecione um cliente"),
  plano_locacao_id: z.string().uuid().optional().or(z.literal("")),
  poltrona_id: z.string().uuid().optional().or(z.literal("")),
  status_locacao: z.enum(statusLocacao),
  origem_lead: z.enum(["site", "whatsapp", "indicacao", "clinica_parceira", "outro"]),
  data_inicio_prevista: z.string().optional().or(z.literal("")),
  data_fim_prevista: z.string().optional().or(z.literal("")),
  observacoes: z.string().trim().max(2000).optional().or(z.literal("")),
});

type Valores = z.infer<typeof schema>;

export default function LocacoesPage() {
  // Status do filtro: ou "all" ("Todos"), ou um dos estados do workflow.
  const [status, setStatus] = useState<(typeof statusLocacao)[number] | "all">("all");
  const [aberto, setAberto] = useState(false);
  const qc = useQueryClient();

  const { data: clientes = [] } = useQuery({
    queryKey: ["admin", "clientes", "select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id,nome_completo")
        .order("nome_completo", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: planos = [] } = useQuery({
    queryKey: ["admin", "planos", "select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_locacao")
        .select("id,nome_plano,dias_duracao,preco_base")
        .order("dias_duracao", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: poltronas = [] } = useQuery({
    queryKey: ["admin", "poltronas", "select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poltronas")
        .select("id,nome,status")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: locacoes = [] } = useQuery({
    queryKey: ["admin", "locacoes", status],
    queryFn: async () => {
      let q = supabase
        .from("locacoes")
        .select(
          "id,status_locacao,origem_lead,data_inicio_prevista,data_fim_prevista,criado_em,clientes(nome_completo,telefone_whatsapp),planos_locacao(nome_plano),poltronas(nome)",
        )
        .order("criado_em", { ascending: false })
        .limit(100);

      if (status && status !== "all") q = q.eq("status_locacao", status);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente_id: "",
      plano_locacao_id: "",
      poltrona_id: "",
      status_locacao: "lead",
      origem_lead: "whatsapp",
      data_inicio_prevista: "",
      data_fim_prevista: "",
      observacoes: "",
    },
  });

  const criar = useMutation({
    mutationFn: async (values: Valores) => {
      const { error } = await supabase.from("locacoes").insert({
        cliente_id: values.cliente_id,
        plano_locacao_id: values.plano_locacao_id || null,
        poltrona_id: values.poltrona_id || null,
        status_locacao: values.status_locacao,
        origem_lead: values.origem_lead,
        data_inicio_prevista: values.data_inicio_prevista || null,
        data_fim_prevista: values.data_fim_prevista || null,
        observacoes: values.observacoes?.trim() ? values.observacoes.trim() : null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Locação criada.");
      setAberto(false);
      form.reset();
      await qc.invalidateQueries({ queryKey: ["admin", "locacoes"] });
    },
    onError: () => toast.error("Não foi possível criar a locação."),
  });

  const atualizarStatus = useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: typeof statusLocacao[number] }) => {
      const { error } = await supabase.from("locacoes").update({ status_locacao: novoStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "locacoes"] });
    },
  });

  const statusOptions = useMemo(() => [{ label: "Todos", value: "all" }, ...statusLocacao.map((s) => ({ label: s, value: s }))], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl">Locações</h1>
          <p className="mt-2 text-sm text-muted-foreground">Workflow: lead → orçamento → pagamento → uso → finalização.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button>Nova locação</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova locação</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => criar.mutate(v))} className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cliente_id"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Cliente</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientes.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome_completo}
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
                        <FormLabel>Plano</FormLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Opcional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {planos.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nome_plano}
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
                    name="poltrona_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poltrona</FormLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Opcional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {poltronas.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nome} ({p.status})
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
                    name="origem_lead"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="site">Site</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="indicacao">Indicação</SelectItem>
                            <SelectItem value="clinica_parceira">Clínica parceira</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status_locacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusLocacao.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
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
                    name="data_inicio_prevista"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início previsto</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_fim_prevista"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim previsto</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Observações internas</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" disabled={criar.isPending}>
                      {criar.isPending ? "Salvando…" : "Salvar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {locacoes.map((l: any) => (
              <div key={l.id} className="rounded-lg border bg-background p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">{l.clientes?.nome_completo ?? "(sem cliente)"}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                        ["confirmada", "em_uso", "finalizada"].includes(l.status_locacao) ? "default" :
                        ["cancelada"].includes(l.status_locacao) ? "destructive" : "secondary"
                    }>
                        {l.status_locacao}
                    </Badge>
                    <Select
                      value={l.status_locacao}
                      onValueChange={(v) => {
                          atualizarStatus.mutate({ id: l.id, novoStatus: v as any });
                          if (v === "confirmada") {
                              toast.success("Pagamento confirmado! Comissão contabilizada para o parceiro.");
                          }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusLocacao.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {l.clientes?.telefone_whatsapp ?? ""} • Origem: {l.origem_lead}
                </p>

                <p className="text-xs text-muted-foreground">
                  Plano: {l.planos_locacao?.nome_plano ?? "—"} • Poltrona: {l.poltronas?.nome ?? "—"}
                </p>

                <p className="text-xs text-muted-foreground">
                  Previsto: {l.data_inicio_prevista ?? "—"} → {l.data_fim_prevista ?? "—"}
                </p>
              </div>
            ))}
            {locacoes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma locação encontrada.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
