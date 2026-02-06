/**
 * WhatsApp Campaigns - Bulk messaging campaign management
 * Campaign list + builder wizard + delivery stats
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  MessageSquare,
  Pause,
  Plus,
  Send,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NeonCard,
  NeonCardContent,
  NeonCardHeader,
  NeonCardTitle,
} from "@/components/ui/neon-card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Types
interface SegmentationFilters {
  status?: string[];
  tags?: string[];
  lastInteractionDaysAgo?: number;
  source?: string[];
}

const LEAD_STATUSES = [
  { value: "novo", label: "Novo", color: "bg-blue-500" },
  { value: "contatado", label: "Contatado", color: "bg-yellow-500" },
  { value: "qualificado", label: "Qualificado", color: "bg-green-500" },
  { value: "agendado", label: "Agendado", color: "bg-purple-500" },
  { value: "convertido", label: "Convertido", color: "bg-emerald-500" },
  { value: "perdido", label: "Perdido", color: "bg-red-500" },
];

// Campaign Builder Steps
const STEPS = [
  { id: 1, title: "Mensagem" },
  { id: 2, title: "Audiência" },
  { id: 3, title: "Revisão" },
];

// Step Progress Component
function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              currentStep > step.id && "bg-primary text-primary-foreground",
              currentStep === step.id && "bg-primary text-primary-foreground",
              currentStep < step.id && "bg-muted text-muted-foreground"
            )}
          >
            {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
          </div>
          <span
            className={cn(
              "ml-2 text-sm font-medium hidden sm:block",
              currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {step.title}
          </span>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                "w-8 h-0.5 mx-2 rounded",
                currentStep > step.id ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Step 1: Message Composition
function MessageStep({
  name,
  message,
  onNameChange,
  onMessageChange,
}: {
  name: string;
  message: string;
  onNameChange: (v: string) => void;
  onMessageChange: (v: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="campaign-name">Nome da Campanha</Label>
        <Input
          id="campaign-name"
          placeholder="Ex: Promoção Janeiro"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensagem</Label>
        <Textarea
          id="message"
          placeholder="Olá {nome}! Temos uma oferta especial para você..."
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="min-h-[150px]"
          maxLength={4096}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Use {"{nome}"} para personalizar</span>
          <span>{message.length}/4096</span>
        </div>
      </div>

      {/* Message Preview */}
      <NeonCard variant="glass" className="p-4">
        <p className="text-sm font-medium mb-2">Preview</p>
        <div className="bg-green-500/10 text-green-900 dark:text-green-100 p-3 rounded-lg max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">
            {message.replace("{nome}", "João") || "Sua mensagem aparecerá aqui..."}
          </p>
          <span className="text-xs opacity-70 mt-1 block">12:30</span>
        </div>
      </NeonCard>
    </motion.div>
  );
}

