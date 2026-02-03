import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, ListTodo, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti"; // Using Confetti again as requested in AT-004 logic
import { useWindowSize } from "react-use"; // Ensure react-use is installed or remove if unused (kept from original intent)
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CelebrationEffect } from "@/components/ui/celebration-effect";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

interface AITasksCardProps {
  mentoradoId?: number;
  isAdmin?: boolean;
}

export function AITasksCard({ mentoradoId, isAdmin }: AITasksCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState("ai");
  const { width, height } = useWindowSize();

  // Cleanup confetti timeout on unmount to avoid stale setState
  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) {
        window.clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  const {
    data: tasksData,
    isLoading,
    refetch,
  } = trpc.tasks.list.useQuery(
    {
      mentoradoId,
      search: "",
    },
    {
      enabled: !!mentoradoId || !isAdmin,
    }
  );

  const generateMutation = trpc.tasks.generateFromAI.useMutation({
    onSuccess: (data) => {
      toast.success("Plano Tático Gerado!", {
        description: `${data.count} novas missões foram adicionadas ao seu painel.`,
      });
      refetch();
      setActiveTab("ai");
    },
    onError: (err) => {
      toast.error("Erro ao gerar plano", {
        description: err.message,
      });
    },
  });

  const toggleMutation = trpc.tasks.toggle.useMutation({
    onSuccess: (data) => {
      if (data.status === "done") {
        const isAiTask = data.source === "ai_coach" || data.category === "atividade";
        if (isAiTask) {
          setShowConfetti(true);
          if (confettiTimeoutRef.current) {
            window.clearTimeout(confettiTimeoutRef.current);
          }
          confettiTimeoutRef.current = window.setTimeout(() => {
            setShowConfetti(false);
            confettiTimeoutRef.current = null;
          }, 5000);
          toast.success("Missão Cumprida! 🚀");
        } else {
          toast.success("Tarefa concluída!");
        }
      }
      refetch();
    },
  });

  // Filter Tasks
  const aiTasks =
    tasksData?.filter((t) => t.source === "ai_coach" || t.category === "atividade") || [];
  const manualTasks =
    tasksData?.filter((t) => t.source !== "ai_coach" && t.category !== "atividade") || [];

  const completedAiTasks = aiTasks.filter((t) => t.status === "done").length;
  const totalAiTasks = aiTasks.length;
  const progress = totalAiTasks === 0 ? 0 : Math.round((completedAiTasks / totalAiTasks) * 100);

  const handleGenerate = () => {
    generateMutation.mutate({ mentoradoId });
  };

  const handleToggle = (id: number) => {
    toggleMutation.mutate({ id });
  };

  if (isLoading) return <AITasksSkeleton />;

  return (
    <Card className="relative overflow-hidden border-primary/20 dark:border-primary/20 shadow-lg bg-gradient-to-br from-card to-primary/5 dark:from-slate-950 dark:to-slate-900/50">
      {/* Confetti for standard celebration */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={200}
          recycle={false}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 100 }}
        />
      )}

      {/* Celebration Effect Component Trigger */}
      <CelebrationEffect trigger={showConfetti} />

      {/* Decorative Background Elements */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl" />

      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-transparent z-10 relative">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
            <BrainCircuit className="w-6 h-6 text-[#D4AF37]" />
            N.E.O.N. Coach
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span
              className={`inline-block h-2 w-2 rounded-full ${progress === 100 ? "bg-green-500 shadow-[0_0_8px_theme(colors.green.500)]" : "bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"}`}
            />
            {progress}% do Plano IA Completo
          </div>
        </div>

        {generateMutation.isPending ? (
          <Button disabled variant="outline" className="border-primary/20 bg-primary/5">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando...
          </Button>
        ) : (
          (isAdmin || totalAiTasks === 0) && (
            <Button
              onClick={handleGenerate}
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-primary to-[#D4AF37] hover:from-primary/90 hover:to-[#D4AF37]/90 text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {totalAiTasks === 0 ? "Gerar Plano" : "Novo Plano"}
            </Button>
          )
        )}
      </CardHeader>

      <CardContent className="z-10 relative space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <BrainCircuit className="w-4 h-4 mr-2" />
              Plano IA
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="data-[state=active]:bg-background data-[state=active]:text-blue-500 data-[state=active]:shadow-sm"
            >
              <ListTodo className="w-4 h-4 mr-2" />
              Tarefas Manuais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4 min-h-[150px]">
            {totalAiTasks > 0 && (
              <Progress
                value={progress}
                className="h-1.5 bg-muted/50 mb-4"
                indicatorClassName="bg-gradient-to-r from-primary to-[#D4AF37]"
              />
            )}

            {totalAiTasks === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-muted/10 rounded-xl border border-dashed border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Sem plano ativo</p>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                    Solicite ao Neon Coach um novo plano tático para esta semana.
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {aiTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onToggle={handleToggle} />
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-3 min-h-[150px]">
            {manualTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <ListTodo className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-sm">Nenhuma tarefa manual encontrada.</p>
              </div>
            ) : (
              manualTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={handleToggle} variant="manual" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TaskItem({
  task,
  onToggle,
  variant = "ai",
}: {
  task: any;
  onToggle: (id: number) => void;
  variant?: "ai" | "manual";
}) {
  const isDone = task.status === "done";
  const doneClass = isDone
    ? "bg-muted/30 border-transparent opacity-60"
    : variant === "ai"
      ? "bg-card border-border hover:border-primary/30 hover:shadow-sm"
      : "bg-card border-border hover:border-blue-500/30 hover:shadow-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      layout
      className={`group flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${doneClass}`}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={() => onToggle(task.id)}
        className={`mt-1 ${variant === "ai" ? "data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]" : "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"}`}
      />
      <div className="flex-1 space-y-1 cursor-pointer" onClick={() => onToggle(task.id)}>
        <p
          className={`text-sm font-medium leading-normal transition-colors ${
            isDone
              ? "text-muted-foreground line-through decoration-muted-foreground/50"
              : variant === "ai"
                ? "text-foreground group-hover:text-primary"
                : "text-foreground group-hover:text-blue-500"
          }`}
        >
          {task.title}
        </p>

        {/* Priority Badge */}
        {!isDone && variant === "ai" && (
          <span className="inline-flex items-center text-[10px] uppercase font-bold text-[#D4AF37]/80 bg-[#D4AF37]/10 px-1.5 py-0.5 rounded border border-[#D4AF37]/20">
            {task.priority || "Normal"}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function AITasksSkeleton() {
  return (
    <div className="w-full h-[300px] border border-border rounded-xl bg-card animate-pulse p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-10 bg-muted rounded w-32" />
      </div>
      <div className="h-10 bg-muted rounded w-full" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg w-full" />
        ))}
      </div>
    </div>
  );
}
