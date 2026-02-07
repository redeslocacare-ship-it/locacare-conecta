import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dashboard (Visão geral)
 *
 * MVP: indicadores simples via contagens.
 */
export default function AdminDashboardPage() {
  const { data } = useQuery({
    queryKey: ["admin", "indicadores"],
    queryFn: async () => {
      const [ativas, lead, confirmada, emUso, poltronasDisponiveis, poltronasEmLocacao] = await Promise.all([
        supabase.from("locacoes").select("id", { count: "exact", head: true }).in("status_locacao", ["confirmada", "em_uso", "em_entrega", "em_coleta"]),
        supabase.from("locacoes").select("id", { count: "exact", head: true }).eq("status_locacao", "lead"),
        supabase.from("locacoes").select("id", { count: "exact", head: true }).eq("status_locacao", "confirmada"),
        supabase.from("locacoes").select("id", { count: "exact", head: true }).eq("status_locacao", "em_uso"),
        supabase.from("poltronas").select("id", { count: "exact", head: true }).eq("status", "disponivel"),
        supabase.from("poltronas").select("id", { count: "exact", head: true }).eq("status", "em_locacao"),
      ]);

      const ultimos = await supabase
        .from("locacoes")
        .select("id,status_locacao,criado_em,clientes(nome_completo,telefone_whatsapp,cidade)")
        .order("criado_em", { ascending: false })
        .limit(8);

      return {
        ativas: ativas.count ?? 0,
        lead: lead.count ?? 0,
        confirmada: confirmada.count ?? 0,
        emUso: emUso.count ?? 0,
        poltronasDisponiveis: poltronasDisponiveis.count ?? 0,
        poltronasEmLocacao: poltronasEmLocacao.count ?? 0,
        ultimos: ultimos.data ?? [],
      };
    },
  });

  const indicadores = [
    { titulo: "Locações ativas", valor: data?.ativas ?? 0 },
    { titulo: "Leads", valor: data?.lead ?? 0 },
    { titulo: "Confirmadas", valor: data?.confirmada ?? 0 },
    { titulo: "Em uso", valor: data?.emUso ?? 0 },
    { titulo: "Poltronas disponíveis", valor: data?.poltronasDisponiveis ?? 0 },
    { titulo: "Poltronas em locação", valor: data?.poltronasEmLocacao ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Visão geral</h1>
        <p className="mt-2 text-sm text-muted-foreground">Indicadores do negócio e últimos registros.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {indicadores.map((i) => (
          <Card key={i.titulo} className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
                {i.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{i.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Últimos leads/locações</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.ultimos?.length ? (
            <div className="space-y-2">
              {data.ultimos.map((l: any) => (
                <div key={l.id} className="rounded-lg border bg-background p-3 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{l.clientes?.nome_completo ?? "(sem cliente)"}</p>
                    <span className="text-xs text-muted-foreground">Status: {l.status_locacao}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {l.clientes?.telefone_whatsapp ?? ""} • {l.clientes?.cidade ?? ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma locação encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