// Step 2: Audience Segmentation
function AudienceStep({
  filters,
  onFiltersChange,
  contactCount,
  isLoadingCount,
}: {
  filters: SegmentationFilters;
  onFiltersChange: (f: SegmentationFilters) => void;
  contactCount: number;
  isLoadingCount: boolean;
}) {
  const toggleStatus = (status: string) => {
    const current = filters.status || [];
    if (current.includes(status)) {
      onFiltersChange({ ...filters, status: current.filter((s) => s !== status) });
    } else {
      onFiltersChange({ ...filters, status: [...current, status] });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Contact Count Preview */}
      <NeonCard variant="glow" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contatos selecionados</p>
              <p className="text-2xl font-bold">
                {isLoadingCount ? (
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                ) : (
                  contactCount.toLocaleString("pt-BR")
                )}
              </p>
            </div>
          </div>
          <Filter className="h-5 w-5 text-muted-foreground" />
        </div>
      </NeonCard>

      {/* Status Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Status do Lead</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LEAD_STATUSES.map((status) => (
            <label
              key={status.value}
              htmlFor={`status-${status.value}`}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                filters.status?.includes(status.value)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Checkbox
                id={`status-${status.value}`}
                checked={filters.status?.includes(status.value) ?? false}
                onCheckedChange={() => toggleStatus(status.value)}
              />
              <div className={cn("w-2 h-2 rounded-full", status.color)} />
              <span className="text-sm">{status.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Interaction Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Última interação (últimos {filters.lastInteractionDaysAgo || 30} dias)
        </Label>
        <Slider
          defaultValue={[filters.lastInteractionDaysAgo || 30]}
          max={90}
          min={1}
          step={1}
          onValueChange={(v) => onFiltersChange({ ...filters, lastInteractionDaysAgo: v[0] })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 dia</span>
          <span>90 dias</span>
        </div>
      </div>
    </motion.div>
  );
}

// Step 3: Review & Confirm
function ReviewStep({
  name,
  message,
  filters,
  contactCount,
}: {
  name: string;
  message: string;
  filters: SegmentationFilters;
  contactCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <NeonCard className="p-4 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Nome da Campanha</p>
          <p className="font-medium">{name}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{message}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Contatos</p>
            <p className="text-xl font-bold text-primary">{contactCount.toLocaleString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Filtros Ativos</p>
            <div className="flex gap-1 flex-wrap">
              {filters.status?.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
              {filters.lastInteractionDaysAgo && (
                <Badge variant="outline" className="text-xs">
                  {filters.lastInteractionDaysAgo}d
                </Badge>
              )}
            </div>
          </div>
        </div>
      </NeonCard>

      {/* Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          ⚠️ A campanha será enviada para <strong>{contactCount} contatos</strong>. Esta ação não
          pode ser desfeita.
        </p>
      </div>
    </motion.div>
  );
}

// Campaign Builder Dialog
function CampaignBuilderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState<SegmentationFilters>({
    lastInteractionDaysAgo: 30,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Contact count query
  const { data: countData, isLoading: isLoadingCount } = trpc.zapi.countSegmentedContacts.useQuery(
    { filters },
    { enabled: open && step >= 2 }
  );

  const contactCount = countData?.count ?? 0;

  // Create campaign mutation
  const createCampaign = trpc.zapi.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campanha criada com sucesso!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Send campaign mutation
  const sendCampaign = trpc.zapi.sendCampaign.useMutation();

  const resetForm = () => {
    setStep(1);
    setName("");
    setMessage("");
    setFilters({ lastInteractionDaysAgo: 30 });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const result = await createCampaign.mutateAsync({
        name,
        message,
        targetFilter: filters,
      });

      // Optionally send immediately
      if (result.campaignId) {
        await sendCampaign.mutateAsync({ campaignId: result.campaignId });
        toast.success("Campanha enviada!");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = step === 1 ? name && message : step === 2 ? contactCount > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Campanha WhatsApp</DialogTitle>
          <DialogDescription>Crie e envie mensagens em massa para seus leads</DialogDescription>
        </DialogHeader>

        {/* Step Progress */}
        <div className="py-4">
          <StepProgress currentStep={step} />
        </div>

        {/* Step Content */}
        <ScrollArea className="max-h-[400px] pr-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <MessageStep
                key="step1"
                name={name}
                message={message}
                onNameChange={setName}
                onMessageChange={setMessage}
              />
            )}
            {step === 2 && (
              <AudienceStep
                key="step2"
                filters={filters}
                onFiltersChange={setFilters}
                contactCount={contactCount}
                isLoadingCount={isLoadingCount}
              />
            )}
            {step === 3 && (
              <ReviewStep
                key="step3"
                name={name}
                message={message}
                filters={filters}
                contactCount={contactCount}
              />
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer Navigation */}
        <DialogFooter className="gap-2 sm:gap-0">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={isCreating}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} disabled={!canProceed}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating || contactCount === 0}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Campanha
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export function WhatsAppCampaigns() {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Fetch campaigns
  const { data: campaigns, isLoading } = trpc.zapi.listCampaigns.useQuery();

  const statusConfig = {
    draft: { label: "Rascunho", icon: Clock, color: "text-muted-foreground" },
    pending: { label: "Pendente", icon: Clock, color: "text-amber-600" },
    sending: { label: "Enviando", icon: Loader2, color: "text-blue-600" },
    completed: { label: "Concluída", icon: CheckCircle2, color: "text-green-600" },
    paused: { label: "Pausada", icon: Pause, color: "text-amber-600" },
    cancelled: { label: "Cancelada", icon: X, color: "text-red-600" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            Campanhas WhatsApp
          </h2>
          <p className="text-muted-foreground mt-1">
            Envie mensagens em massa para seus leads segmentados
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsBuilderOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Campaign List */}
      <NeonCard>
        <NeonCardHeader>
          <NeonCardTitle className="text-lg">Todas as Campanhas</NeonCardTitle>
        </NeonCardHeader>
        <NeonCardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !campaigns?.length ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma campanha</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Crie sua primeira campanha para enviar mensagens em massa.
              </p>
              <Button onClick={() => setIsBuilderOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Campanha
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const config =
                  statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.draft;
                const StatusIcon = config.icon;
                const deliveryRate =
                  campaign.messagesSent && campaign.messagesDelivered
                    ? Math.round((campaign.messagesDelivered / campaign.messagesSent) * 100)
                    : 0;

                return (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <StatusIcon className={cn("h-4 w-4", config.color)} />
                          <span>{config.label}</span>
                          {(campaign.messagesSent ?? 0) > 0 && (
                            <>
                              <span>•</span>
                              <span>{campaign.messagesSent} enviadas</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {(campaign.messagesSent ?? 0) > 0 && (
                      <div className="hidden sm:flex items-center gap-4">
                        <div className="w-24">
                          <Progress value={deliveryRate} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{deliveryRate}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </NeonCardContent>
      </NeonCard>

      {/* Campaign Builder Dialog */}
      <CampaignBuilderDialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen} />
    </div>
  );
}
