import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Search, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SaquesPage() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [saqueEmAnalise, setSaqueEmAnalise] = useState<any>(null);
  const [observacao, setObservacao] = useState("");

  const { data: saques = [], isLoading } = useQuery({
    queryKey: ["admin", "saques", busca],
    queryFn: async () => {
      let q = supabase
        .from("solicitacoes_saque")
        .select(`
            id, 
            valor, 
            status, 
            chave_pix, 
            criado_em, 
            usuarios ( nome, email, codigo_indicacao )
        `)
        .order("criado_em", { ascending: false });

      if (busca.trim()) {
          // Note: Filtering by related table fields in Supabase is tricky with simple 'or', 
          // usually requires !inner or separate search. 
          // For MVP, client-side filtering might be easier if list is small, 
          // but let's try to filter by status or simple fields first.
          // Or just list all and let user filter visually.
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const atualizarStatus = useMutation({
    mutationFn: async ({ id, status, obs }: { id: string; status: string; obs?: string }) => {
      const { error } = await supabase
        .from("solicitacoes_saque")
        .update({ status, observacoes: obs })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação atualizada.");
      setSaqueEmAnalise(null);
      qc.invalidateQueries({ queryKey: ["admin", "saques"] });
    },
    onError: () => toast.error("Erro ao atualizar.")
  });

  const filteredSaques = saques.filter((s: any) => {
      if (!busca) return true;
      const term = busca.toLowerCase();
      return (
          s.usuarios?.nome?.toLowerCase().includes(term) ||
          s.usuarios?.email?.toLowerCase().includes(term) ||
          s.usuarios?.codigo_indicacao?.toLowerCase().includes(term) ||
          s.status.toLowerCase().includes(term)
      );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações de Saque</h1>
          <p className="text-muted-foreground">Gerencie os pagamentos de comissão aos parceiros.</p>
        </div>
        <div className="w-64">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar parceiro..." 
                    className="pl-8" 
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                />
            </div>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Parceiro</TableHead>
                <TableHead>Chave PIX</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell></TableRow>
              ) : filteredSaques.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhuma solicitação encontrada.</TableCell></TableRow>
              ) : (
                filteredSaques.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{new Date(s.criado_em).toLocaleDateString()} {new Date(s.criado_em).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{s.usuarios?.nome}</span>
                            <span className="text-xs text-muted-foreground">{s.usuarios?.email} ({s.usuarios?.codigo_indicacao})</span>
                        </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{s.chave_pix || "—"}</TableCell>
                    <TableCell className="font-bold text-green-600">
                        {Number(s.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell>
                        <Badge variant={
                            s.status === "pendente" ? "secondary" :
                            s.status === "pago" || s.status === "aprovado" ? "default" : "destructive"
                        } className={
                            s.status === "pendente" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" :
                            s.status === "pago" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""
                        }>
                            {s.status.toUpperCase()}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {s.status === "pendente" && (
                            <Dialog open={saqueEmAnalise?.id === s.id} onOpenChange={(open) => {
                                if (open) {
                                    setSaqueEmAnalise(s);
                                    setObservacao("");
                                } else {
                                    setSaqueEmAnalise(null);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm">Analisar</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Analisar Saque</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Parceiro</p>
                                                <p className="font-medium">{s.usuarios?.nome}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Valor</p>
                                                <p className="font-medium text-lg text-green-600">
                                                    {Number(s.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-muted-foreground">Chave PIX</p>
                                                <p className="font-mono bg-muted p-2 rounded select-all">{s.chave_pix}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label>Observações (Opcional)</Label>
                                            <Textarea 
                                                placeholder="Ex: Comprovante enviado no WhatsApp..." 
                                                value={observacao}
                                                onChange={e => setObservacao(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex gap-2 justify-end pt-2">
                                            <Button 
                                                variant="destructive" 
                                                onClick={() => atualizarStatus.mutate({ id: s.id, status: "rejeitado", obs: observacao })}
                                                disabled={atualizarStatus.isPending}
                                            >
                                                Rejeitar
                                            </Button>
                                            <Button 
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => atualizarStatus.mutate({ id: s.id, status: "pago", obs: observacao })}
                                                disabled={atualizarStatus.isPending}
                                            >
                                                <Check className="mr-2 h-4 w-4" /> Aprovar e Marcar Pago
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
