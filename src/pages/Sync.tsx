import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Copy, RefreshCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type CheckItem = {
  label: string;
  status: "ok" | "erro";
  detail?: string;
};

async function runChecks(): Promise<CheckItem[]> {
  const items: CheckItem[] = [];

  const url = String(import.meta.env.VITE_SUPABASE_URL || "");
  const anon = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");

  items.push({
    label: "VITE_SUPABASE_URL",
    status: url ? "ok" : "erro",
    detail: url ? url : "Variável não definida",
  });

  items.push({
    label: "VITE_SUPABASE_PUBLISHABLE_KEY",
    status: anon ? "ok" : "erro",
    detail: anon ? "Definida" : "Variável não definida",
  });

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  items.push({
    label: "Sessão Supabase",
    status: sessionError || !sessionData.session ? "erro" : "ok",
    detail: sessionError ? sessionError.message : sessionData.session ? "Ativa" : "Sem sessão",
  });

  const { error: dbError } = await supabase.from("planos_locacao").select("id").limit(1);
  items.push({
    label: "Acesso ao banco (planos_locacao)",
    status: dbError ? "erro" : "ok",
    detail: dbError ? dbError.message : "OK",
  });

  return items;
}

export default function SyncPage() {
  const [copiando, setCopiando] = useState(false);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["sync-checks"],
    queryFn: runChecks,
    retry: 0,
  });

  const hasErrors = useMemo(() => (data ? data.some((i) => i.status === "erro") : false), [data]);

  async function copiarComando() {
    setCopiando(true);
    try {
      await navigator.clipboard.writeText("python scripts/sync_full.py");
      toast.success("Comando copiado!");
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente: python scripts/sync_full.py");
    } finally {
      setCopiando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl">Sincronização</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Valide integrações e rode o sincronizador local para atualizar types, enviar para o GitHub e disparar deploy na Vercel.
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Validação</CardTitle>
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {isFetching ? "Verificando…" : "Revalidar"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {(data || []).map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border bg-background/30 p-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.detail ? <p className="mt-1 text-xs text-muted-foreground break-all">{item.detail}</p> : null}
                  </div>
                  <div className="pt-0.5">
                    {item.status === "ok" ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {hasErrors ? (
              <div className="rounded-2xl border bg-destructive/10 p-4 text-sm">
                <p className="font-medium">Correções comuns</p>
                <Separator className="my-3" />
                <div className="space-y-2 text-muted-foreground">
                  <p>1) Garanta `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`</p>
                  <p>2) Se falhar ao gerar types: rode `npx supabase login` no terminal</p>
                  <p>3) Se falhar no banco: revise permissões/RLS no Supabase</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">Executar sincronizador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-background/30 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Terminal className="h-4 w-4" />
                Comando
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="text-sm">python scripts/sync_full.py</code>
                <Button variant="secondary" size="sm" onClick={copiarComando} disabled={copiando}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copiando ? "Copiando…" : "Copiar"}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Esse fluxo:</p>
              <p className="mt-2">- valida ambiente e ferramentas</p>
              <p>- gera `src/integrations/supabase/types.ts` (quando possível)</p>
              <p>- faz `git add/commit/push` (dispara deploy na Vercel)</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

