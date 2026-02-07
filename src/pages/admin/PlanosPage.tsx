import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";

/**
 * Módulo: Planos de locação
 *
 * Requisito: preço NÃO é fixo no código — vem do banco.
 */

const schema = z.object({
  nome_plano: z.string().trim().min(2, "Informe o nome").max(120),
  dias_duracao: z.coerce.number().int().min(1, "Duração inválida").max(365, "Duração muito alta"),
  preco_base: z.coerce.number().min(0, "Preço inválido").max(999999, "Preço muito alto"),
  ativo: z.boolean(),
});

type Valores = z.infer<typeof schema>;

export default function PlanosPage() {
  const [aberto, setAberto] = useState(false);
  const qc = useQueryClient();

  const { data: planos = [] } = useQuery({
    queryKey: ["admin", "planos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_locacao")
        .select("id,nome_plano,dias_duracao,preco_base,ativo,criado_em")
        .order("dias_duracao", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: { nome_plano: "", dias_duracao: 30, preco_base: 0, ativo: true },
  });

  const criar = useMutation({
    mutationFn: async (values: Valores) => {
      const { error } = await supabase.from("planos_locacao").insert({
        nome_plano: values.nome_plano,
        dias_duracao: values.dias_duracao,
        preco_base: values.preco_base,
        ativo: values.ativo,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Plano cadastrado.");
      setAberto(false);
      form.reset();
      await qc.invalidateQueries({ queryKey: ["admin", "planos"] });
      await qc.invalidateQueries({ queryKey: ["public", "planos_locacao"] });
    },
    onError: () => toast.error("Não foi possível cadastrar o plano."),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Planos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Planos exibidos no site público quando estiverem ativos.</p>
        </div>

        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button>Novo plano</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo plano</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => criar.mutate(v))} className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nome_plano"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome do plano</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Plano 30 dias" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dias_duracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (dias)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preco_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço base (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 flex items-center justify-between rounded-lg border bg-background p-3">
                      <div>
                        <FormLabel>Ativo</FormLabel>
                        <p className="text-xs text-muted-foreground">Se ativo, aparece no site.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
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

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {planos.map((p: any) => (
              <div key={p.id} className="rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{p.nome_plano}</p>
                    <p className="text-xs text-muted-foreground">{p.dias_duracao} dias</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {Number(p.preco_base).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.ativo ? "Ativo" : "Inativo"}</p>
                  </div>
                </div>
              </div>
            ))}
            {planos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum plano cadastrado.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
