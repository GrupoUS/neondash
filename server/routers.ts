import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { atividadesRouter } from "./atividadesRouter";
import { diagnosticoRouter } from "./diagnostico";
import { gamificacaoRouter } from "./gamificacaoRouter";
import { interacoesRouter } from "./interacoesRouter";
import { interactionTemplatesRouter } from "./interactionTemplatesRouter";
import { leadsRouter } from "./leadsRouter";
import { mentoradosRouter } from "./mentoradosRouter";
import { moltbotRouter } from "./moltbotRouter";
import { authRouter } from "./routers/auth";
import { calendarRouter } from "./routers/calendar";
import { classesRouter } from "./routers/classes";
import { playbookRouter } from "./routers/playbook";
import { tasksRouter } from "./routers/tasks";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  mentorados: mentoradosRouter,
  gamificacao: gamificacaoRouter,
  moltbot: moltbotRouter,
  leads: leadsRouter,
  tasks: tasksRouter,
  classes: classesRouter,
  playbook: playbookRouter,
  atividades: atividadesRouter,
  interactionTemplates: interactionTemplatesRouter,
  diagnostico: diagnosticoRouter,
  interacoes: interacoesRouter,
  calendar: calendarRouter,
});

export type AppRouter = typeof appRouter;
