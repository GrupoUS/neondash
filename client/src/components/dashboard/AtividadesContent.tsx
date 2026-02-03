import {
  Bookmark,
  CheckCircle2,
  ListTodo,
  Loader2,
  Pencil,
  Play,
  Plus,
  Sparkles,
  StickyNote,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { AnimatedProgressBar, AnimatedProgressRing } from "@/components/ui/animated-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CelebrationEffect, useCelebration } from "@/components/ui/celebration-effect";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  calcularProgresso,
  getAtividadesByEtapa,
  getEtapaColor,
  getMotivationalMessage,
} from "@/data/atividades-data";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface AtividadesContentProps {
  mentoradoId?: number; // For admin viewing specific mentorado
}

interface NoteDialogState {
  open: boolean;
  atividadeCodigo: string;
  stepCodigo: string;
  stepLabel: string;
  currentNote: string;
}

interface TaskDialogState {
  open: boolean;
  atividadeCodigo: string;
  atividadeTitulo: string;
  taskTitle: string;
}

/**
 * Componente interativo para atividades do PLAY NEON
 * - Lista atividades expansíveis (Accordion)
 * - Checkboxes animados para marcar passos como concluídos
 * - Celebração com confetti ao completar passos
 * - Notas pessoais para cada passo
 * - Criação de tarefas a partir de atividades
 * - Anel de progresso circular animado
 * - Módulos coloridos por etapa
 */
