/**
 * Campaign Dashboard - Overview of all marketing campaigns
 * KPI cards + campaign list + quick actions
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Instagram,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Plus,
  Send,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NeonCard,
  NeonCardContent,
  NeonCardHeader,
  NeonCardTitle,
} from "@/components/ui/neon-card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Types
interface CampaignStats {
  activeCampaigns: number;
  messagesSentToday: number;
  scheduledPosts: number;
  deliveryRate: number;
}

interface Campaign {
  id: number;
  name: string;
  type: "whatsapp" | "instagram";
  status: WhatsAppCampaignStatus;
  messagesSent?: number;
  messagesDelivered?: number;
  targetContactsCount?: number;
  scheduledFor?: Date | null;
  createdAt: Date;
}

type WhatsAppCampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "paused" | "failed";

function normalizeCampaignStatus(status: string): WhatsAppCampaignStatus {
  switch (status) {
    case "draft":
    case "scheduled":
    case "sending":
    case "sent":
    case "paused":
    case "failed":
      return status;
    default:
      return "draft";
  }
}

// KPI Card Component
function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  color: "blue" | "green" | "amber" | "gold";
  isLoading?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  const colorMap = {
    blue: "from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400",
    green: "from-green-500/20 to-green-500/5 text-green-600 dark:text-green-400",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
    gold: "from-primary/25 to-primary/5 text-primary",
  };

  if (isLoading) {
    return (
      <NeonCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </NeonCard>
    );
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? undefined : { duration: 0.3 }}
    >
      <NeonCard
        variant="default"
        className="p-6 transition-shadow hover:shadow-lg focus-within:ring-2 focus-within:ring-ring/40"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight tabular-nums">{value}</h3>
              {trend && (
                <span
                  className={cn(
                    "text-xs font-medium flex items-center gap-1",
                    trend.positive ? "text-green-600" : "text-red-500"
                  )}
                >
                  <TrendingUp className={cn("h-3 w-3", !trend.positive && "rotate-180")} />
                  {trend.value}%
                </span>
              )}
            </div>
          </div>
          <div className={cn("p-3 rounded-xl bg-gradient-to-br", colorMap[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </NeonCard>
    </motion.div>
  );
}

// Campaign Card Component
function CampaignCard({ campaign }: { campaign: Campaign }) {
  const shouldReduceMotion = useReducedMotion();

  const statusConfig: Record<
    WhatsAppCampaignStatus,
    { label: string; color: string; icon: React.ElementType }
  > = {
    draft: {
      label: "Rascunho",
      color: "bg-muted text-muted-foreground border-border",
      icon: Clock,
    },
    scheduled: {
      label: "Agendada",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: Calendar,
    },
    sending: {
      label: "Enviando",
      color: "bg-sky-500/10 text-sky-600 border-sky-500/20",
      icon: Loader2,
    },
    sent: {
      label: "Enviada",
      color: "bg-green-500/10 text-green-600 border-green-500/20",
      icon: CheckCircle2,
    },
    paused: {
      label: "Pausada",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: Pause,
    },
    failed: {
      label: "Falha",
      color: "bg-red-500/10 text-red-600 border-red-500/20",
      icon: AlertTriangle,
    },
  };

  const config = statusConfig[campaign.status] ?? statusConfig.draft;
  const StatusIcon = config.icon;

  const deliveryRate =
    campaign.messagesSent && campaign.messagesDelivered
      ? Math.round((campaign.messagesDelivered / campaign.messagesSent) * 100)
      : 0;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
      transition={shouldReduceMotion ? undefined : { duration: 0.2 }}
    >
      <NeonCard className="group p-4 transition-all hover:shadow-md hover:border-primary/30 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/40">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Campaign Type Icon */}
            <div
              className={cn(
                "p-2 rounded-lg",
                campaign.type === "whatsapp"
                  ? "bg-green-500/10 text-green-600"
                  : "bg-gradient-to-br from-pink-500/10 to-purple-500/10 text-pink-600"
              )}
            >
              {campaign.type === "whatsapp" ? (
                <MessageSquare className="h-5 w-5" />
              ) : (
                <Instagram className="h-5 w-5" />
              )}
            </div>

            {/* Campaign Info */}
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {campaign.name}
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={config.color}>
                  <StatusIcon
                    className={cn(
                      "h-3 w-3 mr-1",
                      campaign.status === "sending" && !shouldReduceMotion && "animate-spin"
                    )}
                  />
                  {config.label}
                </Badge>
                {campaign.scheduledFor && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(campaign.scheduledFor).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 opacity-100 transition-opacity sm:h-10 sm:w-10 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                aria-label={`Abrir ações da campanha ${campaign.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              {campaign.status === "paused" && <DropdownMenuItem>Retomar</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats (for active/completed campaigns) */}
        {campaign.messagesSent !== undefined && campaign.messagesSent > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {campaign.messagesDelivered} de {campaign.messagesSent} entregues
              </span>
              <span className="font-medium text-foreground tabular-nums">{deliveryRate}%</span>
            </div>
            <Progress value={deliveryRate} className="mt-2 h-1.5" />
          </div>
        )}
      </NeonCard>
    </motion.div>
  );
}

// Main Component
export function CampaignDashboard() {
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignPlatform, setCampaignPlatform] = useState<"whatsapp" | "instagram" | "both">(
    "whatsapp"
  );
  const [campaignDescription, setCampaignDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch WhatsApp campaigns
  const {
    data: whatsappCampaigns,
    isLoading: isLoadingCampaigns,
    refetch,
  } = trpc.marketing.listCampaigns.useQuery();

  // Create campaign mutation
  const createCampaign = trpc.marketing.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campanha criada com sucesso!");
      setIsDialogOpen(false);
      setCampaignName("");
      setCampaignDescription("");
      setIsCreating(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar campanha: ${error.message}`);
      setIsCreating(false);
    },
  });

  // Handle create campaign
  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error("Digite um nome para a campanha");
      return;
    }
    setIsCreating(true);
    await createCampaign.mutateAsync({
      name: campaignName,
      platform: campaignPlatform,
      description: campaignDescription || undefined,
    });
  };

  // Mock stats (TODO: create aggregate endpoint)
  const stats: CampaignStats = {
    activeCampaigns:
      whatsappCampaigns?.filter((c) => c.status === "sending" || c.status === "scheduled").length ??
      0,
    messagesSentToday: whatsappCampaigns?.reduce((acc, c) => acc + (c.messagesSent ?? 0), 0) ?? 0,
    scheduledPosts: whatsappCampaigns?.filter((c) => c.scheduledFor).length ?? 0,
    deliveryRate: 94.5,
  };

  // Transform campaigns
  const campaigns: Campaign[] =
    whatsappCampaigns?.map((c) => ({
      id: c.id,
      name: c.name,
      type: "whatsapp" as const,
      status: normalizeCampaignStatus(c.status),
      messagesSent: c.messagesSent ?? 0,
      messagesDelivered: c.messagesDelivered ?? 0,
      targetContactsCount: c.targetContactsCount ?? 0,
      scheduledFor: c.scheduledFor ? new Date(c.scheduledFor) : null,
      createdAt: new Date(c.createdAt),
    })) ?? [];

  return (
    <section className="space-y-6" aria-label="Resumo de campanhas de marketing">
      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Campanhas Ativas"
          value={stats.activeCampaigns}
          icon={Zap}
          color="blue"
          isLoading={isLoadingCampaigns}
        />
        <KPICard
          title="Mensagens Hoje"
          value={stats.messagesSentToday.toLocaleString("pt-BR")}
          icon={Send}
          trend={{ value: 12, positive: true }}
          color="green"
          isLoading={isLoadingCampaigns}
        />
        <KPICard
          title="Posts Agendados"
          value={stats.scheduledPosts}
          icon={Calendar}
          color="amber"
          isLoading={isLoadingCampaigns}
        />
        <KPICard
          title="Taxa de Entrega"
          value={`${stats.deliveryRate}%`}
          icon={CheckCircle2}
          trend={{ value: 2.3, positive: true }}
          color="gold"
          isLoading={isLoadingCampaigns}
        />
      </div>

      {/* Campaigns Section */}
      <NeonCard>
        <NeonCardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <NeonCardTitle className="text-xl">Campanhas Recentes</NeonCardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe status, entregas e ações rápidas das últimas campanhas.
            </p>
          </div>
          <Button className="min-h-11 gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova Campanha
          </Button>
        </NeonCardHeader>
        <NeonCardContent className="pt-2">
          {isLoadingCampaigns ? (
            <div className="space-y-3" aria-live="polite">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma campanha ainda</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Crie sua primeira campanha de WhatsApp ou Instagram para começar a engajar seus
                leads.
              </p>
              <Button className="min-h-11 gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Criar Primeira Campanha
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </NeonCardContent>
      </NeonCard>

      {/* Create Campaign Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
            <DialogDescription>
              Crie uma nova campanha de marketing para engajar seus leads.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Nome da Campanha *</Label>
              <Input
                id="campaign-name"
                placeholder="Ex: Promoção de Verão"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                maxLength={120}
                name="campaignName"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground text-right tabular-nums">
                {campaignName.length}/120
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="campaign-platform">Plataforma</Label>
              <Select
                value={campaignPlatform}
                onValueChange={(v) => setCampaignPlatform(v as typeof campaignPlatform)}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      WhatsApp
                    </span>
                  </SelectItem>
                  <SelectItem value="instagram">
                    <span className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram
                    </span>
                  </SelectItem>
                  <SelectItem value="both">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600" />
                      Ambos
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="campaign-description">Descrição (opcional)</Label>
              <Textarea
                id="campaign-description"
                placeholder="Descreva o objetivo da campanha…"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                rows={3}
                maxLength={300}
                name="campaignDescription"
              />
              <p className="text-xs text-muted-foreground text-right tabular-nums">
                {campaignDescription.length}/300
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
              className="min-h-11"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={isCreating || !campaignName.trim()}
              className="min-h-11"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando…
                </>
              ) : (
                "Criar Campanha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
