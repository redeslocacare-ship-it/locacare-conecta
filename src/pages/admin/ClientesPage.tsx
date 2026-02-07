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

export default function ClientesPage() {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const qc = useQueryClient();

  const { data: clientes = [] } = useQuery({
    queryKey: ["admin", "clientes", busca],
    queryFn: async () => {
      let q = supabase.from("clientes").select("id,nome_completo,telefone_whatsapp,email,cidade,bairro,criado_em").order("criado_em", { ascending: false });

      if (busca.trim()) {
        // ilike para nome/telefone/cidade
        const term = `%${busca.trim()}%`;
        q = q.or(`nome_completo.ilike.${term},telefone_whatsapp.ilike.${term},cidade.ilike.${term}`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: { nome_completo: "", telefone_whatsapp: "", email: "", cidade: "Goiânia", bairro: "" },
  });

  const criar = useMutation({
    mutationFn: async (values: Valores) => {
      const { error } = await supabase.from("clientes").insert({
        nome_completo: values.nome_completo,
        telefone_whatsapp: values.telefone_whatsapp,
        email: values.email?.trim() ? values.email.trim() : null,
        cidade: values.cidade,
        bairro: values.bairro?.trim() ? values.bairro.trim() : null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Cliente cadastrado.");
      setAberto(false);
      form.reset();
      await qc.invalidateQueries({ queryKey: ["admin", "clientes"] });
    },
    onError: () => toast.error("Não foi possível cadastrar o cliente."),
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

          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button variant="default">Novo cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo cliente</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => criar.mutate(v))} className="grid gap-4 md:grid-cols-2">
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
            {clientes.map((c: any) => (
              <div key={c.id} className="rounded-lg border bg-background p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">{c.nome_completo}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.criado_em).toLocaleString("pt-BR")}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {c.telefone_whatsapp} {c.email ? `• ${c.email}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.cidade} {c.bairro ? `• ${c.bairro}` : ""}
                </p>
              </div>
            ))}
            {clientes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
