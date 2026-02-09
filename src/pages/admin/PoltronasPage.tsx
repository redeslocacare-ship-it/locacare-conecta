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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Módulo: Poltronas
 */

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  descricao: z.string().trim().max(500).optional().or(z.literal("")),
  cor: z.string().trim().max(80).optional().or(z.literal("")),
  material: z.string().trim().max(80).optional().or(z.literal("")),
  codigo_interno: z.string().trim().max(50).optional().or(z.literal("")),
  status: z.enum(["disponivel", "em_locacao", "manutencao", "inativo"]),
});

type Valores = z.infer<typeof schema>;

import { Pencil, Trash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function PoltronasPage() {
  const [aberto, setAberto] = useState(false);
  const [poltronaEditando, setPoltronaEditando] = useState<any>(null);
  const [busca, setBusca] = useState("");
  const qc = useQueryClient();

  const { data: poltronas = [] } = useQuery({
    queryKey: ["admin", "poltronas", busca],
    queryFn: async () => {
      let q = supabase
        .from("poltronas")
        .select("id,nome,descricao,cor,material,codigo_interno,status,criado_em")
        .order("criado_em", { ascending: false });

      if (busca.trim()) {
        const term = `%${busca.trim()}%`;
        q = q.or(`nome.ilike.${term},codigo_interno.ilike.${term},status.ilike.${term}`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      descricao: "",
      cor: "",
      material: "",
      codigo_interno: "",
      status: "disponivel",
    },
  });

  // Reset/Fill form on open/edit
  React.useEffect(() => {
    if (poltronaEditando) {
        form.reset({
            nome: poltronaEditando.nome,
            descricao: poltronaEditando.descricao || "",
            cor: poltronaEditando.cor || "",
            material: poltronaEditando.material || "",
            codigo_interno: poltronaEditando.codigo_interno || "",
            status: poltronaEditando.status,
        });
    } else {
        form.reset({
            nome: "",
            descricao: "",
            cor: "",
            material: "",
            codigo_interno: "",
            status: "disponivel",
        });
    }
  }, [poltronaEditando, form]);

  const salvar = useMutation({
    mutationFn: async (values: Valores) => {
      if (poltronaEditando) {
          const { error } = await supabase.from("poltronas").update({
            nome: values.nome,
            descricao: values.descricao?.trim() ? values.descricao.trim() : null,
            cor: values.cor?.trim() ? values.cor.trim() : null,
            material: values.material?.trim() ? values.material.trim() : null,
            codigo_interno: values.codigo_interno?.trim() ? values.codigo_interno.trim() : null,
            status: values.status,
          }).eq("id", poltronaEditando.id);
          if (error) throw error;
      } else {
          const { error } = await supabase.from("poltronas").insert({
            nome: values.nome,
            descricao: values.descricao?.trim() ? values.descricao.trim() : null,
            cor: values.cor?.trim() ? values.cor.trim() : null,
            material: values.material?.trim() ? values.material.trim() : null,
            codigo_interno: values.codigo_interno?.trim() ? values.codigo_interno.trim() : null,
            status: values.status,
          });
          if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(poltronaEditando ? "Poltrona atualizada." : "Poltrona cadastrada.");
      setAberto(false);
      setPoltronaEditando(null);
      form.reset();
      await qc.invalidateQueries({ queryKey: ["admin", "poltronas"] });
    },
    onError: () => toast.error("Não foi possível salvar."),
  });
  
  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("poltronas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Poltrona excluída.");
      await qc.invalidateQueries({ queryKey: ["admin", "poltronas"] });
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl">Poltronas</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cadastre modelos para locação (preparado para expansão).</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input 
             placeholder="Buscar por nome, código ou status..." 
             value={busca} 
             onChange={(e) => setBusca(e.target.value)}
             className="w-full sm:w-[250px]"
          />
          <Dialog open={aberto} onOpenChange={(open) => {
            setAberto(open);
            if (!open) setPoltronaEditando(null);
          }}>
            <DialogTrigger asChild>
              <Button>Nova poltrona</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{poltronaEditando ? "Editar poltrona" : "Nova poltrona"}</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => salvar.mutate(v))} className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome do modelo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="em_locacao">Em locação</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigo_interno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código interno</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={salvar.isPending}>
                    {salvar.isPending ? "Salvando…" : "Salvar"}
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
            {poltronas.map((p: any) => (
              <div key={p.id} className="rounded-lg border bg-background p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                          <p className="font-medium">{p.nome}</p>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">{p.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.codigo_interno ? `Código: ${p.codigo_interno}` : "Sem código"}</p>
                    </div>
                    
                    <div className="flex gap-1 mt-2 sm:mt-0">
                        <Button variant="ghost" size="icon" onClick={() => {
                            setPoltronaEditando(p);
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
                                    <AlertDialogTitle>Excluir poltrona?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tem certeza? Essa ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => excluir.mutate(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
              </div>
            ))}
            {poltronas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma poltrona cadastrada.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
