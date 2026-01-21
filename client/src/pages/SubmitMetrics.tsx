import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, TrendingUp } from "lucide-react";

export default function SubmitMetrics() {
  const { user } = useAuth();
  const currentDate = new Date();

  const [ano, setAno] = useState(currentDate.getFullYear());
  const [mes, setMes] = useState(currentDate.getMonth() + 1);
  const [faturamento, setFaturamento] = useState("");
  const [lucro, setLucro] = useState("");
  const [postsFeed, setPostsFeed] = useState("");
  const [stories, setStories] = useState("");
  const [leads, setLeads] = useState("");
  const [procedimentos, setProcedimentos] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const submitMutation = trpc.mentorados.submitMetricas.useMutation({
    onSuccess: () => {
      toast.success("Métricas enviadas com sucesso!", {
        description: `Dados de ${getMesNome(mes)}/${ano} foram salvos.`,
      });
      // Reset form
      setFaturamento("");
      setLucro("");
      setPostsFeed("");
      setStories("");
      setLeads("");
      setProcedimentos("");
      setObservacoes("");
    },
    onError: error => {
      toast.error("Erro ao enviar métricas", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    submitMutation.mutate({
      ano,
      mes,
      faturamento: parseFloat(faturamento) || 0,
      lucro: parseFloat(lucro) || 0,
      postsFeed: parseInt(postsFeed) || 0,
      stories: parseInt(stories) || 0,
      leads: parseInt(leads) || 0,
      procedimentos: parseInt(procedimentos) || 0,
      observacoes: observacoes || undefined,
    });
  };

  const getMesNome = (m: number) => {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return meses[m - 1];
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Enviar Métricas Mensais
          </h1>
          <p className="text-slate-500 mt-2">
            Preencha seus resultados do mês para acompanhamento de performance
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-purple" />
              Dados de Performance
            </CardTitle>
            <CardDescription>
              Todos os campos são obrigatórios. Preencha com os dados reais do
              período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Período */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Select
                    value={ano.toString()}
                    onValueChange={v => setAno(parseInt(v))}
                  >
                    <SelectTrigger id="ano">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mes">Mês</Label>
                  <Select
                    value={mes.toString()}
                    onValueChange={v => setMes(parseInt(v))}
                  >
                    <SelectTrigger id="mes">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <SelectItem key={m} value={m.toString()}>
                          {getMesNome(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Financeiro */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faturamento">Faturamento (R$)</Label>
                  <Input
                    id="faturamento"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={faturamento}
                    onChange={e => setFaturamento(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lucro">Lucro (R$)</Label>
                  <Input
                    id="lucro"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={lucro}
                    onChange={e => setLucro(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Marketing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postsFeed">Posts no Feed</Label>
                  <Input
                    id="postsFeed"
                    type="number"
                    placeholder="0"
                    value={postsFeed}
                    onChange={e => setPostsFeed(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stories">Stories</Label>
                  <Input
                    id="stories"
                    type="number"
                    placeholder="0"
                    value={stories}
                    onChange={e => setStories(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Operacional */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leads">Leads Captados</Label>
                  <Input
                    id="leads"
                    type="number"
                    placeholder="0"
                    value={leads}
                    onChange={e => setLeads(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="procedimentos">
                    Procedimentos Realizados
                  </Label>
                  <Input
                    id="procedimentos"
                    type="number"
                    placeholder="0"
                    value={procedimentos}
                    onChange={e => setProcedimentos(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (Opcional)</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione notas sobre o mês, desafios enfrentados, conquistas, etc."
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-neon-purple hover:bg-neon-purple/90"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Enviar Métricas
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Dica:</strong> Você pode atualizar os dados do mesmo mês
              quantas vezes precisar. O sistema sempre salvará a versão mais
              recente.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
