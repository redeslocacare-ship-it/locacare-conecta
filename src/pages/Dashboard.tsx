import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, Database, LayoutDashboard, Wrench, Share2, DollarSign, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

type ReferralStats = {
  code: string | null;
  totalEarnings: number;
  pendingEarnings: number;
  confirmedCount: number;
  pendingCount: number;
  history: any[];
  availableBalance?: number;
  saques?: any[];
};

export default function DashboardPage() {
  const qc = useQueryClient();
  const [saqueAberto, setSaqueAberto] = useState(false);
  const [chavePix, setChavePix] = useState("");
  const [valorSaque, setValorSaque] = useState("");

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
      const COMMISSION_RATE = (Number(userData.comissao_percentual || 10)) / 100;

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

      // Get withdrawal history
      const { data: saques } = await supabase
        .from("solicitacoes_saque")
        .select("id, valor, status, criado_em")
        .eq("usuario_id", userData.id)
        .order("criado_em", { ascending: false });

      // Calculate available balance (Total Earnings - Approved/Pending Withdrawals)
      // We subtract pending withdrawals too so they don't request double
      const totalWithdrawn = saques?.reduce((acc, s) => {
          if (s.status !== 'rejeitado') {
              return acc + Number(s.valor);
          }
          return acc;
      }, 0) || 0;

      return {
        code: userData.codigo_indicacao,
        totalEarnings,
        pendingEarnings,
        confirmedCount,
        pendingCount,
        history,
        availableBalance: Math.max(0, totalEarnings - totalWithdrawn),
        saques: saques || []
      };
    },
  });

  const solicitarSaque = useMutation({
      mutationFn: async () => {
          if (!referralStats?.code) throw new Error("Erro de identificação");
          
          const valor = parseFloat(valorSaque.replace(",", "."));
          if (!valor || valor <= 0) throw new Error("Valor inválido");
          if (valor > (referralStats.availableBalance || 0)) throw new Error("Saldo insuficiente");

          // Get user public id
          const { data: userData } = await supabase.from("usuarios").select("id").eq("user_id", session!.user.id).single();
          if (!userData) throw new Error("Usuário não encontrado");

          const { error } = await supabase.from("solicitacoes_saque").insert({
              usuario_id: userData.id,
              valor: valor,
              chave_pix: chavePix,
              status: "pendente"
          });

          if (error) throw error;
      },
      onSuccess: () => {
          toast.success("Saque solicitado com sucesso!");
          setSaqueAberto(false);
          setValorSaque("");
          qc.invalidateQueries({ queryKey: ["referral-stats"] });
      },
      onError: (e: any) => toast.error(e.message || "Erro ao solicitar saque.")
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
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                  Disponível: {(referralStats?.availableBalance || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              {referralStats && (referralStats.availableBalance || 0) > 0 && (
                <Dialog open={saqueAberto} onOpenChange={setSaqueAberto}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                            Solicitar Saque
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Solicitar Saque</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Valor do Saque (R$)</Label>
                                <Input 
                                    type="number"
                                    placeholder="0,00" 
                                    value={valorSaque}
                                    onChange={e => setValorSaque(e.target.value)}
                                    max={referralStats.availableBalance}
                                />
                                <p className="text-xs text-muted-foreground">Máximo: {referralStats.availableBalance?.toFixed(2)}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Chave PIX</Label>
                                <Input 
                                    placeholder="CPF, Email, Telefone..." 
                                    value={chavePix}
                                    onChange={e => setChavePix(e.target.value)}
                                />
                            </div>
                            <Button 
                                className="w-full" 
                                onClick={() => solicitarSaque.mutate()}
                                disabled={solicitarSaque.isPending}
                            >
                                {solicitarSaque.isPending ? "Solicitando..." : "Confirmar Solicitação"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
              )}
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

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">Histórico de Indicações</CardTitle>
          </CardHeader>
          <CardContent>
            {referralStats?.history?.length ? (
              <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralStats.history.map((item: any) => {
                     const val = Number(item.valor_total || 0);
                     // Note: We should ideally fetch the historical commission rate, but using current for simplicity or if stored
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
                        <TableCell className="text-right font-medium">
                          {com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                      </TableRow>
                     );
                  })}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 opacity-20" />
                <p className="mt-4">Nenhuma indicação encontrada ainda.</p>
                <p className="text-sm">Compartilhe seu código para começar!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">Meus Saques</CardTitle>
          </CardHeader>
          <CardContent>
            {referralStats?.saques?.length ? (
              <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralStats.saques.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>{new Date(s.criado_em).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant={
                            s.status === "pendente" ? "secondary" :
                            s.status === "pago" || s.status === "aprovado" ? "default" : "destructive"
                          } className={
                            s.status === "pendente" ? "bg-yellow-100 text-yellow-700" :
                            s.status === "pago" ? "bg-green-100 text-green-700" : ""
                          }>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(s.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 opacity-20" />
                <p className="mt-4">Nenhum saque realizado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

