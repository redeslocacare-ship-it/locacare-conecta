import React, { useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/**
 * Página de autenticação (/auth)
 *
 * - Login e cadastro por e-mail/senha
 * - Usuários autenticados são redirecionados para /admin
 */

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(72),
});

type Valores = z.infer<typeof schema>;

export default function AuthPage() {
  const { user, carregando } = useAuth();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from as string | undefined;

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", senha: "" },
  });

  const titulo = useMemo(() => (modo === "login" ? "Entrar" : "Criar conta"), [modo]);

  if (!carregando && user) {
    return <Navigate to={from || "/admin"} replace />;
  }

  async function onSubmit(values: Valores) {
    setEnviando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.senha,
        });
        if (error) throw error;

        toast.success("Bem-vindo(a)!\nVocê entrou com sucesso.");
        navigate(from || "/admin", { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.senha,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) throw error;

        toast.success(
          "Cadastro enviado!\nSe a confirmação de e-mail estiver ativa, verifique sua caixa de entrada para concluir.",
        );
        setModo("login");
      }
    } catch (e: any) {
      const msg = String(e?.message || "Erro de autenticação");
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero">
      <div className="container grid min-h-screen items-center py-10">
        <div className="mx-auto w-full max-w-md">
          <Card className="shadow-lift">
            <CardHeader>
              <CardTitle className="text-2xl">{titulo}</CardTitle>
              <CardDescription>
                Área administrativa da LocaCare (clientes, poltronas, planos, locações e conteúdos do site).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@locacare.com.br" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete={modo === "login" ? "current-password" : "new-password"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button className="w-full" type="submit" disabled={enviando}>
                    {enviando ? "Aguarde…" : modo === "login" ? "Entrar" : "Criar conta"}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    {modo === "login" ? (
                      <button
                        type="button"
                        className="underline-offset-4 hover:underline"
                        onClick={() => setModo("cadastro")}
                      >
                        Não tem conta? Cadastre-se
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="underline-offset-4 hover:underline"
                        onClick={() => setModo("login")}
                      >
                        Já tem conta? Fazer login
                      </button>
                    )}
                  </div>
                </form>
              </Form>

              <p className="mt-6 text-xs text-muted-foreground">
                Dica: para testes rápidos, você pode desativar temporariamente a confirmação de e-mail nas configurações de
                autenticação do Lovable Cloud.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
