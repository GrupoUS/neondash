import {
  calcularProgresso,
  getAtividadesByEtapa,
  getEtapaColor,
  getMotivationalMessage,
} from "@shared/atividades-data";
import {
  Bookmark,
  CheckCircle2,
  ChevronRight,
  ListTodo,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Star,
  StickyNote,
  Trophy,
  X,
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
import { AnimatedItem } from "@/components/ui/animated-list";
import {
  AnimatedPopover,
  AnimatedPopoverClose,
  AnimatedPopoverContent,
  AnimatedPopoverTrigger,
} from "@/components/ui/animated-popover";
import { AnimatedProgressBar, AnimatedProgressRing } from "@/components/ui/animated-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CelebrationEffect, useCelebration } from "@/components/ui/celebration-effect";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface AtividadesContentProps {
  mentoradoId?: number; // For admin viewing specific mentorado
}

interface NotePopoverState {
  key: string;
  currentNote: string;
}

interface TaskPopoverState {
  codigo: string;
  taskTitle: string;
}

interface GradePopoverState {
  grade: number | null;
  feedback: string;
}

/**
 * Componente interativo para atividades do PLAY NEON
 * - Lista atividades expansíveis (Accordion)
 * - Checkboxes animados para marcar passos como concluídos
 * - Celebração com confetti ao completar passos
 * - Notas pessoais para cada passo (Popover inline)
 * - Criação de tarefas a partir de atividades (Popover inline)
 * - Anel de progresso circular animado
 * - Módulos coloridos por etapa
 * - Admin grading and feedback
 */
