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
import { Textarea } from "@/components/ui/textarea";

/**
 * Módulo: Clientes
 *
 * MVP:
 * - Listagem com filtro
 * - Cadastro rápido
 */

const schema = z.object({
  nome_completo: z.string().trim().min(2, "Informe o nome").max(100),
  telefone_whatsapp: z.string().trim().min(8, "Informe o WhatsApp").max(20),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  bairro: z.string().trim().max(120).optional().or(z.literal("")),
});

type Valores = z.infer<typeof schema>;

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileText, Link as LinkIcon, Plus, Search, Pencil, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ClientesPage() {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: clientes = [] } = useQuery({
    queryKey: ["admin", "clientes", busca],
    queryFn: async () => {
      let q = supabase.from("clientes").select("id,nome_completo,telefone_whatsapp,email,cidade,bairro,criado_em").order("criado_em", { ascending: false });

      if (busca.trim()) {
        const term = `%${busca.trim()}%`;
        q = q.or(`nome_completo.ilike.${term},telefone_whatsapp.ilike.${term},cidade.ilike.${term}`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: historicoLocacoes = [] } = useQuery({
      queryKey: ["admin", "historico_locacoes", clienteExpandido],
      queryFn: async () => {
          if (!clienteExpandido) return [];
          const { data, error } = await supabase
              .from("locacoes")
              .select("id, status_locacao, criado_em, data_inicio_prevista, data_fim_prevista, planos_locacao(nome_plano)")
              .eq("cliente_id", clienteExpandido)
              .order("criado_em", { ascending: false });
          
          if (error) throw error;
          return data;
      },
      enabled: !!clienteExpandido
  });

  const [clienteEditando, setClienteEditando] = useState<any>(null);

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: { nome_completo: "", telefone_whatsapp: "", email: "", cidade: "Goiânia", bairro: "" },
  });

  React.useEffect(() => {
    if (clienteEditando) {
      form.reset({
        nome_completo: clienteEditando.nome_completo,
        telefone_whatsapp: clienteEditando.telefone_whatsapp,
        email: clienteEditando.email || "",
        cidade: clienteEditando.cidade,
        bairro: clienteEditando.bairro || "",
      });
    } else {
      form.reset({ nome_completo: "", telefone_whatsapp: "", email: "", cidade: "Goiânia", bairro: "" });
    }
  }, [clienteEditando, form]);

  const criarOuEditar = useMutation({
    mutationFn: async (values: Valores) => {
      if (clienteEditando) {
        const { error } = await supabase.from("clientes").update({
          nome_completo: values.nome_completo,
          telefone_whatsapp: values.telefone_whatsapp,
          email: values.email?.trim() ? values.email.trim() : null,
          cidade: values.cidade,
          bairro: values.bairro?.trim() ? values.bairro.trim() : null,
        }).eq("id", clienteEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert({
          nome_completo: values.nome_completo,
          telefone_whatsapp: values.telefone_whatsapp,
          email: values.email?.trim() ? values.email.trim() : null,
          cidade: values.cidade,
          bairro: values.bairro?.trim() ? values.bairro.trim() : null,
        });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(clienteEditando ? "Cliente atualizado." : "Cliente cadastrado.");
      setAberto(false);
      setClienteEditando(null);
      form.reset();
      await qc.invalidateQueries({ queryKey: ["admin", "clientes"] });
    },
    onError: () => toast.error("Não foi possível salvar o cliente."),
  });

  const excluirCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Cliente excluído.");
      await qc.invalidateQueries({ queryKey: ["admin", "clientes"] });
    },
    onError: () => toast.error("Erro ao excluir. Verifique se existem locações vinculadas."),
  });

  const total = useMemo(() => clientes.length, [clientes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl">Clientes</h1>
          <p className="mt-2 text-sm text-muted-foreground">Total: {total}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, telefone ou cidade" />

          <Dialog open={aberto} onOpenChange={(open) => {
            setAberto(open);
            if (!open) setClienteEditando(null);
          }}>
            <DialogTrigger asChild>
              <Button variant="default">Novo cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{clienteEditando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => criarOuEditar.mutate(v))} className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nome_completo"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input inputMode="tel" {...field} />
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
                          <Input inputMode="email" {...field} />
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
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" disabled={criarOuEditar.isPending}>
                      {criarOuEditar.isPending ? "Salvando…" : "Salvar"}
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
            {clientes.map((c: any) => (
              <div key={c.id} className="rounded-lg border bg-background overflow-hidden">
                <div 
                    className="p-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/50"
                >
                    <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setClienteExpandido(clienteExpandido === c.id ? null : c.id)}
                    >
                        <div className="flex items-center gap-2">
                            <p className="font-medium">{c.nome_completo}</p>
                            {clienteExpandido === c.id ? <Badge variant="outline">Detalhes</Badge> : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {c.telefone_whatsapp} {c.email ? `• ${c.email}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {c.cidade} {c.bairro ? `• ${c.bairro}` : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <div className="text-xs text-muted-foreground whitespace-nowrap mr-2">
                             {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                        </div>
                        
                        <Button variant="ghost" size="icon" onClick={() => {
                            setClienteEditando(c);
                            setAberto(true);
                        }}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tem certeza que deseja excluir <b>{c.nome_completo}</b>? Isso também apagará o histórico e pode afetar locações existentes.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => excluirCliente.mutate(c.id)} className="bg-destructive hover:bg-destructive/90">
                                        Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                {clienteExpandido === c.id && (
                    <div className="bg-muted/20 p-4 border-t space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Histórico de Locações</h4>
                                {historicoLocacoes.length > 0 ? (
                                    <div className="space-y-2">
                                        {historicoLocacoes.map((h: any) => (
                                            <div key={h.id} className="text-sm bg-background p-2 rounded border">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">{h.planos_locacao?.nome_plano || "Plano Personalizado"}</span>
                                                    <Badge variant="secondary">{h.status_locacao}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(h.data_inicio_prevista).toLocaleDateString()} até {new Date(h.data_fim_prevista).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Nenhuma locação registrada.</p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Observações (Interno)</h4>
                                <Textarea 
                                    placeholder="Adicione notas sobre o cliente..." 
                                    className="resize-none" 
                                    rows={4}
                                    defaultValue="Cliente preferencial. Gosta de contato via WhatsApp."
                                />
                                <Button size="sm" variant="outline" className="mt-2 w-full">Salvar Observação</Button>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            ))}
            {clientes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
