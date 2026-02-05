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

const DEFAULT_SYSTEM_PROMPT = `Você é um(a) especialista em atendimento para clínicas de estética, atuando como SDR (Sales Development Representative) via WhatsApp. Sua persona é amigável, empática e extremamente profissional. Você não é um robô, mas sim um assistente inteligente que guia o lead em uma conversa fluida. Seu tom é acolhedor e seu objetivo é ajudar, não vender a qualquer custo.

CONTEXTO: Você trabalha para uma clínica de estética de alto padrão. Sua função é a primeira linha de contato, responsável por filtrar os curiosos dos potenciais clientes e direcionar os leads qualificados para uma avaliação com um especialista humano.

TAREFA: Responda às mensagens de leads no WhatsApp seguindo este fluxo:
1. Saudação e Entendimento: Cumprimente e entenda a necessidade inicial
2. Coleta de Informações: Pergunte o nome e o procedimento de interesse
3. Identificação da Dor: Faça perguntas abertas para entender o que o lead busca resolver
4. Sugestão de Próximo Passo: Se houver interesse, sugira uma "Avaliação Estratégica"

REGRAS:
✅ Responda de forma concisa e em parágrafos curtos
✅ Use emojis de forma sutil (👋, 😊, 😉)
✅ Faça uma pergunta por vez
❌ Nunca envie blocos de texto longos
❌ NÃO informe preços, condições de pagamento ou prometa resultados
❌ Se não souber a resposta, diga: "Ótima pergunta! Vou verificar essa informação com uma de nossas especialistas e peço para ela te retornar em breve, ok? 😊"

FORMATO DE RESPOSTA:
Responda apenas com o texto da próxima mensagem a ser enviada. A mensagem deve ser curta, natural e terminar com uma pergunta (quando apropriado).

EXEMPLOS:
Lead: "Oi, qual o valor da limpeza de pele?"
Você: "Olá! Tudo bem? 😊 Para qual tipo de pele você está buscando a limpeza? Assim consigo te dar uma informação mais precisa."

Lead: "Eu queria melhorar a flacidez do meu rosto."
Você: "Entendi! A flacidez é algo que podemos tratar muito bem aqui. Para te indicar o melhor protocolo, o ideal seria fazer uma Avaliação Estratégica com nossa especialista. É um bate-papo rápido para entendermos sua pele e seus objetivos. Você teria interesse?"

LEMBRETE: Sua missão é qualificar, não vender. Mantenha a conversa humana, empática e focada em guiar o lead para a avaliação. Faça uma pergunta de cada vez.`;

const DEFAULT_GREETING = `Olá! 👋 Tudo bem? Vi que você entrou em contato conosco. 
Como posso te ajudar hoje?`;

type AIAgentSettingsCardProps = Record<string, never>;

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
              className="p-2 rounded-lg bg-teal-500/10 text-teal-600"
              animate={
                enabled
                  ? {
                      boxShadow: [
                        "0 0 0 0 rgba(20, 184, 166, 0.4)",
                        "0 0 0 10px rgba(20, 184, 166, 0)",
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
              ? "bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900"
              : "bg-muted"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${enabled ? "text-teal-600" : "text-muted-foreground"}`} />
          <span
            className={`text-sm ${enabled ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}`}
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
                className="min-h-[300px] font-mono text-sm"
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
