import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface SubmitMetricsFormProps {
  onSuccess?: () => void;
  className?: string;
  /** When true, suggests next month (January 2026) if user has December data */
  suggestNextMonth?: boolean;
}

export function SubmitMetricsForm({
  onSuccess,
  className,
  suggestNextMonth = false,
}: SubmitMetricsFormProps) {
  const currentDate = new Date();

  // If suggestNextMonth is true, default to January 2026
  const defaultYear = suggestNextMonth ? 2026 : currentDate.getFullYear();
  const defaultMonth = suggestNextMonth ? 1 : currentDate.getMonth() + 1;

  const [ano, setAno] = useState(defaultYear);
  const [mes, setMes] = useState(defaultMonth);
  const [faturamento, setFaturamento] = useState("");
  const [lucro, setLucro] = useState("");
  const [postsFeed, setPostsFeed] = useState("");
  const [stories, setStories] = useState("");
  const [leads, setLeads] = useState("");
  const [procedimentos, setProcedimentos] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(suggestNextMonth);

  const utils = trpc.useUtils();

  // Update defaults when suggestNextMonth changes
  useEffect(() => {
    if (suggestNextMonth) {
      setAno(2026);
      setMes(1);
      setShowSuggestion(true);
    }
  }, [suggestNextMonth]);

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
      setShowSuggestion(false);

      // Invalidate queries to refresh dashboard data
      utils.mentorados.invalidate();

      if (onSuccess) onSuccess();
    },
    onError: (error) => {
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
      postsFeed: parseInt(postsFeed, 10) || 0,
      stories: parseInt(stories, 10) || 0,
      leads: parseInt(leads, 10) || 0,
      procedimentos: parseInt(procedimentos, 10) || 0,
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
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Suggestion Alert */}
      {showSuggestion && (
        <Alert className="bg-primary/10 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Hora de lançar Janeiro/2026!</strong> Você já tem dados de Dezembro/2025.
            Compare seu progresso mês-a-mês preenchendo as métricas do novo mês.
          </AlertDescription>
        </Alert>
      )}

      {/* Período */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ano">Ano</Label>
          <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v, 10))}>
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
          <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v, 10))}>
            <SelectTrigger id="mes">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {getMesNome(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Financeiro */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">Financeiro</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="faturamento">Faturamento (R$)</Label>
            <Input
              id="faturamento"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={faturamento}
              onChange={(e) => setFaturamento(e.target.value)}
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
              onChange={(e) => setLucro(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Marketing */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">Marketing</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postsFeed">Posts Feed</Label>
            <Input
              id="postsFeed"
              type="number"
              placeholder="0"
              value={postsFeed}
              onChange={(e) => setPostsFeed(e.target.value)}
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
              onChange={(e) => setStories(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Operacional */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">Operacional</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="leads">Leads</Label>
            <Input
              id="leads"
              type="number"
              placeholder="0"
              value={leads}
              onChange={(e) => setLeads(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="procedimentos">Procedimentos</Label>
            <Input
              id="procedimentos"
              type="number"
              placeholder="0"
              value={procedimentos}
              onChange={(e) => setProcedimentos(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Notas sobre o mês..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
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
            Salvar Métricas
          </>
        )}
      </Button>
    </form>
  );
}
