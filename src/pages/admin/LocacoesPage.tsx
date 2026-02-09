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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, Link as LinkIcon, Plus, Search, CheckCircle, Clock, Truck, Activity, XCircle, DollarSign, Calendar } from "lucide-react";

/**
 * Módulo: Locações
 *
 * Funcionalidades:
 * - Lista em Tabela (Data Grid)
 * - Filtros por status e busca
 * - Cadastro completo
 * - Atualização de status
 * - Anexo de comprovante (Link)
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

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  lead: { color: "bg-orange-100 text-orange-700 hover:bg-orange-200", icon: Activity, label: "Lead (Novo)" },
  orcamento_enviado: { color: "bg-blue-100 text-blue-700 hover:bg-blue-200", icon: FileText, label: "Orçamento Enviado" },
  aguardando_pagamento: { color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200", icon: DollarSign, label: "Aguardando Pagto" },
  confirmada: { color: "bg-green-100 text-green-700 hover:bg-green-200", icon: CheckCircle, label: "Confirmada" },
  em_entrega: { color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200", icon: Truck, label: "Em Entrega" },
  em_uso: { color: "bg-purple-100 text-purple-700 hover:bg-purple-200", icon: Armchair, label: "Em Uso" },
  em_coleta: { color: "bg-pink-100 text-pink-700 hover:bg-pink-200", icon: Truck, label: "Em Coleta" },
  finalizada: { color: "bg-gray-100 text-gray-700 hover:bg-gray-200", icon: CheckCircle, label: "Finalizada" },
  cancelada: { color: "bg-red-100 text-red-700 hover:bg-red-200", icon: XCircle, label: "Cancelada" },
};
// Fallback icon for missing imports (Armchair might be missing if I didn't import it)
import { Armchair } from "lucide-react";

const schema = z.object({
  cliente_id: z.string().uuid("Selecione um cliente"),
  plano_locacao_id: z.string().uuid().optional().or(z.literal("")),
  poltrona_id: z.string().uuid().optional().or(z.literal("")),
  status_locacao: z.enum(statusLocacao),
  origem_lead: z.enum(["site", "whatsapp", "indicacao", "clinica_parceira", "outro"]),
  data_inicio_prevista: z.string().optional().or(z.literal("")),
  data_fim_prevista: z.string().optional().or(z.literal("")),
  observacoes: z.string().trim().max(2000).optional().or(z.literal("")),
  valor_total: z.string().optional().or(z.literal("")),
  comprovante_url: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  codigo_indicacao: z.string().optional().or(z.literal("")),
});

type Valores = z.infer<typeof schema>;

export default function LocacoesPage() {
  const [status, setStatus] = useState<(typeof statusLocacao)[number] | "all">("all");
  const [aberto, setAberto] = useState(false);
  const [comprovanteModal, setComprovanteModal] = useState<{ id: string, url: string | null } | null>(null);
  const qc = useQueryClient();

  const { data: parceiros = [] } = useQuery({
    queryKey: ["admin", "parceiros", "select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id,nome,email,codigo_indicacao")
        .not("codigo_indicacao", "is", null)
        .order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

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

  const { data: locacoes = [], isLoading } = useQuery({
    queryKey: ["admin", "locacoes", status],
    queryFn: async () => {
      let q = supabase
        .from("locacoes")
        .select(
          "id,status_locacao,origem_lead,data_inicio_prevista,data_fim_prevista,comprovante_url,valor_total,criado_em,clientes(nome_completo,telefone_whatsapp),planos_locacao(nome_plano),poltronas(nome)",
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
      valor_total: "",
      comprovante_url: "",
      codigo_indicacao: "",
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
        valor_total: values.valor_total ? parseFloat(values.valor_total) : 0,
        comprovante_url: values.comprovante_url?.trim() ? values.comprovante_url.trim() : null,
        codigo_indicacao_usado: values.codigo_indicacao || null,
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

  const salvarComprovante = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase.from("locacoes").update({ comprovante_url: url }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comprovante salvo.");
      setComprovanteModal(null);
      qc.invalidateQueries({ queryKey: ["admin", "locacoes"] });
    },
  });

  const statusOptions = useMemo(() => [{ label: "Todos", value: "all" }, ...statusLocacao.map((s) => ({ label: s, value: s }))], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locações</h1>
          <p className="text-muted-foreground">
            Gerencie reservas, contratos e logística.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-[200px]">
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
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nova Locação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Locação</DialogTitle>
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
                              <SelectValue placeholder="Selecione um cliente" />
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
                    name="codigo_indicacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parceiro Indicador</FormLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Opcional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {parceiros.map((p: any) => (
                              <SelectItem key={p.id} value={p.codigo_indicacao}>
                                {p.nome} ({p.codigo_indicacao})
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
                        <FormLabel>Status Inicial</FormLabel>
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
                    name="valor_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comprovante_url"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Link do Comprovante (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
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
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setAberto(false)}>Cancelar</Button>
                    <Button type="submit" disabled={criar.isPending}>
                      {criar.isPending ? "Salvando..." : "Criar Locação"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Datas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Comprovante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell>
               </TableRow>
            ) : locacoes.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhuma locação encontrada.</TableCell>
               </TableRow>
            ) : (
              locacoes.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{l.clientes?.nome_completo || "Sem cliente"}</span>
                      <span className="text-xs text-muted-foreground">{l.clientes?.telefone_whatsapp}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <span>Plano: {l.planos_locacao?.nome_plano || "—"}</span>
                      <span className="text-muted-foreground">Poltrona: {l.poltronas?.nome || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-muted-foreground">
                      <span>Início: {l.data_inicio_prevista ? new Date(l.data_inicio_prevista).toLocaleDateString("pt-BR") : "—"}</span>
                      <span>Fim: {l.data_fim_prevista ? new Date(l.data_fim_prevista).toLocaleDateString("pt-BR") : "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Select
                          value={l.status_locacao}
                          onValueChange={(v) => {
                              atualizarStatus.mutate({ id: l.id, novoStatus: v as any });
                              if (v === "confirmada") {
                                  toast.success("Pagamento confirmado! Comissão liberada.");
                              }
                          }}
                        >
                          <SelectTrigger className={`h-8 w-auto min-w-[140px] border-0 ring-1 ring-inset ring-gray-200 ${statusConfig[l.status_locacao]?.color || "bg-gray-100"}`}>
                             <div className="flex items-center gap-2">
                                {statusConfig[l.status_locacao]?.icon && React.createElement(statusConfig[l.status_locacao].icon, { className: "h-3.5 w-3.5" })}
                                <span className="text-xs font-medium truncate">{statusConfig[l.status_locacao]?.label || l.status_locacao}</span>
                             </div>
                          </SelectTrigger>
                          <SelectContent>
                            {statusLocacao.map((s) => {
                              const config = statusConfig[s] || { label: s, color: "", icon: null };
                              return (
                                <SelectItem key={s} value={s}>
                                  <div className="flex items-center gap-2">
                                    {config.icon && React.createElement(config.icon, { className: "h-3.5 w-3.5 text-muted-foreground" })}
                                    <span>{config.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    {l.comprovante_url ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={l.comprovante_url} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="h-4 w-4 mr-1" /> Ver
                        </a>
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground"
                        onClick={() => setComprovanteModal({ id: l.id, url: "" })}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal para Adicionar Comprovante */}
      <Dialog open={!!comprovanteModal} onOpenChange={(open) => !open && setComprovanteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Comprovante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Link do Arquivo (Drive, PDF, Imagem)</label>
              <Input 
                placeholder="https://..." 
                value={comprovanteModal?.url || ""} 
                onChange={(e) => setComprovanteModal(prev => prev ? { ...prev, url: e.target.value } : null)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                if (comprovanteModal?.id && comprovanteModal?.url) {
                  salvarComprovante.mutate({ id: comprovanteModal.id, url: comprovanteModal.url });
                }
              }}
            >
              Salvar Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
