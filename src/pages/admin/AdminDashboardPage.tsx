import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Armchair, CheckCircle, Clock, Truck, FileText, Package, UserPlus, FileSignature } from "lucide-react";

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
    { titulo: "Locações ativas", valor: data?.ativas ?? 0, icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-slate-800" },
    { titulo: "Novos Leads", valor: data?.lead ?? 0, icon: UserPlus, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-slate-800" },
    { titulo: "Confirmadas", valor: data?.confirmada ?? 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-slate-800" },
    { titulo: "Em uso", valor: data?.emUso ?? 0, icon: Armchair, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-slate-800" },
    { titulo: "Poltronas livres", valor: data?.poltronasDisponiveis ?? 0, icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-slate-800" },
    { titulo: "Em locação", valor: data?.poltronasEmLocacao ?? 0, icon: Truck, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-slate-800" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Visão Geral</h1>
          <p className="mt-2 text-slate-400">
            Acompanhe os principais indicadores da sua operação em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-800">
           <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-300">Sistema Online</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {indicadores.map((i) => {
          const Icon = i.icon;
          return (
            <Card key={i.titulo} className={`shadow-sm hover:shadow-md transition-all duration-200 border ${i.border} bg-slate-900 overflow-hidden group`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400 mb-1">
                            {i.titulo}
                        </p>
                        {isLoading ? (
                            <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
                        ) : (
                            <h3 className="text-3xl font-bold text-white">{i.valor}</h3>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl ${i.bg} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-6 w-6 ${i.color}`} />
                    </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-sm border-slate-800 bg-slate-900">
            <CardHeader className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
              <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
                      <Clock className="h-5 w-5 text-slate-500"/> 
                      Últimas Movimentações
                  </CardTitle>
                  <Link to="/admin/locacoes" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline">
                      Ver todas
                  </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data?.ultimos?.length ? (
                <div className="divide-y divide-slate-800">
                  {data.ultimos.map((l: any) => (
                    <div key={l.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                            {l.clientes?.nome_completo ?? "(sem cliente)"}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{l.clientes?.cidade ?? "Local não inf."}</span>
                            {l.clientes?.telefone_whatsapp && (
                                <>
                                    <span className="text-slate-600">•</span>
                                    <span>{l.clientes.telefone_whatsapp}</span>
                                </>
                            )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                          {getStatusBadge(l.status_locacao)}
                          <span className="text-xs text-slate-500 font-medium">
                            {new Date(l.criado_em).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-900/30">
                    <Package className="h-10 w-10 mb-3 opacity-20" />
                    <p>Nenhuma movimentação recente.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 border-b border-slate-800 bg-slate-900/50">
                        <CardTitle className="text-white font-semibold flex items-center gap-2">
                            Acesso Rápido
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 p-4">
                        <Link to="/admin/contratos" className="group flex flex-col items-center justify-center p-4 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-all border border-blue-500/20 hover:border-blue-500/30 hover:-translate-y-0.5 active:scale-95">
                            <FileSignature className="h-7 w-7 mb-2 text-blue-400 group-hover:text-blue-300 transition-colors"/>
                            <span className="font-medium text-sm text-blue-100">Contratos</span>
                        </Link>
                        <Link to="/admin/locacoes" className="group flex flex-col items-center justify-center p-4 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20 hover:border-emerald-500/30 hover:-translate-y-0.5 active:scale-95">
                            <Activity className="h-7 w-7 mb-2 text-emerald-400 group-hover:text-emerald-300 transition-colors"/>
                            <span className="font-medium text-sm text-emerald-100">Locações</span>
                        </Link>
                        <Link to="/admin/clientes" className="group flex flex-col items-center justify-center p-4 bg-orange-500/10 rounded-xl hover:bg-orange-500/20 transition-all border border-orange-500/20 hover:border-orange-500/30 hover:-translate-y-0.5 active:scale-95">
                            <Users className="h-7 w-7 mb-2 text-orange-400 group-hover:text-orange-300 transition-colors"/>
                            <span className="font-medium text-sm text-orange-100">Clientes</span>
                        </Link>
                        <Link to="/admin/poltronas" className="group flex flex-col items-center justify-center p-4 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 transition-all border border-purple-500/20 hover:border-purple-500/30 hover:-translate-y-0.5 active:scale-95">
                            <Armchair className="h-7 w-7 mb-2 text-purple-400 group-hover:text-purple-300 transition-colors"/>
                            <span className="font-medium text-sm text-purple-100">Poltronas</span>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-800 bg-gradient-to-r from-slate-800 to-slate-900">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-300">Dica do dia</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Verifique as locações "Aguardando Pagamento" para liberar a entrega.
                            </p>
                        </div>
                    </CardContent>
                </Card>
          </div>
      </div>
    </div>
  );
}
