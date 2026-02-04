import { Bell, Check, Mail, MessageSquare, Save, Settings } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animation-variants";
import { trpc } from "@/lib/trpc";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface NotificationSettings {
  id: number;
  reminderDays: number[];
  metricsRemindersEnabled: boolean;
  badgeNotificationsEnabled: boolean;
  rankingNotificationsEnabled: boolean;
  emailTemplates: Record<string, { subject?: string; body?: string }>;
  inAppTemplates: Record<string, { title?: string; message?: string }>;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function NotificationsSettingsView() {
  const { toast } = useToast();

  // Query settings
  const settingsQuery = trpc.notifications.getSettings.useQuery();
  const updateMutation = trpc.notifications.updateSettings.useMutation({
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações de notificação foram atualizadas.",
      });
      settingsQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Local state
  const [reminderDays, setReminderDays] = useState<number[]>([1, 3, 6, 11]);
  const [metricsEnabled, setMetricsEnabled] = useState(true);
  const [badgesEnabled, setBadgesEnabled] = useState(true);
  const [rankingEnabled, setRankingEnabled] = useState(true);

  // Initialize from query data
  useEffect(() => {
    if (settingsQuery.data) {
      setReminderDays(settingsQuery.data.reminderDays);
      setMetricsEnabled(settingsQuery.data.metricsRemindersEnabled);
      setBadgesEnabled(settingsQuery.data.badgeNotificationsEnabled);
      setRankingEnabled(settingsQuery.data.rankingNotificationsEnabled);
    }
  }, [settingsQuery.data]);

  // Toggle a reminder day
  const toggleDay = (day: number) => {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  // Save settings
  const handleSave = () => {
    updateMutation.mutate({
      reminderDays,
      metricsRemindersEnabled: metricsEnabled ? "sim" : "nao",
      badgeNotificationsEnabled: badgesEnabled ? "sim" : "nao",
      rankingNotificationsEnabled: rankingEnabled ? "sim" : "nao",
    });
  };

  const isLoading = settingsQuery.isLoading;
  const isSaving = updateMutation.isPending;

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações de Notificações</h2>
          <p className="text-muted-foreground">
            Configure a frequência, tipos e textos das notificações enviadas aos mentorados.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </motion.div>

      <Separator />

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="schedule" className="gap-2">
            <Bell className="h-4 w-4" />
            Frequência
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2">
            <Settings className="h-4 w-4" />
            Tipos
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* SCHEDULE TAB */}
        <TabsContent value="schedule">
          <motion.div variants={slideUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Dias de Envio de Lembretes
                </CardTitle>
                <CardDescription>
                  Selecione os dias do mês em que os lembretes de métricas serão enviados
                  automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Day selector grid */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((day) => {
                    const isSelected = reminderDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        disabled={isLoading}
                        className={`
                          relative flex items-center justify-center h-12 w-full rounded-lg border-2 font-semibold text-lg transition-all
                          ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-md"
                              : "border-muted bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                          }
                        `}
                      >
                        {day}
                        {isSelected && (
                          <Check className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full p-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Dias selecionados:</strong>{" "}
                    {reminderDays.length > 0 ? reminderDays.join(", ") : "Nenhum dia selecionado"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lembretes serão enviados nos dias selecionados de cada mês para mentorados que
                    ainda não registraram suas métricas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* TYPES TAB */}
        <TabsContent value="types">
          <motion.div variants={slideUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Tipos de Notificação
                </CardTitle>
                <CardDescription>
                  Ative ou desative cada tipo de notificação enviada aos mentorados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metrics Reminders */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="space-y-1">
                    <Label htmlFor="metrics-toggle" className="text-base font-medium">
                      Lembretes de Métricas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações para lembrar mentorados de enviar suas métricas mensais.
                    </p>
                  </div>
                  <Switch
                    id="metrics-toggle"
                    checked={metricsEnabled}
                    onCheckedChange={setMetricsEnabled}
                    disabled={isLoading}
                  />
                </div>

                {/* Badge Notifications */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="space-y-1">
                    <Label htmlFor="badges-toggle" className="text-base font-medium">
                      Notificações de Badges
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas quando mentorados conquistam novas badges e conquistas.
                    </p>
                  </div>
                  <Switch
                    id="badges-toggle"
                    checked={badgesEnabled}
                    onCheckedChange={setBadgesEnabled}
                    disabled={isLoading}
                  />
                </div>

                {/* Ranking Notifications */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="space-y-1">
                    <Label htmlFor="ranking-toggle" className="text-base font-medium">
                      Notificações de Ranking
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Atualizações sobre mudanças de posição no ranking mensal.
                    </p>
                  </div>
                  <Switch
                    id="ranking-toggle"
                    checked={rankingEnabled}
                    onCheckedChange={setRankingEnabled}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates">
          <motion.div variants={slideUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Templates de Mensagem
                </CardTitle>
                <CardDescription>
                  Personalize os textos das notificações enviadas por email e no app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 rounded-lg bg-muted/30 border text-center">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    A personalização de templates estará disponível em breve.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Por enquanto, os templates padrão do sistema estão sendo utilizados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
