import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

/**
 * Módulo: Conteúdos do site
 *
 * MVP:
 * - Depoimentos
 * - FAQs
 * - Como funciona (conteudos_site.chave = "como_funciona")
 */

const depoSchema = z.object({
  nome_cliente: z.string().trim().min(2).max(120),
  cidade: z.string().trim().max(120).optional().or(z.literal("")),
  texto_depoimento: z.string().trim().min(10, "Depoimento muito curto").max(500),
  ordem_exibicao: z.coerce.number().int().min(0).max(999),
  publicado: z.boolean(),
});

type Depo = z.infer<typeof depoSchema>;

const faqSchema = z.object({
  pergunta: z.string().trim().min(5).max(200),
  resposta: z.string().trim().min(5).max(1000),
  ordem_exibicao: z.coerce.number().int().min(0).max(999),
  publicado: z.boolean(),
});

type Faq = z.infer<typeof faqSchema>;

const comoSchema = z.object({
  passos_json: z.string().trim().min(2, "Informe um JSON válido"),
  publicado: z.boolean(),
});

type Como = z.infer<typeof comoSchema>;

export default function ConteudosPage() {
  const qc = useQueryClient();
  const [abertoDepo, setAbertoDepo] = useState(false);
  const [abertoFaq, setAbertoFaq] = useState(false);

  const { data: depoimentos = [] } = useQuery({
    queryKey: ["admin", "depoimentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("depoimentos")
        .select("id,nome_cliente,cidade,texto_depoimento,ordem_exibicao,publicado")
        .order("ordem_exibicao", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id,pergunta,resposta,ordem_exibicao,publicado")
        .order("ordem_exibicao", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: comoFunciona } = useQuery({
    queryKey: ["admin", "conteudos_site", "como_funciona"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conteudos_site")
        .select("id,chave,conteudo,publicado")
        .eq("chave", "como_funciona")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [passos, setPassos] = useState<{ titulo: string; descricao: string }[]>([]);

  const formComo = useForm<Como>({
    resolver: zodResolver(comoSchema),
    defaultValues: {
      passos_json: JSON.stringify(
        {
          passos: [
            { titulo: "Você solicita o orçamento", descricao: "Pelo site ou WhatsApp, com datas e endereço." },
            { titulo: "Confirmamos seus dados", descricao: "Validamos disponibilidade e alinhamos o plano." },
            { titulo: "Entrega e instalação", descricao: "Instalamos a poltrona na sua casa com orientação." },
            { titulo: "Suporte durante o uso", descricao: "Acompanhamento e suporte durante o período." },
            { titulo: "Coleta na data combinada", descricao: "Retirada com agendamento e conferência." },
          ],
        },
        null,
        2,
      ),
      publicado: true,
    },
    values: comoFunciona
      ? {
          passos_json: JSON.stringify(comoFunciona.conteudo, null, 2),
          publicado: comoFunciona.publicado,
        }
      : undefined,
  });

  // Update form and local state when data loads
  React.useEffect(() => {
    if (comoFunciona?.conteudo?.passos) {
      setPassos(comoFunciona.conteudo.passos);
      formComo.setValue("passos_json", JSON.stringify(comoFunciona.conteudo, null, 2));
      formComo.setValue("publicado", comoFunciona.publicado);
    } else {
        // Default value if not found
        setPassos([
            { titulo: "Você solicita o orçamento", descricao: "Pelo site ou WhatsApp, com datas e endereço." },
            { titulo: "Confirmamos seus dados", descricao: "Validamos disponibilidade e alinhamos o plano." },
            { titulo: "Entrega e instalação", descricao: "Instalamos a poltrona na sua casa com orientação." },
            { titulo: "Suporte durante o uso", descricao: "Acompanhamento e suporte durante o período." },
            { titulo: "Coleta na data combinada", descricao: "Retirada com agendamento e conferência." },
        ]);
    }
  }, [comoFunciona, formComo]);

  const addPasso = () => {
      const newPassos = [...passos, { titulo: "Novo Passo", descricao: "Descrição do passo." }];
      setPassos(newPassos);
      formComo.setValue("passos_json", JSON.stringify({ passos: newPassos }, null, 2));
  };

  const removePasso = (index: number) => {
      const newPassos = passos.filter((_, i) => i !== index);
      setPassos(newPassos);
      formComo.setValue("passos_json", JSON.stringify({ passos: newPassos }, null, 2));
  };

  const updatePasso = (index: number, field: "titulo" | "descricao", value: string) => {
      const newPassos = [...passos];
      newPassos[index] = { ...newPassos[index], [field]: value };
      setPassos(newPassos);
      formComo.setValue("passos_json", JSON.stringify({ passos: newPassos }, null, 2));
  };
  
  const [depoEditando, setDepoEditando] = useState<any>(null);
  const [faqEditando, setFaqEditando] = useState<any>(null);
  
  const formDepo = useForm<Depo>({
    resolver: zodResolver(depoSchema),
    defaultValues: { nome_cliente: "", cidade: "", texto_depoimento: "", ordem_exibicao: 0, publicado: true },
  });

  const formFaq = useForm<Faq>({
    resolver: zodResolver(faqSchema),
    defaultValues: { pergunta: "", resposta: "", ordem_exibicao: 0, publicado: true },
  });
  
  // Reset forms on edit
  React.useEffect(() => {
    if (depoEditando) {
        formDepo.reset(depoEditando);
    } else {
        formDepo.reset({ nome_cliente: "", cidade: "", texto_depoimento: "", ordem_exibicao: 0, publicado: true });
    }
  }, [depoEditando, formDepo]);

  React.useEffect(() => {
    if (faqEditando) {
        formFaq.reset(faqEditando);
    } else {
        formFaq.reset({ pergunta: "", resposta: "", ordem_exibicao: 0, publicado: true });
    }
  }, [faqEditando, formFaq]);

  const salvarDepo = useMutation({
    mutationFn: async (values: Depo) => {
      if (depoEditando) {
          const { error } = await supabase.from("depoimentos").update({
            nome_cliente: values.nome_cliente,
            cidade: values.cidade?.trim() ? values.cidade.trim() : null,
            texto_depoimento: values.texto_depoimento,
            ordem_exibicao: values.ordem_exibicao,
            publicado: values.publicado,
          }).eq("id", depoEditando.id);
          if (error) throw error;
      } else {
          const { error } = await supabase.from("depoimentos").insert({
            nome_cliente: values.nome_cliente,
            cidade: values.cidade?.trim() ? values.cidade.trim() : null,
            texto_depoimento: values.texto_depoimento,
            ordem_exibicao: values.ordem_exibicao,
            publicado: values.publicado,
          });
          if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(depoEditando ? "Depoimento atualizado." : "Depoimento salvo.");
      setAbertoDepo(false);
      setDepoEditando(null);
      formDepo.reset();
      await qc.invalidateQueries({ queryKey: ["admin", "depoimentos"] });
      await qc.invalidateQueries({ queryKey: ["public", "depoimentos"] });
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const excluirDepo = useMutation({
      mutationFn: async (id: string) => {
          const { error } = await supabase.from("depoimentos").delete().eq("id", id);
          if (error) throw error;
      },
      onSuccess: async () => {
          toast.success("Depoimento excluído.");
          await qc.invalidateQueries({ queryKey: ["admin", "depoimentos"] });
      }
  });

  const salvarFaq = useMutation({
    mutationFn: async (values: Faq) => {
      if (faqEditando) {
          const { error } = await supabase.from("faqs").update({
            pergunta: values.pergunta,
            resposta: values.resposta,
            ordem_exibicao: values.ordem_exibicao,
            publicado: values.publicado,
          }).eq("id", faqEditando.id);
          if (error) throw error;
      } else {
          const { error } = await supabase.from("faqs").insert({
            pergunta: values.pergunta,
            resposta: values.resposta,
            ordem_exibicao: values.ordem_exibicao,
            publicado: values.publicado,
          });
          if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(faqEditando ? "FAQ atualizado." : "FAQ salvo.");
      setAbertoFaq(false);
      setFaqEditando(null);
      formFaq.reset();
      await qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      await qc.invalidateQueries({ queryKey: ["public", "faqs"] });
    },
    onError: () => toast.error("Não foi possível salvar."),
  });
  
  const excluirFaq = useMutation({
      mutationFn: async (id: string) => {
          const { error } = await supabase.from("faqs").delete().eq("id", id);
          if (error) throw error;
      },
      onSuccess: async () => {
          toast.success("FAQ excluído.");
          await qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      }
  });

  const salvarComo = useMutation({
    mutationFn: async (values: Como) => {
      let conteudo: any;
      try {
        conteudo = JSON.parse(values.passos_json);
      } catch {
        throw new Error("JSON inválido");
      }

      if (comoFunciona?.id) {
        const { error } = await supabase
          .from("conteudos_site")
          .update({ conteudo, publicado: values.publicado })
          .eq("id", comoFunciona.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("conteudos_site").insert({
          chave: "como_funciona",
          conteudo,
          publicado: values.publicado,
          titulo: "Como funciona",
        });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Conteúdo atualizado.");
      await qc.invalidateQueries({ queryKey: ["admin", "conteudos_site", "como_funciona"] });
      await qc.invalidateQueries({ queryKey: ["public", "conteudos_site", "como_funciona"] });
    },
    onError: (e: any) => toast.error(e?.message || "Não foi possível salvar."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Conteúdos do site</h1>
        <p className="mt-2 text-sm text-muted-foreground">Gerencie depoimentos, perguntas e textos do site público.</p>
      </div>

      <Tabs defaultValue="depoimentos" className="w-full">
        <TabsList>
          <TabsTrigger value="depoimentos">Depoimentos</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="como">Como funciona</TabsTrigger>
        </TabsList>

        <TabsContent value="depoimentos" className="mt-4 space-y-4">
          <Dialog open={abertoDepo} onOpenChange={(open) => {
              setAbertoDepo(open);
              if (!open) setDepoEditando(null);
          }}>
            <DialogTrigger asChild>
              <Button>Novo depoimento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{depoEditando ? "Editar depoimento" : "Novo depoimento"}</DialogTitle>
              </DialogHeader>
              <Form {...formDepo}>
                <form onSubmit={formDepo.handleSubmit((v) => salvarDepo.mutate(v))} className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={formDepo.control}
                    name="nome_cliente"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formDepo.control}
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
                    control={formDepo.control}
                    name="ordem_exibicao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formDepo.control}
                    name="texto_depoimento"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Texto</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formDepo.control}
                    name="publicado"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 flex items-center justify-between rounded-lg border bg-background p-3">
                        <div>
                          <FormLabel>Publicado</FormLabel>
                          <p className="text-xs text-muted-foreground">Se publicado, aparece no site.</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" disabled={salvarDepo.isPending}>
                      {salvarDepo.isPending ? "Salvando…" : "Salvar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl">Lista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {depoimentos.map((d: any) => (
                  <div key={d.id} className="rounded-lg border bg-background p-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                              <p className="font-medium">{d.nome_cliente}</p>
                              <p className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.publicado ? "Publicado" : "Rascunho"}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Ordem: {d.ordem_exibicao}</p>
                          <p className="mt-2 text-sm text-muted-foreground">“{d.texto_depoimento}”</p>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => {
                                setDepoEditando(d);
                                setAbertoDepo(true);
                            }}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => excluirDepo.mutate(d.id)}>
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                  </div>
                ))}
                {depoimentos.length === 0 ? <p className="text-sm text-muted-foreground">Sem depoimentos.</p> : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-4 space-y-4">
          <Dialog open={abertoFaq} onOpenChange={(open) => {
              setAbertoFaq(open);
              if (!open) setFaqEditando(null);
          }}>
            <DialogTrigger asChild>
              <Button>Nova pergunta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{faqEditando ? "Editar FAQ" : "Novo FAQ"}</DialogTitle>
              </DialogHeader>
              <Form {...formFaq}>
                <form onSubmit={formFaq.handleSubmit((v) => salvarFaq.mutate(v))} className="grid gap-4">
                  <FormField
                    control={formFaq.control}
                    name="pergunta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pergunta</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formFaq.control}
                    name="resposta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resposta</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={formFaq.control}
                      name="ordem_exibicao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordem</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={formFaq.control}
                      name="publicado"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border bg-background p-3">
                          <div>
                            <FormLabel>Publicado</FormLabel>
                            <p className="text-xs text-muted-foreground">Se publicado, aparece no site.</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={salvarFaq.isPending}>
                      {salvarFaq.isPending ? "Salvando…" : "Salvar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl">Lista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {faqs.map((f: any) => (
                  <div key={f.id} className="rounded-lg border bg-background p-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-medium">{f.pergunta}</p>
                                <p className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{f.publicado ? "Publicado" : "Rascunho"}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Ordem: {f.ordem_exibicao}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{f.resposta}</p>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => {
                                setFaqEditando(f);
                                setAbertoFaq(true);
                            }}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => excluirFaq.mutate(f.id)}>
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                  </div>
                ))}
                {faqs.length === 0 ? <p className="text-sm text-muted-foreground">Sem perguntas.</p> : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="como" className="mt-4 space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl">Como funciona</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...formComo}>
                <form onSubmit={formComo.handleSubmit((v) => salvarComo.mutate(v))} className="space-y-6">
                  
                  <div className="space-y-4">
                    {passos.map((passo, index) => (
                      <div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto]">
                        <div className="space-y-2">
                          <FormLabel>Título do Passo {index + 1}</FormLabel>
                          <Input 
                            value={passo.titulo} 
                            onChange={(e) => updatePasso(index, "titulo", e.target.value)}
                            placeholder="Ex: Solicite o orçamento"
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel>Descrição</FormLabel>
                          <Textarea 
                            value={passo.descricao} 
                            onChange={(e) => updatePasso(index, "descricao", e.target.value)}
                            placeholder="Detalhes desta etapa..."
                            rows={2}
                          />
                        </div>
                        <div className="flex items-end pb-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removePasso(index)}
                            disabled={passos.length <= 1}
                          >
                            <Trash className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button type="button" variant="outline" onClick={addPasso} className="w-full border-dashed">
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Passo
                  </Button>

                  {/* Hidden field for validation/submission */}
                  <FormField
                    control={formComo.control}
                    name="passos_json"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formComo.control}
                    name="publicado"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border bg-background p-3">
                        <div>
                          <FormLabel>Publicado</FormLabel>
                          <p className="text-xs text-muted-foreground">Se publicado, aparece no site.</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={salvarComo.isPending}>
                      {salvarComo.isPending ? "Salvando…" : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
