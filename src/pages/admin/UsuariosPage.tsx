
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
import { Trash } from "lucide-react";
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
  const qc = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["admin", "usuarios", busca],
    queryFn: async () => {
      let q = supabase
        .from("usuarios")
        .select("id, nome, email, codigo_indicacao, saldo_indicacoes, criado_em")
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

  const atualizarCodigo = useMutation({
    mutationFn: async ({ id, codigo }: { id: string; codigo: string }) => {
      const { error } = await supabase
        .from("usuarios")
        .update({ codigo_indicacao: codigo.toUpperCase().trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Código de indicação atualizado.");
      setUsuarioEditando(null);
      setNovoCodigo("");
      qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
    },
    onError: () => toast.error("Erro ao atualizar. O código pode já estar em uso."),
  });

  const excluirUsuario = useMutation({
    mutationFn: async (id: string) => {
        // Primeiro, remover dependências se necessário (opcional, dependendo do CASCADE)
        // Aqui assumimos que o banco está configurado com ON DELETE CASCADE ou RESTRICT
        const { error } = await supabase.from("usuarios").delete().eq("id", id);
        if (error) throw error;
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
            Gerencie os códigos de indicação e visualize o saldo dos parceiros.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Código de Indicação</TableHead>
              <TableHead>Saldo (Comissões)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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
                    <span className={Number(user.saldo_indicacoes) > 0 ? "text-green-600 font-medium" : ""}>
                      {Number(user.saldo_indicacoes || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    <Dialog
                      open={usuarioEditando?.id === user.id}
                      onOpenChange={(open) => {
                        if (open) {
                          setUsuarioEditando(user);
                          setNovoCodigo(user.codigo_indicacao || "");
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
                            <Label>Código de Indicação</Label>
                            <Input
                              value={novoCodigo}
                              onChange={(e) => setNovoCodigo(e.target.value)}
                              placeholder="Ex: PARCEIRO10"
                            />
                            <p className="text-xs text-muted-foreground">
                              Deixe em branco para remover o status de parceiro.
                            </p>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() =>
                              atualizarCodigo.mutate({ id: user.id, codigo: novoCodigo })
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
    </div>
  );
}
