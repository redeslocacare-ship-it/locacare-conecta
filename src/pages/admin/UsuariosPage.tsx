
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UsuariosPage() {
  const [busca, setBusca] = useState("");
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);
  const [novoCodigo, setNovoCodigo] = useState("");
  const [novoPercentual, setNovoPercentual] = useState("10");
  const [novaSenha, setNovaSenha] = useState("");
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [usuarioHistorico, setUsuarioHistorico] = useState<any>(null);
  const qc = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["admin", "usuarios", busca],
    queryFn: async () => {
      let q = supabase
        .from("usuarios")
        .select("id, user_id, nome, email, codigo_indicacao, saldo_indicacoes, comissao_percentual, criado_em")
        .order("criado_em", { ascending: false });

      if (busca.trim()) {
        const term = `%${busca.trim()}%`;
        q = q.or(`nome.ilike.${term},email.ilike.${term},codigo_indicacao.ilike.${term}`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: historico = [] } = useQuery({
      queryKey: ["admin", "historico_indicacoes", usuarioHistorico?.codigo_indicacao],
      queryFn: async () => {
          if (!usuarioHistorico?.codigo_indicacao) return [];
          const { data, error } = await supabase
            .from("locacoes")
            .select("id, status_locacao, valor_total, criado_em, clientes(nome_completo)")
            .eq("codigo_indicacao_usado", usuarioHistorico.codigo_indicacao)
            .order("criado_em", { ascending: false });
          
          if (error) throw error;
          return data;
      },
      enabled: !!usuarioHistorico?.codigo_indicacao && historicoAberto
  });

  const atualizarCodigo = useMutation({
    mutationFn: async ({ id, codigo, percentual, senha, user_id }: { id: string; codigo: string, percentual: number, senha?: string, user_id: string }) => {
      // 1. Atualiza dados públicos (código e comissão)
      const { error } = await supabase
        .from("usuarios")
        .update({ 
            codigo_indicacao: codigo.toUpperCase().trim() || null,
            comissao_percentual: percentual
        })
        .eq("id", id);
      if (error) throw error;

      // 2. Se tiver senha, atualiza via RPC (auth.users)
      if (senha && senha.trim().length >= 6) {
          const { error: rpcError } = await supabase.rpc("admin_update_password", {
              target_user_id: user_id,
              new_password: senha.trim()
          });
          if (rpcError) throw rpcError;
      }
    },
    onSuccess: () => {
      toast.success("Dados do parceiro atualizados.");
      setUsuarioEditando(null);
      setNovoCodigo("");
      setNovaSenha("");
      qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar. Verifique os dados."),
  });

  const [novoParceiroAberto, setNovoParceiroAberto] = useState(false);
  const [novoParceiroDados, setNovoParceiroDados] = useState({ nome: "", email: "", senha: "", codigo: "", percentual: "10" });
  
  const criarParceiro = useMutation({
      mutationFn: async (dados: typeof novoParceiroDados) => {
          const { data, error } = await supabase.rpc("admin_create_partner", {
              email: dados.email,
              password: dados.senha,
              name: dados.nome,
              codigo: dados.codigo.toUpperCase().trim() || null,
              percentual: Number(dados.percentual)
          });
          if (error) throw error;
          return data;
      },
      onSuccess: () => {
          toast.success("Parceiro criado com sucesso!");
          setNovoParceiroAberto(false);
          setNovoParceiroDados({ nome: "", email: "", senha: "", codigo: "", percentual: "10" });
          qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
      },
      onError: (e: any) => {
          console.error(e);
          toast.error(e.message || "Erro ao criar parceiro. Verifique se o email já existe.");
      }
  });

  const excluirUsuario = useMutation({
    mutationFn: async (id: string) => {
        // Usa RPC para deletar de auth.users e public.usuarios
        const { error } = await supabase.rpc("admin_delete_user", { target_user_id: id });
        if (error) {
            // Fallback se RPC falhar (ex: não atualizado)
            const { error: delError } = await supabase.from("usuarios").delete().eq("id", id);
            if (delError) throw delError;
        }
    },
    onSuccess: () => {
        toast.success("Usuário excluído com sucesso.");
        qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
    },
    onError: (error) => {
        console.error(error);
        toast.error("Erro ao excluir. O usuário pode ter locações vinculadas.");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parceiros e Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie comissões, códigos e histórico de indicações.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar parceiro..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Dialog open={novoParceiroAberto} onOpenChange={setNovoParceiroAberto}>
                <DialogTrigger asChild>
                    <Button>Novo Parceiro</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Parceiro</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome Completo</Label>
                            <Input 
                                value={novoParceiroDados.nome}
                                onChange={(e) => setNovoParceiroDados({ ...novoParceiroDados, nome: e.target.value })}
                                placeholder="Ex: João da Silva"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail (Login)</Label>
                            <Input 
                                value={novoParceiroDados.email}
                                onChange={(e) => setNovoParceiroDados({ ...novoParceiroDados, email: e.target.value })}
                                placeholder="joao@email.com"
                                type="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Senha Provisória</Label>
                            <Input 
                                value={novoParceiroDados.senha}
                                onChange={(e) => setNovoParceiroDados({ ...novoParceiroDados, senha: e.target.value })}
                                placeholder="******"
                                type="password"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Código de Indicação</Label>
                                <Input 
                                    value={novoParceiroDados.codigo}
                                    onChange={(e) => setNovoParceiroDados({ ...novoParceiroDados, codigo: e.target.value })}
                                    placeholder="JOAO10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Comissão (%)</Label>
                                <Input 
                                    value={novoParceiroDados.percentual}
                                    onChange={(e) => setNovoParceiroDados({ ...novoParceiroDados, percentual: e.target.value })}
                                    type="number"
                                />
                            </div>
                        </div>
                        <Button 
                            className="w-full" 
                            onClick={() => criarParceiro.mutate(novoParceiroDados)}
                            disabled={criarParceiro.isPending || !novoParceiroDados.email || !novoParceiroDados.senha}
                        >
                            {criarParceiro.isPending ? "Criando..." : "Criar Parceiro"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Código de Indicação</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.nome || "Sem nome"}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.codigo_indicacao ? (
                      <Badge variant="secondary" className="text-base font-mono">
                        {user.codigo_indicacao}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                     {user.codigo_indicacao ? `${user.comissao_percentual || 10}%` : "-"}
                  </TableCell>
                  <TableCell>
                    <span className={Number(user.saldo_indicacoes) > 0 ? "text-green-600 font-medium" : ""}>
                      {Number(user.saldo_indicacoes || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={!user.codigo_indicacao}
                        onClick={() => {
                            setUsuarioHistorico(user);
                            setHistoricoAberto(true);
                        }}
                    >
                        Histórico
                    </Button>

                    <Dialog
                      open={usuarioEditando?.id === user.id}
                      onOpenChange={(open) => {
                        if (open) {
                          setUsuarioEditando(user);
                          setNovoCodigo(user.codigo_indicacao || "");
                          setNovoPercentual(user.comissao_percentual?.toString() || "10");
                          setNovaSenha("");
                        } else {
                          setUsuarioEditando(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Gerenciar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Parceiro</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Usuário</Label>
                            <Input value={user.email} disabled />
                          </div>
                          
                          <div className="space-y-2">
                             <Label>Nova Senha (Opcional)</Label>
                             <Input 
                               type="password"
                               placeholder="******" 
                               value={novaSenha}
                               onChange={e => setNovaSenha(e.target.value)}
                             />
                             <p className="text-xs text-muted-foreground">Preencha apenas se desejar alterar a senha de acesso.</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Código</Label>
                                <Input
                                  value={novoCodigo}
                                  onChange={(e) => setNovoCodigo(e.target.value)}
                                  placeholder="Ex: PARCEIRO10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Comissão (%)</Label>
                                <Input
                                  type="number"
                                  value={novoPercentual}
                                  onChange={(e) => setNovoPercentual(e.target.value)}
                                  placeholder="10"
                                />
                              </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                             Deixe o código em branco para remover o status de parceiro.
                          </p>
                          <Button
                            className="w-full"
                            onClick={() =>
                              atualizarCodigo.mutate({ 
                                  id: user.id, 
                                  codigo: novoCodigo, 
                                  percentual: Number(novoPercentual),
                                  senha: novaSenha,
                                  user_id: user.user_id // ID do Auth
                              })
                            }
                            disabled={atualizarCodigo.isPending}
                          >
                            {atualizarCodigo.isPending ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja excluir <b>{user.nome || user.email}</b>? Essa ação não pode ser desfeita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => excluirUsuario.mutate(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={historicoAberto} onOpenChange={setHistoricoAberto}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Histórico de Indicações - {usuarioHistorico?.nome}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {historico.length > 0 ? (
                            historico.map((h: any) => (
                                <TableRow key={h.id}>
                                    <TableCell>{new Date(h.criado_em).toLocaleDateString()}</TableCell>
                                    <TableCell>{h.clientes?.nome_completo || "Desconhecido"}</TableCell>
                                    <TableCell>{Number(h.valor_total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                                    <TableCell><Badge variant="outline">{h.status_locacao}</Badge></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-20">Nenhuma indicação encontrada.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
