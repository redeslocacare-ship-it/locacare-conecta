import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, History, Printer } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export default function ContratosPage() {
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [tipoDoc, setTipoDoc] = useState<"contrato" | "proposta">("proposta");
  const [conteudoDoc, setConteudoDoc] = useState("");
  
  // Buscar clientes para o select
  const { data: clientes = [] } = useQuery({
    queryKey: ["admin", "clientes_simples"],
    queryFn: async () => {
      const { data } = await supabase.from("clientes").select("id, nome_completo, cpf, endereco_completo, cidade, telefone_whatsapp").order("nome_completo");
      return data || [];
    }
  });

  // Buscar dados do cliente selecionado para preencher o template
  const preencherTemplate = (clienteId: string, tipo: "contrato" | "proposta") => {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) return;

      const hoje = new Date().toLocaleDateString("pt-BR");
      
      let texto = "";

      if (tipo === "proposta") {
          texto = `PROPOSTA DE LOCAÇÃO
          
Data: ${hoje}
Cliente: ${cliente.nome_completo}
Telefone: ${cliente.telefone_whatsapp}

Item: Poltrona de Recuperação Pós-Cirúrgica (Modelo Reclinável)

Valores e Condições:
1. Plano 15 dias: R$ 250,00
2. Plano 30 dias: R$ 400,00

Incluso: Entrega, montagem e coleta em ${cliente.cidade || "Goiânia/Aparecida"}.

Formas de Pagamento: PIX, Cartão de Crédito ou Dinheiro na entrega.

Atenciosamente,
Equipe LocaCare
(62) 99999-9999`;
      } else {
          texto = `CONTRATO DE LOCAÇÃO DE BEM MÓVEL

LOCADOR: LOCACARE SOLUÇÕES, CNPJ 00.000.000/0001-00.
LOCATÁRIO: ${cliente.nome_completo}, CPF ${cliente.cpf || "___________"}, residente em ${cliente.endereco_completo || "___________________"}.

OBJETO: Locação de 01 (uma) Poltrona Reclinável Pós-Cirúrgica.

CLÁUSULAS:
1. O prazo de locação inicia-se na data de entrega e encerra-se na data combinada.
2. O LOCATÁRIO responsabiliza-se pela conservação do bem.
3. Em caso de dano, será cobrado o valor de reparo.
4. A devolução antecipada não gera reembolso do valor pago.

Goiânia, ${hoje}.

_____________________________
LocaCare Soluções

_____________________________
${cliente.nome_completo}`;
      }

      setConteudoDoc(texto);
  };

  const handleClienteChange = (id: string) => {
      setClienteSelecionado(id);
      preencherTemplate(id, tipoDoc);
  };

  const handleTipoChange = (val: "contrato" | "proposta") => {
      setTipoDoc(val);
      if (clienteSelecionado) {
          preencherTemplate(clienteSelecionado, val);
      }
  };

  const gerarPDF = () => {
      if (!conteudoDoc) {
          toast.error("O documento está vazio.");
          return;
      }
      
      const doc = new jsPDF();
      const splitText = doc.splitTextToSize(conteudoDoc, 180);
      doc.text(splitText, 15, 20);
      doc.save(`${tipoDoc}_${clienteSelecionado || "doc"}.pdf`);
      toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gerador de Documentos</h1>
        <p className="text-muted-foreground">
          Crie contratos e propostas personalizados automaticamente.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 shadow-md border-none">
              <CardHeader>
                  <CardTitle className="text-lg">Configuração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Documento</label>
                      <Select value={tipoDoc} onValueChange={(v: any) => handleTipoChange(v)}>
                          <SelectTrigger>
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="proposta">Proposta Comercial</SelectItem>
                              <SelectItem value="contrato">Contrato de Locação</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                  <div className="space-y-2">
                      <label className="text-sm font-medium">Selecione o Cliente</label>
                      <Select value={clienteSelecionado} onValueChange={handleClienteChange}>
                          <SelectTrigger>
                              <SelectValue placeholder="Buscar cliente..." />
                          </SelectTrigger>
                          <SelectContent>
                              {clientes.map((c: any) => (
                                  <SelectItem key={c.id} value={c.id}>
                                      {c.nome_completo}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>

                  <Button className="w-full mt-4" onClick={gerarPDF} disabled={!conteudoDoc}>
                      <Download className="mr-2 h-4 w-4" /> Baixar PDF
                  </Button>
              </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-md border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Visualização / Edição</CardTitle>
                  <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <Textarea 
                      className="min-h-[500px] font-mono text-sm leading-relaxed p-6 bg-gray-50 border-gray-200"
                      value={conteudoDoc}
                      onChange={(e) => setConteudoDoc(e.target.value)}
                      placeholder="Selecione um cliente para gerar o documento..."
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                      * Você pode editar o texto livremente antes de gerar o PDF.
                  </p>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}