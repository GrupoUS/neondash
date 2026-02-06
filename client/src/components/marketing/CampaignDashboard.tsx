/**
 * Campaign Dashboard - Overview of all marketing campaigns
 * KPI cards + campaign list + quick actions
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Instagram,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
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
  status: "active" | "paused" | "completed" | "draft";
  messagesSent?: number;
  messagesDelivered?: number;
  targetContactsCount?: number;
  scheduledFor?: Date | null;
  createdAt: Date;
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
  color: "blue" | "green" | "amber" | "purple";
  isLoading?: boolean;
}) {
  const colorMap = {
    blue: "from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400",
    green: "from-green-500/20 to-green-500/5 text-green-600 dark:text-green-400",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
    purple: "from-purple-500/20 to-purple-500/5 text-purple-600 dark:text-purple-400",
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <NeonCard variant="default" className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
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
  const statusConfig = {
    active: {
      label: "Ativa",
      color: "bg-green-500/10 text-green-600 border-green-500/20",
      icon: Play,
    },
    paused: {
      label: "Pausada",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: Pause,
    },
    completed: {
      label: "Concluída",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: CheckCircle2,
    },
    draft: {
      label: "Rascunho",
      color: "bg-muted text-muted-foreground border-border",
      icon: Clock,
    },
  };

  const config = statusConfig[campaign.status];
  const StatusIcon = config.icon;

  const deliveryRate =
    campaign.messagesSent && campaign.messagesDelivered
      ? Math.round((campaign.messagesDelivered / campaign.messagesSent) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <NeonCard className="p-4 hover:shadow-md transition-all cursor-pointer group">
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
                  <StatusIcon className="h-3 w-3 mr-1" />
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
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              {campaign.status === "active" && <DropdownMenuItem>Pausar</DropdownMenuItem>}
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
              <span className="font-medium text-foreground">{deliveryRate}%</span>
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
  } = trpc.zapi.listCampaigns.useQuery();

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
      status: c.status as Campaign["status"],
      messagesSent: c.messagesSent ?? 0,
      messagesDelivered: c.messagesDelivered ?? 0,
      targetContactsCount: c.targetContactsCount ?? 0,
      scheduledFor: c.scheduledFor ? new Date(c.scheduledFor) : null,
      createdAt: new Date(c.createdAt),
    })) ?? [];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          color="purple"
          isLoading={isLoadingCampaigns}
        />
      </div>

      {/* Campaigns Section */}
      <NeonCard>
        <NeonCardHeader className="flex flex-row items-center justify-between">
          <NeonCardTitle className="text-xl">Campanhas Recentes</NeonCardTitle>
          <Button className="gap-2" size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
        </NeonCardHeader>
        <NeonCardContent className="pt-2">
          {isLoadingCampaigns ? (
            <div className="space-y-3">
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
              <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
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
        <DialogContent className="sm:max-w-[500px]">
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="campaign-platform">Plataforma</Label>
              <Select
                value={campaignPlatform}
                onValueChange={(v) => setCampaignPlatform(v as typeof campaignPlatform)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="instagram">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600" />
                      Ambos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="campaign-description">Descrição (opcional)</Label>
              <Textarea
                id="campaign-description"
                placeholder="Descreva o objetivo da campanha..."
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCampaign} disabled={isCreating || !campaignName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Campanha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