export function AtividadesContent({ mentoradoId }: AtividadesContentProps) {
  // Celebration effect
  const {
    isActive: showCelebration,
    celebrate,
    handleComplete: handleCelebrationComplete,
  } = useCelebration();
  const celebrationContainerRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [noteDialog, setNoteDialog] = useState<NoteDialogState>({
    open: false,
    atividadeCodigo: "",
    stepCodigo: "",
    stepLabel: "",
    currentNote: "",
  });

  const [taskDialog, setTaskDialog] = useState<TaskDialogState>({
    open: false,
    atividadeCodigo: "",
    atividadeTitulo: "",
    taskTitle: "",
  });

  // Fetch progress from server
  const progressQuery = mentoradoId
    ? trpc.atividades.getProgressById.useQuery({ mentoradoId })
    : trpc.atividades.getProgress.useQuery();

  const toggleMutation = trpc.atividades.toggleStep.useMutation({
    onSuccess: (_, variables) => {
      progressQuery.refetch();
      // Trigger celebration when completing a step (not when unchecking)
      if (variables.completed) {
        celebrate();
      }
    },
  });

  const updateNoteMutation = trpc.atividades.updateNote.useMutation({
    onSuccess: () => {
      progressQuery.refetch();
      setNoteDialog((prev) => ({ ...prev, open: false }));
    },
  });

  const utils = trpc.useUtils();

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setTaskDialog((prev) => ({ ...prev, open: false, taskTitle: "" }));
    },
    onError: (_error) => {},
  });

  const progressMap = progressQuery.data ?? {};
  const { total, completed, percentage } = calcularProgresso(
    Object.fromEntries(Object.entries(progressMap).map(([k, v]) => [k, v.completed]))
  );
  const atividadesByEtapa = getAtividadesByEtapa();
  const motivational = getMotivationalMessage(percentage);

  const handleToggle = useCallback(
    (atividadeCodigo: string, stepCodigo: string) => {
      if (mentoradoId) return; // Admin can't toggle for mentorado

      const key = `${atividadeCodigo}:${stepCodigo}`;
      const currentlyCompleted = progressMap[key]?.completed ?? false;

      toggleMutation.mutate({
        atividadeCodigo,
        stepCodigo,
        completed: !currentlyCompleted,
      });
    },
    [mentoradoId, progressMap, toggleMutation]
  );

  const openNoteDialog = useCallback(
    (atividadeCodigo: string, stepCodigo: string, stepLabel: string) => {
      const key = `${atividadeCodigo}:${stepCodigo}`;
      const currentNote = progressMap[key]?.notes ?? "";
      setNoteDialog({
        open: true,
        atividadeCodigo,
        stepCodigo,
        stepLabel,
        currentNote,
      });
    },
    [progressMap]
  );

  const saveNote = useCallback(() => {
    updateNoteMutation.mutate({
      atividadeCodigo: noteDialog.atividadeCodigo,
      stepCodigo: noteDialog.stepCodigo,
      notes: noteDialog.currentNote,
    });
  }, [noteDialog, updateNoteMutation]);

  const openTaskDialog = useCallback((atividadeCodigo: string, atividadeTitulo: string) => {
    setTaskDialog({
      open: true,
      atividadeCodigo,
      atividadeTitulo,
      taskTitle: "",
    });
  }, []);

  const createTask = useCallback(() => {
    if (!taskDialog.taskTitle.trim()) return;
    createTaskMutation.mutate({
      title: taskDialog.taskTitle,
      category: "atividade",
      source: "atividade",
      atividadeCodigo: taskDialog.atividadeCodigo,
    });
  }, [taskDialog, createTaskMutation]);

  const isReadOnly = !!mentoradoId;

  if (progressQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative" ref={celebrationContainerRef}>
      {/* Celebration Effect */}
      <CelebrationEffect
        trigger={showCelebration}
        onComplete={handleCelebrationComplete}
        className="fixed inset-0 z-50 pointer-events-none"
      />

      {/* Header com gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl ring-2 ring-primary/30">
            <Play className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">PLAY NEON</h2>
            <p className="text-muted-foreground text-sm">Sua jornada de crescimento começa aqui</p>
          </div>
          <Sparkles className="w-6 h-6 text-primary/50 absolute top-4 right-4" />
        </div>
      </motion.div>

      {/* Callout principal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-card border-primary/20 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-start gap-3">
            <Bookmark className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-foreground font-semibold">
                Aqui nossa jornada DE FATO começará a acontecer.
              </p>
              <p className="text-muted-foreground mt-1">
                Nessa página você encontrará todas as ferramentas e etapas para implementar na sua
                jornada.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Seção de Progresso com Anel Circular */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Anel de Progresso */}
              <AnimatedProgressRing value={percentage} size={140} strokeWidth={10} />

              {/* Informações de progresso */}
              <div className="flex-1 text-center md:text-left space-y-3">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  {percentage === 100 ? (
                    <Trophy className="w-6 h-6 text-primary" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                  <span className="text-lg font-semibold text-foreground">Progresso Geral</span>
                </div>

                <p className="text-muted-foreground">
                  <span className="text-2xl font-bold text-primary">{completed}</span>
                  <span className="text-muted-foreground"> de </span>
                  <span className="text-foreground font-medium">{total}</span>
                  <span className="text-muted-foreground"> passos concluídos</span>
                </p>

                {/* Mensagem motivacional */}
                <motion.div
                  key={motivational.message}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-lg">{motivational.emoji}</span>
                  <span className="text-muted-foreground italic">{motivational.message}</span>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Atividades agrupadas por etapa */}
      <div className="space-y-6">
        {Object.entries(atividadesByEtapa).map(([etapa, atividades], etapaIndex) => {
          const etapaColors = getEtapaColor(etapa);

          return (
            <motion.div
              key={etapa}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * etapaIndex }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full", etapaColors.bg, etapaColors.text)} />
                {etapa}
              </h3>

              <Accordion type="multiple" className="space-y-3">
                {atividades.map((atividade, atividadeIndex) => {
                  const atividadeCompleted = atividade.steps.filter((step) => {
                    const key = `${atividade.codigo}:${step.codigo}`;
                    return progressMap[key]?.completed;
                  }).length;
                  const atividadeTotal = atividade.steps.length;
                  const atividadePercentage =
                    atividadeTotal > 0
                      ? Math.round((atividadeCompleted / atividadeTotal) * 100)
                      : 0;
                  const isComplete = atividadePercentage === 100;

                  return (
                    <motion.div
                      key={atividade.codigo}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * atividadeIndex }}
                    >
                      <AccordionItem
                        value={atividade.codigo}
                        className={cn(
                          "bg-card border rounded-xl overflow-hidden transition-all duration-200",
                          "border-l-4",
                          etapaColors.border,
                          isComplete && "ring-2 ring-primary/20"
                        )}
                      >
                        <AccordionTrigger className="px-4 py-4 hover:bg-muted/50 hover:no-underline cursor-pointer">
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <span
                              className={cn(
                                "text-2xl p-2 rounded-lg transition-colors",
                                isComplete ? "bg-primary/20" : "bg-muted"
                              )}
                            >
                              {isComplete ? "✅" : atividade.icone}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "font-medium truncate transition-colors",
                                  isComplete ? "text-primary" : "text-foreground"
                                )}
                              >
                                {atividade.titulo}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <AnimatedProgressBar
                                  value={atividadePercentage}
                                  size="sm"
                                  className="flex-1 max-w-40"
                                />
                                <span className="text-xs text-muted-foreground font-medium">
                                  {atividadeCompleted}/{atividadeTotal}
                                </span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {atividade.descricao && (
                            <p className="text-sm text-muted-foreground mb-4 pl-2 border-l-2 border-muted">
                              {atividade.descricao}
                            </p>
                          )}

                          {/* Botão para criar tarefa */}
                          {!isReadOnly && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mb-4 border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                              onClick={() => openTaskDialog(atividade.codigo, atividade.titulo)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Criar Tarefa
                            </Button>
                          )}

                          <div className="space-y-1">
                            <AnimatePresence>
                              {atividade.steps.map((step, stepIndex) => {
                                const key = `${atividade.codigo}:${step.codigo}`;
                                const stepData = progressMap[key] ?? {
                                  completed: false,
                                  notes: null,
                                };
                                const isCompleted = stepData.completed;
                                const hasNote = !!stepData.notes;
                                const isPending =
                                  toggleMutation.isPending &&
                                  toggleMutation.variables?.atividadeCodigo === atividade.codigo &&
                                  toggleMutation.variables?.stepCodigo === step.codigo;

                                return (
                                  <motion.div
                                    key={step.codigo}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: 0.03 * stepIndex }}
                                    className={cn(
                                      "flex items-center gap-3 py-2.5 px-3 rounded-lg group transition-colors",
                                      "hover:bg-muted/50",
                                      isCompleted && "bg-primary/5"
                                    )}
                                  >
                                    <AnimatedCheckbox
                                      id={key}
                                      checked={isCompleted}
                                      disabled={isReadOnly || isPending}
                                      onCheckedChange={() =>
                                        handleToggle(atividade.codigo, step.codigo)
                                      }
                                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <label
                                      htmlFor={key}
                                      className={cn(
                                        "text-sm cursor-pointer select-none flex-1 transition-all",
                                        isCompleted
                                          ? "text-muted-foreground line-through"
                                          : "text-foreground"
                                      )}
                                    >
                                      {step.label}
                                    </label>

                                    {/* Ícone de nota */}
                                    {!isReadOnly && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openNoteDialog(atividade.codigo, step.codigo, step.label)
                                        }
                                        className={cn(
                                          "p-1.5 rounded-lg transition-all cursor-pointer",
                                          hasNote
                                            ? "text-primary bg-primary/10 hover:bg-primary/20"
                                            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                                        )}
                                        title={hasNote ? "Editar nota" : "Adicionar nota"}
                                      >
                                        {hasNote ? (
                                          <Pencil className="w-4 h-4" />
                                        ) : (
                                          <StickyNote className="w-4 h-4" />
                                        )}
                                      </button>
                                    )}

                                    {/* Indicador de nota (readonly) */}
                                    {isReadOnly && hasNote && (
                                      <span
                                        className="text-primary p-1"
                                        title={stepData.notes ?? ""}
                                      >
                                        <StickyNote className="w-4 h-4" />
                                      </span>
                                    )}

                                    {isPending && (
                                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    )}
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
              </Accordion>
            </motion.div>
          );
        })}
      </div>

      {/* Nota de rodapé */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground text-sm text-center pt-4 border-t border-border"
      >
        {isReadOnly
          ? "Visualização do progresso do mentorado"
          : "Marque os passos concluídos para acompanhar seu progresso"}
      </motion.p>

      {/* Drawer para Notas */}
      <Drawer
        open={noteDialog.open}
        onOpenChange={(open) => setNoteDialog((prev) => ({ ...prev, open }))}
      >
        <DrawerContent className="bg-card border-border">
          <DrawerHeader>
            <DrawerTitle className="text-foreground flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-primary" />
              Nota Pessoal
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 space-y-3">
            <p className="text-sm text-muted-foreground">{noteDialog.stepLabel}</p>
            <Textarea
              value={noteDialog.currentNote}
              onChange={(e) =>
                setNoteDialog((prev) => ({
                  ...prev,
                  currentNote: e.target.value,
                }))
              }
              placeholder="Escreva suas anotações aqui..."
              className="bg-muted border-border text-foreground min-h-[120px] resize-none"
            />
          </div>
          <DrawerFooter className="flex-row gap-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                className="flex-1 border-border text-muted-foreground cursor-pointer"
              >
                Cancelar
              </Button>
            </DrawerClose>
            <Button
              onClick={saveNote}
              disabled={updateNoteMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              {updateNoteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer para Criar Tarefa */}
      <Drawer
        open={taskDialog.open}
        onOpenChange={(open) => setTaskDialog((prev) => ({ ...prev, open }))}
      >
        <DrawerContent className="bg-card border-border">
          <DrawerHeader>
            <DrawerTitle className="text-foreground flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              Criar Tarefa
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Vinculada à: <span className="text-foreground">{taskDialog.atividadeTitulo}</span>
            </p>
            <Input
              value={taskDialog.taskTitle}
              onChange={(e) =>
                setTaskDialog((prev) => ({
                  ...prev,
                  taskTitle: e.target.value,
                }))
              }
              placeholder="Título da tarefa..."
              className="bg-muted border-border text-foreground"
            />
          </div>
          <DrawerFooter className="flex-row gap-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                className="flex-1 border-border text-muted-foreground cursor-pointer"
              >
                Cancelar
              </Button>
            </DrawerClose>
            <Button
              onClick={createTask}
              disabled={createTaskMutation.isPending || !taskDialog.taskTitle.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              {createTaskMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Criar"
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