export function AtividadesContent({ mentoradoId }: AtividadesContentProps) {
  // Celebration effect
  const {
    isActive: showCelebration,
    celebrate,
    handleComplete: handleCelebrationComplete,
  } = useCelebration();
  const celebrationContainerRef = useRef<HTMLDivElement>(null);

  // Local state for popover content editing
  const [noteStates, setNoteStates] = useState<Record<string, NotePopoverState>>({});
  const [taskStates, setTaskStates] = useState<Record<string, TaskPopoverState>>({});
  const [gradeStates, setGradeStates] = useState<Record<string, GradePopoverState>>({});
  // Track which steps have expanded details
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Fetch progress from server
  const progressQuery = mentoradoId
    ? trpc.atividades.getProgressById.useQuery({ mentoradoId })
    : trpc.atividades.getProgress.useQuery();

  const toggleMutation = trpc.atividades.toggleStep.useMutation({
    onSuccess: (_, variables) => {
      progressQuery.refetch();
      if (variables.completed) {
        celebrate();
      }
    },
  });

  const updateNoteMutation = trpc.atividades.updateNote.useMutation({
    onSuccess: () => {
      progressQuery.refetch();
    },
  });

  const updateGradeMutation = trpc.atividades.updateGrade.useMutation({
    onSuccess: () => {
      progressQuery.refetch();
    },
  });

  const utils = trpc.useUtils();

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
    },
  });

  const progressMap = progressQuery.data ?? {};
  const { total, completed, percentage } = calcularProgresso(
    Object.fromEntries(Object.entries(progressMap).map(([k, v]) => [k, v.completed]))
  );
  const atividadesByEtapa = getAtividadesByEtapa();
  const motivational = getMotivationalMessage(percentage);

  const handleToggle = useCallback(
    (atividadeCodigo: string, stepCodigo: string) => {
      if (mentoradoId) return;

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

  const handleNoteChange = useCallback((key: string, note: string) => {
    setNoteStates((prev) => ({
      ...prev,
      [key]: { key, currentNote: note },
    }));
  }, []);

  const saveNote = useCallback(
    (atividadeCodigo: string, stepCodigo: string) => {
      const key = `${atividadeCodigo}:${stepCodigo}`;
      const noteState = noteStates[key];
      if (!noteState) return;

      updateNoteMutation.mutate({
        atividadeCodigo,
        stepCodigo,
        notes: noteState.currentNote,
      });
    },
    [noteStates, updateNoteMutation]
  );

  const handleTaskChange = useCallback((codigo: string, title: string) => {
    setTaskStates((prev) => ({
      ...prev,
      [codigo]: { codigo, taskTitle: title },
    }));
  }, []);

  const createTask = useCallback(
    (atividadeCodigo: string) => {
      const taskState = taskStates[atividadeCodigo];
      if (!taskState?.taskTitle.trim()) return;

      createTaskMutation.mutate({
        title: taskState.taskTitle,
        category: "atividade",
        source: "atividade",
        atividadeCodigo,
      });

      // Clear the input after creating
      setTaskStates((prev) => ({
        ...prev,
        [atividadeCodigo]: { codigo: atividadeCodigo, taskTitle: "" },
      }));
    },
    [taskStates, createTaskMutation]
  );

  // Admin grading handlers
  const handleGradeChange = useCallback((key: string, grade: number | null, feedback: string) => {
    setGradeStates((prev) => ({
      ...prev,
      [key]: { grade, feedback },
    }));
  }, []);

  const saveGrade = useCallback(
    (atividadeCodigo: string, stepCodigo: string) => {
      if (!mentoradoId) return;
      const key = `${atividadeCodigo}:${stepCodigo}`;
      const gradeState = gradeStates[key];
      if (!gradeState) return;

      updateGradeMutation.mutate({
        mentoradoId,
        atividadeCodigo,
        stepCodigo,
        grade: gradeState.grade,
        feedback: gradeState.feedback || null,
      });
    },
    [mentoradoId, gradeStates, updateGradeMutation]
  );

  const toggleStepExpanded = useCallback((key: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

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
              <AnimatedProgressRing value={percentage} size={140} strokeWidth={10} />
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
                                  "text-xl font-semibold truncate transition-colors",
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

                          {/* Botão para criar tarefa com Popover */}
                          {!isReadOnly && (
                            <AnimatedPopover>
                              <AnimatedPopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mb-4 border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Criar Tarefa
                                </Button>
                              </AnimatedPopoverTrigger>
                              <AnimatedPopoverContent align="start" className="w-80">
                                <AnimatedPopoverClose>
                                  <X className="w-4 h-4" />
                                </AnimatedPopoverClose>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <ListTodo className="w-5 h-5 text-primary" />
                                    <h4 className="font-semibold text-foreground">Criar Tarefa</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Vinculada à:{" "}
                                    <span className="text-foreground">{atividade.titulo}</span>
                                  </p>
                                  <Input
                                    value={taskStates[atividade.codigo]?.taskTitle ?? ""}
                                    onChange={(e) =>
                                      handleTaskChange(atividade.codigo, e.target.value)
                                    }
                                    placeholder="Título da tarefa..."
                                    className="bg-muted border-border text-foreground"
                                  />
                                  <div className="flex gap-2">
                                    <AnimatedPopoverClose asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 cursor-pointer"
                                      >
                                        Cancelar
                                      </Button>
                                    </AnimatedPopoverClose>
                                    <Button
                                      size="sm"
                                      onClick={() => createTask(atividade.codigo)}
                                      disabled={
                                        createTaskMutation.isPending ||
                                        !taskStates[atividade.codigo]?.taskTitle?.trim()
                                      }
                                      className="flex-1 bg-primary hover:bg-primary/90 cursor-pointer"
                                    >
                                      {createTaskMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        "Criar"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </AnimatedPopoverContent>
                            </AnimatedPopover>
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
                                const savedNote = stepData.notes ?? "";
                                const hasNote = !!savedNote;
                                const isPending =
                                  toggleMutation.isPending &&
                                  toggleMutation.variables?.atividadeCodigo === atividade.codigo &&
                                  toggleMutation.variables?.stepCodigo === step.codigo;

                                return (
                                  <AnimatedItem
                                    key={step.codigo}
                                    index={stepIndex}
                                    delay={0.03 * stepIndex}
                                    className={cn(
                                      "flex items-start gap-4 py-4 px-4 rounded-xl group transition-all duration-300 mb-0 cursor-default",
                                      "bg-card/50 hover:bg-muted/60 border border-transparent hover:border-primary/10",
                                      isCompleted &&
                                        "bg-primary/5 hover:bg-primary/10 border-primary/10"
                                    )}
                                  >
                                    {/* Checkbox */}
                                    <div className="pt-1 flex-shrink-0">
                                      <AnimatedCheckbox
                                        id={key}
                                        checked={isCompleted}
                                        disabled={isReadOnly || isPending}
                                        onCheckedChange={() =>
                                          handleToggle(atividade.codigo, step.codigo)
                                        }
                                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                      />
                                    </div>

                                    {/* Conteúdo do step */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <label
                                          htmlFor={key}
                                          className={cn(
                                            "text-lg font-medium cursor-pointer select-none block transition-all leading-relaxed flex-1",
                                            isCompleted
                                              ? "text-muted-foreground line-through opacity-70"
                                              : "text-foreground"
                                          )}
                                        >
                                          {step.label}
                                        </label>
                                        {/* Expand/collapse button for details */}
                                        {(step.detalhes || isReadOnly) && (
                                          <button
                                            type="button"
                                            onClick={() => toggleStepExpanded(key)}
                                            className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer flex-shrink-0"
                                            title={
                                              expandedSteps.has(key)
                                                ? "Recolher"
                                                : "Expandir detalhes"
                                            }
                                          >
                                            <ChevronRight
                                              className={cn(
                                                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                                expandedSteps.has(key) && "rotate-90"
                                              )}
                                            />
                                          </button>
                                        )}
                                      </div>
                                      {step.descricao && (
                                        <p className="text-base text-muted-foreground/80 mt-1.5 line-clamp-2">
                                          {step.descricao}
                                        </p>
                                      )}

                                      {/* Expandable details section */}
                                      <AnimatePresence>
                                        {expandedSteps.has(key) && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="mt-4 space-y-4">
                                              {/* Implementation Guide */}
                                              {step.detalhes && (
                                                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                                                  <h5 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-primary" />
                                                    Guia de Implementação
                                                  </h5>
                                                  {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from trusted internal atividades config */}
                                                  <div
                                                    className="prose prose-sm prose-slate dark:prose-invert max-w-none"
                                                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from trusted internal atividades config
                                                    dangerouslySetInnerHTML={{
                                                      __html: step.detalhes,
                                                    }}
                                                  />
                                                </div>
                                              )}

                                              {/* User notes (readonly for admin) */}
                                              {isReadOnly && savedNote && (
                                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                                  <h5 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                                                    <StickyNote className="w-4 h-4 text-primary" />
                                                    Notas do Mentorado
                                                  </h5>
                                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {savedNote}
                                                  </p>
                                                </div>
                                              )}

                                              {/* Admin grading section */}
                                              {isReadOnly && (
                                                <div className="p-4 rounded-lg bg-card border border-border">
                                                  <h5 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-amber-500" />
                                                    Avaliação do Mentor
                                                  </h5>
                                                  <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                                                    {/* Grade input */}
                                                    <div className="space-y-1.5">
                                                      <label
                                                        htmlFor={`grade-${key}`}
                                                        className="text-xs text-muted-foreground"
                                                      >
                                                        Nota (0-10)
                                                      </label>
                                                      <Input
                                                        id={`grade-${key}`}
                                                        type="number"
                                                        min={0}
                                                        max={10}
                                                        step={1}
                                                        value={
                                                          gradeStates[key]?.grade ??
                                                          stepData.grade ??
                                                          ""
                                                        }
                                                        onChange={(e) =>
                                                          handleGradeChange(
                                                            key,
                                                            e.target.value
                                                              ? Number(e.target.value)
                                                              : null,
                                                            gradeStates[key]?.feedback ??
                                                              stepData.feedback ??
                                                              ""
                                                          )
                                                        }
                                                        className="w-20"
                                                        placeholder="—"
                                                      />
                                                    </div>
                                                    {/* Feedback textarea */}
                                                    <div className="space-y-1.5">
                                                      <label
                                                        htmlFor={`feedback-${key}`}
                                                        className="text-xs text-muted-foreground"
                                                      >
                                                        Feedback
                                                      </label>
                                                      <Textarea
                                                        id={`feedback-${key}`}
                                                        value={
                                                          gradeStates[key]?.feedback ??
                                                          stepData.feedback ??
                                                          ""
                                                        }
                                                        onChange={(e) =>
                                                          handleGradeChange(
                                                            key,
                                                            gradeStates[key]?.grade ??
                                                              stepData.grade ??
                                                              null,
                                                            e.target.value
                                                          )
                                                        }
                                                        placeholder="Escreva seu feedback para o mentorado..."
                                                        className="min-h-[80px] resize-y"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="mt-3 flex justify-end">
                                                    <Button
                                                      size="sm"
                                                      onClick={() =>
                                                        saveGrade(atividade.codigo, step.codigo)
                                                      }
                                                      disabled={updateGradeMutation.isPending}
                                                      className="bg-primary hover:bg-primary/90 cursor-pointer"
                                                    >
                                                      {updateGradeMutation.isPending ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                      ) : (
                                                        <Star className="w-4 h-4 mr-2" />
                                                      )}
                                                      Salvar Avaliação
                                                    </Button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                      {/* Show existing grade badge inline when collapsed */}
                                      {isReadOnly &&
                                        stepData.grade != null &&
                                        !expandedSteps.has(key) && (
                                          <div className="mt-2 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                                              <Star className="w-3 h-3" />
                                              Nota: {stepData.grade}/10
                                            </span>
                                          </div>
                                        )}
                                    </div>

                                    {/* Botão de nota - estilo pill */}
                                    {!isReadOnly && (
                                      <AnimatedPopover
                                        onOpenChange={(open) => {
                                          if (open) {
                                            handleNoteChange(key, savedNote);
                                          }
                                        }}
                                      >
                                        <AnimatedPopoverTrigger asChild>
                                          <button
                                            type="button"
                                            className={cn(
                                              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex-shrink-0",
                                              hasNote
                                                ? "bg-primary/15 text-primary hover:bg-primary/25 ring-1 ring-primary/30"
                                                : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                          >
                                            {hasNote ? (
                                              <>
                                                <Pencil className="w-3 h-3" />
                                                <span>Nota</span>
                                              </>
                                            ) : (
                                              <>
                                                <MessageSquarePlus className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Nota</span>
                                              </>
                                            )}
                                          </button>
                                        </AnimatedPopoverTrigger>
                                        <AnimatedPopoverContent
                                          align="end"
                                          side="bottom"
                                          className="w-[90vw] md:w-[800px] p-0"
                                        >
                                          {/* Header with close button */}
                                          <div className="flex items-start justify-between p-4 pb-3 border-b border-border/50">
                                            <div className="flex items-center gap-3">
                                              <div className="p-2 rounded-lg bg-primary/10">
                                                <StickyNote className="w-5 h-5 text-primary" />
                                              </div>
                                              <div>
                                                <h4 className="font-semibold text-foreground">
                                                  Nota Pessoal
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                  Suas anotações sobre este passo
                                                </p>
                                              </div>
                                            </div>
                                            <AnimatedPopoverClose asChild>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive -mt-1 -mr-1"
                                              >
                                                <X className="w-4 h-4" />
                                              </Button>
                                            </AnimatedPopoverClose>
                                          </div>

                                          {/* Content */}
                                          <div className="p-4 space-y-4">
                                            <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                                              <p className="text-sm text-muted-foreground line-clamp-2">
                                                {step.label}
                                              </p>
                                            </div>
                                            <Textarea
                                              value={noteStates[key]?.currentNote ?? savedNote}
                                              onChange={(e) =>
                                                handleNoteChange(key, e.target.value)
                                              }
                                              placeholder="Escreva suas anotações, dúvidas ou insights..."
                                              className="bg-background border-border text-foreground min-h-[320px] resize-y text-sm placeholder:text-muted-foreground/50"
                                            />
                                          </div>

                                          {/* Footer with save button */}
                                          <div className="p-4 pt-0">
                                            <AnimatedPopoverClose
                                              asChild
                                              className="static w-full top-auto right-auto"
                                            >
                                              <Button
                                                type="button"
                                                size="default"
                                                onClick={() =>
                                                  saveNote(atividade.codigo, step.codigo)
                                                }
                                                disabled={updateNoteMutation.isPending}
                                                className="w-full bg-primary hover:bg-primary/90 cursor-pointer shadow-sm"
                                              >
                                                {updateNoteMutation.isPending ? (
                                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : null}
                                                {updateNoteMutation.isPending
                                                  ? "Salvando..."
                                                  : "Salvar Nota"}
                                              </Button>
                                            </AnimatedPopoverClose>
                                          </div>
                                        </AnimatedPopoverContent>
                                      </AnimatedPopover>
                                    )}

                                    {/* Indicador de nota (readonly) */}
                                    {isReadOnly && hasNote && (
                                      <span
                                        className="text-primary p-1.5 bg-primary/10 rounded-full"
                                        title={savedNote}
                                      >
                                        <StickyNote className="w-4 h-4" />
                                      </span>
                                    )}

                                    {isPending && (
                                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
                                    )}
                                  </AnimatedItem>
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
    </div>
  );
}
