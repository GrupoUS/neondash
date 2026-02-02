/**
 * AI Agent Settings Card Component
 * Configure AI SDR automations for WhatsApp responses
 */

import { motion } from "framer-motion";
import {
  Bot,
  Clock,
  Loader2,
  MessageSquare,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const DAYS_OF_WEEK = [
  { value: "0", label: "Dom" },
  { value: "1", label: "Seg" },
  { value: "2", label: "Ter" },
  { value: "3", label: "Qua" },
  { value: "4", label: "Qui" },
  { value: "5", label: "Sex" },
  { value: "6", label: "Sáb" },
];

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente de atendimento profissional para uma clínica de estética. 
Seu objetivo é qualificar leads de forma amigável e profissional.

Diretrizes:
- Seja educado e empático
- Responda de forma concisa e natural
- Faça perguntas para entender as necessidades do cliente
- Colete informações: nome, procedimento de interesse, disponibilidade
- Se o cliente demonstrar interesse, sugira agendar uma consulta
- Não faça promessas sobre preços ou resultados
- Se não souber responder algo, diga que um especialista entrará em contato`;

const DEFAULT_GREETING = `Olá! 👋 Tudo bem? Vi que você entrou em contato conosco. 
Como posso te ajudar hoje?`;

type AIAgentSettingsCardProps = {};

export function AIAgentSettingsCard(_props: AIAgentSettingsCardProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [greetingMessage, setGreetingMessage] = useState(DEFAULT_GREETING);
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
  const [workingDays, setWorkingDays] = useState<string[]>(["1", "2", "3", "4", "5"]);
  const [responseDelayMs, setResponseDelayMs] = useState(3000);

  // Get current config
  const { data: config, isLoading } = trpc.aiAgent.getConfig.useQuery();

  // Mutations
  const updateMutation = trpc.aiAgent.upsertConfig.useMutation({
    onSuccess: () => setIsDirty(false),
  });

  const toggleMutation = trpc.aiAgent.toggleEnabled.useMutation();

  const resetMutation = trpc.aiAgent.resetToDefaults.useMutation({
    onSuccess: () => {
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      setGreetingMessage(DEFAULT_GREETING);
      setWorkingHoursStart("09:00");
      setWorkingHoursEnd("18:00");
      setWorkingDays(["1", "2", "3", "4", "5"]);
      setResponseDelayMs(3000);
      setIsDirty(true);
    },
  });

  // Populate form from config
  useEffect(() => {
    if (config) {
      setEnabled(config.enabled === "sim");
      setSystemPrompt(config.systemPrompt || DEFAULT_SYSTEM_PROMPT);
      setGreetingMessage(config.greetingMessage || DEFAULT_GREETING);
      setWorkingHoursStart(config.workingHoursStart || "09:00");
      setWorkingHoursEnd(config.workingHoursEnd || "18:00");
      setWorkingDays((config.workingDays || "1,2,3,4,5").split(","));
      setResponseDelayMs(config.responseDelayMs || 3000);
    }
  }, [config]);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    toggleMutation.mutate();
  };

  const handleDayToggle = (day: string) => {
    setIsDirty(true);
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = () => {
    updateMutation.mutate({
      enabled: enabled ? "sim" : "nao",
      systemPrompt,
      greetingMessage,
      workingHoursStart,
      workingHoursEnd,
      workingDays: workingDays.join(","),
      responseDelayMs,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-lg bg-purple-500/10 text-purple-600"
              animate={
                enabled
                  ? {
                      boxShadow: [
                        "0 0 0 0 rgba(168, 85, 247, 0.4)",
                        "0 0 0 10px rgba(168, 85, 247, 0)",
                      ],
                    }
                  : {}
              }
              transition={enabled ? { duration: 1.5, repeat: Infinity } : {}}
            >
              <Bot className="w-5 h-5" />
            </motion.div>
            <div>
              <CardTitle className="text-lg">Agente IA</CardTitle>
              <CardDescription>Respostas automáticas de qualificação</CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={toggleMutation.isPending}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status indicator */}
        <div
          className={`flex items-center gap-2 p-3 rounded-lg ${
            enabled
              ? "bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900"
              : "bg-muted"
          }`}
        >
          <Sparkles
            className={`w-4 h-4 ${enabled ? "text-purple-600" : "text-muted-foreground"}`}
          />
          <span
            className={`text-sm ${enabled ? "text-purple-700 dark:text-purple-400" : "text-muted-foreground"}`}
          >
            {enabled
              ? "Agente ativo e respondendo automaticamente"
              : "Agente desativado - mensagens não serão respondidas"}
          </span>
        </div>

        {/* Greeting Message */}
        <div className="space-y-2">
          <Label htmlFor="greeting" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Mensagem de Saudação
          </Label>
          <Textarea
            id="greeting"
            value={greetingMessage}
            onChange={(e) => {
              setGreetingMessage(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Mensagem enviada automaticamente no primeiro contato..."
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            Enviada automaticamente quando um novo contato envia a primeira mensagem
          </p>
        </div>

        {/* Working Hours */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horário de Funcionamento
          </Label>

          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={workingDays.includes(day.value)}
                  onCheckedChange={() => handleDayToggle(day.value)}
                />
                <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="start-time" className="text-sm whitespace-nowrap">
                Das
              </Label>
              <Input
                id="start-time"
                type="time"
                value={workingHoursStart}
                onChange={(e) => {
                  setWorkingHoursStart(e.target.value);
                  setIsDirty(true);
                }}
                className="w-28"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end-time" className="text-sm whitespace-nowrap">
                até
              </Label>
              <Input
                id="end-time"
                type="time"
                value={workingHoursEnd}
                onChange={(e) => {
                  setWorkingHoursEnd(e.target.value);
                  setIsDirty(true);
                }}
                className="w-28"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Advanced Settings */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Configurações Avançadas
              </span>
              <motion.span
                animate={{ rotate: isAdvancedOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="system-prompt">Prompt do Sistema</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Instruções para o comportamento do agente..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Define a personalidade e diretrizes do agente de IA
              </p>
            </div>

            {/* Response Delay */}
            <div className="space-y-2">
              <Label htmlFor="delay">Delay de Resposta (ms)</Label>
              <Input
                id="delay"
                type="number"
                value={responseDelayMs}
                onChange={(e) => {
                  setResponseDelayMs(Number(e.target.value));
                  setIsDirty(true);
                }}
                min={1000}
                max={10000}
                step={500}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Tempo de espera antes de enviar resposta automática (1000-10000ms)
              </p>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Padrões
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!isDirty || updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}

export default AIAgentSettingsCard;
