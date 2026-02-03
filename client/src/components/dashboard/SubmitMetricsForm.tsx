import { Check, CheckCircle2, Instagram, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { useAutoSave } from "@/hooks/useAutoSave";
import { useInstagramMetrics } from "@/hooks/useInstagramMetrics";
import { usePreviousMonthMetrics } from "@/hooks/usePreviousMonthMetrics";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { InstagramBadge } from "./InstagramBadge";
import { InstagramOnboardingModal } from "./InstagramOnboardingModal";
import { MetricComparison } from "./MetricComparison";

interface SubmitMetricsFormProps {
  onSuccess?: () => void;
  className?: string;
  /** When true, suggests next month (January 2026) if user has December data */
  suggestNextMonth?: boolean;
}

/**
 * Input component with auto-save indicator
 */
function AutoSaveInput({
  id,
  label,
  value,
  onChange,
  isLoading,
  isSaved,
  onBlur,
  type = "number",
  step,
  placeholder,
  previousValue,
  previousType,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  isSaved: boolean;
  onBlur: (value: number, isEmpty?: boolean) => void;
  type?: string;
  step?: string;
  placeholder?: string;
  previousValue?: number;
  previousType?: "currency" | "number";
}) {
  const handleBlur = () => {
    const isEmpty = value.trim() === "";
    const numValue = type === "number" ? parseFloat(value) : parseInt(value, 10);
    // Pass isEmpty flag to prevent saving empty fields as 0
    onBlur(numValue, isEmpty);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex items-center gap-1 text-xs">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          {isSaved && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Check className="h-3 w-3" />
              Salvo
            </span>
          )}
        </div>
      </div>
      <Input
        id={id}
        type={type}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        className={cn(isSaved && "border-green-500/30")}
      />
      <MetricComparison
        currentValue={parseFloat(value) || undefined}
        previousValue={previousValue}
        type={previousType}
      />
    </div>
  );
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
  const [showInstagramModal, setShowInstagramModal] = useState(false);

  // Track whether the form has been hydrated from server data
  const [isHydrated, setIsHydrated] = useState(false);

  // Track manual edits to prevent Instagram auto-fill from clobbering user input
  const manuallyEditedRef = useRef<Set<string>>(new Set());

  const utils = trpc.useUtils();
  const { data: me } = trpc.mentorados.me.useQuery();
  const mentoradoId = me?.id;

  // Load current metrics for selected ano/mes
  const { data: currentMetrics, isLoading: isLoadingMetrics } = trpc.mentorados.metricaMes.useQuery(
    { ano, mes },
    {
      enabled: !!mentoradoId,
      staleTime: 0, // Always fetch fresh data on month change
    }
  );

  // Hydrate form state when current metrics are loaded or when ano/mes changes
  useEffect(() => {
    // Reset hydration state when period changes
    setIsHydrated(false);
    manuallyEditedRef.current.clear();

    // Wait for query to complete (not loading)
    if (isLoadingMetrics) return;

    // Hydrate from server data (may be undefined for new month)
    if (currentMetrics) {
      setFaturamento(currentMetrics.faturamento?.toString() || "");
      setLucro(currentMetrics.lucro?.toString() || "");
      setPostsFeed(currentMetrics.postsFeed?.toString() || "");
      setStories(currentMetrics.stories?.toString() || "");
      setLeads(currentMetrics.leads?.toString() || "");
      setProcedimentos(currentMetrics.procedimentos?.toString() || "");
      setObservacoes(currentMetrics.observacoes || "");
    } else {
      // Reset to empty for new month (no existing data)
      setFaturamento("");
      setLucro("");
      setPostsFeed("");
      setStories("");
      setLeads("");
      setProcedimentos("");
      setObservacoes("");
    }

    // Mark as hydrated after state is set
    setIsHydrated(true);
  }, [currentMetrics, isLoadingMetrics]);

  // Auto-save hooks for each field (now with isHydrated and lastServerValue)
  const faturamentoSave = useAutoSave({
    fieldName: "faturamento",
    ano,
    mes,
    isHydrated,
    lastServerValue: currentMetrics?.faturamento,
  });
  const lucroSave = useAutoSave({
    fieldName: "lucro",
    ano,
    mes,
    isHydrated,
    lastServerValue: currentMetrics?.lucro,
  });
  const leadsSave = useAutoSave({
    fieldName: "leads",
    ano,
    mes,
    isHydrated,
    lastServerValue: currentMetrics?.leads,
  });
  const procedimentosSave = useAutoSave({
    fieldName: "procedimentos",
    ano,
    mes,
    isHydrated,
    lastServerValue: currentMetrics?.procedimentos,
  });
  const postsFeedSave = useAutoSave({
    fieldName: "postsFeed",
    ano,
    mes,
    isHydrated,
    lastServerValue: currentMetrics?.postsFeed,
  });
  const storiesSave = useAutoSave({
    fieldName: "stories",
    ano,
    mes,
    isHydrated,
    lastServerValue: currentMetrics?.stories,
  });

  // Previous month data
  const { previousMetrics } = usePreviousMonthMetrics({ ano, mes, enabled: true });

  // Instagram metrics
  const { data: instagramData, isLoading: isLoadingInstagram } = useInstagramMetrics({
    ano,
    mes,
    enabled: true,
  });

  // Auto-fill Instagram data when it arrives (only if user hasn't manually edited)
  useEffect(() => {
    if (!instagramData || !isHydrated) return;

    // Auto-fill posts if user hasn't manually edited
    if (!manuallyEditedRef.current.has("postsFeed") && instagramData.posts !== undefined) {
      const newValue = instagramData.posts.toString();
      // Only update if different from current value
      if (postsFeed !== newValue) {
        setPostsFeed(newValue);
        // Trigger auto-save for the Instagram value
        postsFeedSave.handleBlur(instagramData.posts, false);
      }
    }

    // Auto-fill stories if user hasn't manually edited
    if (!manuallyEditedRef.current.has("stories") && instagramData.stories !== undefined) {
      const newValue = instagramData.stories.toString();
      // Only update if different from current value
      if (stories !== newValue) {
        setStories(newValue);
        // Trigger auto-save for the Instagram value
        storiesSave.handleBlur(instagramData.stories, false);
      }
    }
  }, [instagramData, isHydrated, postsFeed, stories, postsFeedSave, storiesSave]);

  // Track manual edits to prevent Instagram auto-fill from overwriting
  const handlePostsFeedChange = (value: string) => {
    manuallyEditedRef.current.add("postsFeed");
    setPostsFeed(value);
  };

  const handleStoriesChange = (value: string) => {
    manuallyEditedRef.current.add("stories");
    setStories(value);
  };

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
      manuallyEditedRef.current.clear();

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
          <AutoSaveInput
            id="faturamento"
            label="Faturamento (R$)"
            value={faturamento}
            onChange={setFaturamento}
            isLoading={faturamentoSave.isLoading}
            isSaved={faturamentoSave.isSaved}
            onBlur={faturamentoSave.handleBlur}
            step="0.01"
            placeholder="0.00"
            previousValue={previousMetrics?.faturamento}
            previousType="currency"
          />

          <AutoSaveInput
            id="lucro"
            label="Lucro (R$)"
            value={lucro}
            onChange={setLucro}
            isLoading={lucroSave.isLoading}
            isSaved={lucroSave.isSaved}
            onBlur={lucroSave.handleBlur}
            step="0.01"
            placeholder="0.00"
            previousValue={previousMetrics?.lucro}
            previousType="currency"
          />
        </div>
      </div>

      {/* Marketing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-1">
          <h4 className="font-medium text-sm text-muted-foreground">Marketing</h4>
          {/* Instagram integration */}
          {instagramData ? (
            <div className="flex gap-2">
              <InstagramBadge
                count={instagramData.posts}
                syncedAt={instagramData.syncedAt}
                type="posts"
              />
              <InstagramBadge
                count={instagramData.stories}
                syncedAt={instagramData.syncedAt}
                type="stories"
              />
            </div>
          ) : !isLoadingInstagram ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowInstagramModal(true)}
              className="text-xs"
            >
              <Instagram className="h-3 w-3 mr-1" />
              Conectar Instagram
            </Button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AutoSaveInput
            id="postsFeed"
            label="Posts Feed"
            value={postsFeed}
            onChange={handlePostsFeedChange}
            isLoading={postsFeedSave.isLoading}
            isSaved={postsFeedSave.isSaved}
            onBlur={postsFeedSave.handleBlur}
            placeholder="0"
            previousValue={previousMetrics?.postsFeed}
          />

          <AutoSaveInput
            id="stories"
            label="Stories"
            value={stories}
            onChange={handleStoriesChange}
            isLoading={storiesSave.isLoading}
            isSaved={storiesSave.isSaved}
            onBlur={storiesSave.handleBlur}
            placeholder="0"
            previousValue={previousMetrics?.stories}
          />
        </div>
      </div>

      {/* Operacional */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">Operacional</h4>
        <div className="grid grid-cols-2 gap-4">
          <AutoSaveInput
            id="leads"
            label="Leads"
            value={leads}
            onChange={setLeads}
            isLoading={leadsSave.isLoading}
            isSaved={leadsSave.isSaved}
            onBlur={leadsSave.handleBlur}
            placeholder="0"
            previousValue={previousMetrics?.leads}
          />

          <AutoSaveInput
            id="procedimentos"
            label="Procedimentos"
            value={procedimentos}
            onChange={setProcedimentos}
            isLoading={procedimentosSave.isLoading}
            isSaved={procedimentosSave.isSaved}
            onBlur={procedimentosSave.handleBlur}
            placeholder="0"
            previousValue={previousMetrics?.procedimentos}
          />
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

      {/* Instagram Onboarding Modal */}
      <InstagramOnboardingModal
        mentoradoId={mentoradoId}
        isOpen={showInstagramModal}
        onOpenChange={setShowInstagramModal}
      />
    </form>
  );
}
