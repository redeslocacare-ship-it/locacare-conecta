import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, Database, LayoutDashboard, Wrench, Share2, DollarSign, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type ReferralStats = {
  code: string | null;
  totalEarnings: number;
  pendingEarnings: number;
  confirmedCount: number;
  pendingCount: number;
  history: any[];
};

export default function DashboardPage() {
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: referralStats, isLoading } = useQuery({
    queryKey: ["referral-stats", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async (): Promise<ReferralStats> => {
      // 1. Get user's referral code
      const { data: userData } = await supabase
        .from("usuarios")
        .select("codigo_indicacao")
        .eq("user_id", session!.user.id)
        .single();

      if (!userData?.codigo_indicacao) {
        return {
          code: null,
          totalEarnings: 0,
          pendingEarnings: 0,
          confirmedCount: 0,
          pendingCount: 0,
          history: [],
        };
      }

      // 2. Get reservations using this code
      const { data: locacoes } = await supabase
        .from("locacoes")
        .select("id, status_locacao, valor_total, criado_em, clientes(nome_completo)")
        .eq("codigo_indicacao_usado", userData.codigo_indicacao)
        .order("criado_em", { ascending: false });

      const history = locacoes || [];

      // 3. Calculate stats
      let totalEarnings = 0;
      let pendingEarnings = 0;
      let confirmedCount = 0;
      let pendingCount = 0;

      // Commission rule: 10% of total value (Example rule, can be adjusted)
      const COMMISSION_RATE = 0.10;

      history.forEach((loc) => {
        const value = Number(loc.valor_total || 0);
        const commission = value * COMMISSION_RATE;

        // Status considered "Confirmed" for payment
        const isConfirmed = ["confirmada", "em_uso", "em_entrega", "finalizada"].includes(loc.status_locacao);
        const isCancelled = ["cancelada"].includes(loc.status_locacao);

        if (!isCancelled) {
          if (isConfirmed) {
            totalEarnings += commission;
            confirmedCount++;
          } else {
            pendingEarnings += commission;
            pendingCount++;
          }
        }
      });

      return {
        code: userData.codigo_indicacao,
        totalEarnings,
        pendingEarnings,
        confirmedCount,
        pendingCount,
        history,
      };
    },
  });

  const isAdmin = session?.user?.email === "admin@locacare.com.br";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card/70 p-8 shadow-lift backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl">Olá, Parceiro!</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Acompanhe suas indicações e ganhos em tempo real.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button asChild variant="secondary">
                <Link to="/admin">
                  Acessar Painel Admin <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card className="bg-background/30 shadow-soft">
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Share2 className="h-4 w-4" />
                Seu Código
              </div>
              <CardTitle className="text-2xl text-primary">{referralStats?.code || "—"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Compartilhe este código para ganhar comissões.
            </CardContent>
          </Card>

          <Card className="bg-background/30 shadow-soft">
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Ganhos Confirmados
              </div>
              <CardTitle className="text-2xl text-green-600">
                {referralStats?.totalEarnings.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Disponível para saque
            </CardContent>
          </Card>

          <Card className="bg-background/30 shadow-soft">
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Ganhos Pendentes
              </div>
              <CardTitle className="text-2xl text-yellow-600">
                {referralStats?.pendingEarnings.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Aguardando confirmação de pgto.
            </CardContent>
          </Card>

          <Card className="bg-background/30 shadow-soft">
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Indicações
              </div>
              <CardTitle className="text-2xl">
                {referralStats ? referralStats.confirmedCount + referralStats.pendingCount : 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {referralStats?.confirmedCount} confirmadas / {referralStats?.pendingCount} pendentes
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">Histórico de Indicações</CardTitle>
          </CardHeader>
          <CardContent>
            {referralStats?.history?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente (Parcial)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor Pedido</TableHead>
                    <TableHead className="text-right">Sua Comissão (Est.)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralStats.history.map((item: any) => {
                     const val = Number(item.valor_total || 0);
                     const com = val * 0.10;
                     return (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.criado_em).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{item.clientes?.nome_completo?.split(" ")[0]}***</TableCell>
                        <TableCell>
                          <Badge variant={
                            ["confirmada", "em_uso", "finalizada"].includes(item.status_locacao) ? "default" :
                            ["cancelada"].includes(item.status_locacao) ? "destructive" : "secondary"
                          }>
                            {item.status_locacao}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                      </TableRow>
                     );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 opacity-20" />
                <p className="mt-4">Nenhuma indicação encontrada ainda.</p>
                <p className="text-sm">Compartilhe seu código para começar!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

