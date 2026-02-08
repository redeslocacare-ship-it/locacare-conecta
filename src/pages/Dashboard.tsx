import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, Database, LayoutDashboard, Wrench, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Health = {
  auth: "ok" | "erro";
  db: "ok" | "erro";
  url: string;
  referral: {
    code: string | null;
    balance: number;
  };
};

async function checkHealth(): Promise<Health> {
  const url = String(import.meta.env.VITE_SUPABASE_URL || "");

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const auth: Health["auth"] = sessionError || !sessionData.session ? "erro" : "ok";

  const { error: dbError } = await supabase.from("planos_locacao").select("id").limit(1);
  const db: Health["db"] = dbError ? "erro" : "ok";

  // Fetch referral info
  let referral = { code: null, balance: 0 };
  if (auth === "ok" && sessionData.session?.user) {
    const { data: userData } = await supabase
      .from("usuarios")
      .select("codigo_indicacao, saldo_indicacoes")
      .eq("user_id", sessionData.session.user.id)
      .single();
    
    if (userData) {
      referral = {
        code: userData.codigo_indicacao,
        balance: Number(userData.saldo_indicacoes || 0)
      };
    }
  }

  return { auth, db, url, referral };
}

export default function DashboardPage() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    retry: 0,
  });

  const statusGeral = useMemo(() => {
    if (!data) return "Verificando integrações…";
    if (data.auth === "ok" && data.db === "ok") return "Sistema operacional";
    if (data.auth === "erro") return "Erro de Autenticação";
    if (data.db === "erro") return "Erro de Banco de Dados (RLS/Conexão)";
    return "Atenção: verifique integrações";
  }, [data]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card/70 p-8 shadow-lift backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Acompanhe o estado da conexão com o Supabase, acesse o painel administrativo e rode a sincronização de tipos e
              deploy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Verificando…" : "Revalidar"}
            </Button>
            <Button asChild>
              <Link to="/sync">Ir para Sincronização</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card className="bg-background/30 shadow-soft">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                Status geral
              </div>
              <CardTitle className="text-xl">{statusGeral}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {data?.url ? <p className="truncate">Supabase: {data.url}</p> : <p>Supabase: não configurado</p>}
            </CardContent>
          </Card>

          <Card className="bg-background/30 shadow-soft">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Share2 className="h-4 w-4" />
                Indicação
              </div>
              <CardTitle className="text-xl">{data?.referral?.code || "-"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Saldo: {data?.referral?.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </CardContent>
          </Card>

          <Card className="bg-background/30 shadow-soft">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                Banco (RLS)
              </div>
              <CardTitle className="text-xl">{data?.db === "ok" ? "OK" : "Falha"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Teste: leitura mínima em `planos_locacao`.</p>
            </CardContent>
          </Card>

          <Card className="bg-background/30 shadow-soft">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Painel
              </div>
              <CardTitle className="text-xl">Área administrativa</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full justify-between">
                <Link to="/admin">
                  Abrir Admin <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wrench className="h-4 w-4" />
              Operação
            </div>
            <CardTitle className="text-xl">Rotina recomendada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1) Ajuste schema no Supabase</p>
            <p>2) Rode `python scripts/sync_full.py` localmente</p>
            <p>3) Confirme deploy no Vercel</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">Site público</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between">
              <a href="/site" rel="noreferrer">
                Abrir site <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

