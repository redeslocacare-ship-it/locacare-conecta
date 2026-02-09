import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Armchair, CheckCircle, Clock, Truck } from "lucide-react";

/**
 * Dashboard (Visão geral)
 *
 * MVP: indicadores simples via contagens.
 */
export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
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
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  const indicadores = [
    { titulo: "Locações ativas", valor: data?.ativas ?? 0, icon: Activity, color: "text-blue-500", animate: true },
    { titulo: "Leads (Novos)", valor: data?.lead ?? 0, icon: Users, color: "text-orange-500", animate: false },
    { titulo: "Confirmadas", valor: data?.confirmada ?? 0, icon: CheckCircle, color: "text-green-500", animate: false },
    { titulo: "Em uso", valor: data?.emUso ?? 0, icon: Armchair, color: "text-purple-500", animate: false },
    { titulo: "Poltronas livres", valor: data?.poltronasDisponiveis ?? 0, icon: Armchair, color: "text-emerald-500", animate: false },
    { titulo: "Em locação", valor: data?.poltronasEmLocacao ?? 0, icon: Truck, color: "text-indigo-500", animate: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão geral</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe o desempenho em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">Ao vivo</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {indicadores.map((i) => {
          const Icon = i.icon;
          return (
            <Card key={i.titulo} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {i.titulo}
                </CardTitle>
                <Icon className={`h-4 w-4 ${i.color} ${i.animate ? "animate-pulse" : ""}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                   <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                   <div className="text-2xl font-bold">{i.valor}</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="shadow-sm">
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
