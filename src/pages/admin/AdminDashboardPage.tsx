import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Armchair, CheckCircle, Clock, Truck, FileText } from "lucide-react";

const getStatusBadge = (status: string) => {
    switch(status) {
        case 'lead': return <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">Novo Lead</Badge>;
        case 'aguardando_pagamento': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Aguardando Pagto</Badge>;
        case 'confirmada': return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">Confirmada</Badge>;
        case 'em_entrega': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Em Entrega</Badge>;
        case 'em_uso': return <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">Em Uso</Badge>;
        case 'em_coleta': return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">Em Coleta</Badge>;
        case 'finalizada': return <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">Finalizada</Badge>;
        case 'cancelada': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">Cancelada</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

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
    { titulo: "Locações ativas", valor: data?.ativas ?? 0, icon: Activity, color: "text-blue-600", bg: "bg-blue-100", animate: true },
    { titulo: "Leads (Novos)", valor: data?.lead ?? 0, icon: Users, color: "text-orange-600", bg: "bg-orange-100", animate: false },
    { titulo: "Confirmadas", valor: data?.confirmada ?? 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", animate: false },
    { titulo: "Em uso", valor: data?.emUso ?? 0, icon: Armchair, color: "text-purple-600", bg: "bg-purple-100", animate: false },
    { titulo: "Poltronas livres", valor: data?.poltronasDisponiveis ?? 0, icon: Armchair, color: "text-emerald-600", bg: "bg-emerald-100", animate: false },
    { titulo: "Em locação", valor: data?.poltronasEmLocacao ?? 0, icon: Truck, color: "text-indigo-600", bg: "bg-indigo-100", animate: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Visão Geral</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Acompanhe o desempenho da sua operação em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
           <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-semibold text-gray-700">Sistema Online</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {indicadores.map((i) => {
          const Icon = i.icon;
          return (
            <Card key={i.titulo} className="shadow-md hover:shadow-lg transition-all duration-200 border-none bg-white overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {i.titulo}
                </CardTitle>
                <div className={`p-2 rounded-full ${i.bg} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${i.color} ${i.animate ? "animate-pulse" : ""}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                   <div className="h-10 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                   <div className="text-4xl font-bold text-gray-800">{i.valor}</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md border-none">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500"/> 
                  Últimas Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.ultimos?.length ? (
                <div className="divide-y">
                  {data.ultimos.map((l: any) => (
                    <div key={l.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-gray-800 text-base">{l.clientes?.nome_completo ?? "(sem cliente)"}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                            {l.clientes?.cidade ?? "Cidade não inf."}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(l.status_locacao)}
                          <span className="text-xs text-muted-foreground">{new Date(l.criado_em).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">Nenhuma locação encontrada recentemente.</div>
              )}
            </CardContent>
          </Card>
          
          {/* Espaço para gráficos futuros ou atalhos */}
          <div className="space-y-6">
                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-none shadow-md text-white">
                    <CardHeader>
                        <CardTitle className="text-white/90">Acesso Rápido</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm">
                            <FileText className="h-8 w-8 mb-2 opacity-90"/>
                            <span className="font-medium text-sm">Contratos</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm">
                            <Activity className="h-8 w-8 mb-2 opacity-90"/>
                            <span className="font-medium text-sm">Locação</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm">
                            <Users className="h-8 w-8 mb-2 opacity-90"/>
                            <span className="font-medium text-sm">Clientes</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm">
                            <Truck className="h-8 w-8 mb-2 opacity-90"/>
                            <span className="font-medium text-sm">Logística</span>
                        </button>
                    </CardContent>
                </Card>
          </div>
      </div>
    </div>
  );
}
