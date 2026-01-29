import { router, publicProcedure } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { mentoradosRouter } from "./mentoradosRouter";
import { gamificacaoRouter } from "./gamificacaoRouter";
import { moltbotRouter } from "./moltbotRouter";
import { leadsRouter } from "./leadsRouter";
import { tasksRouter } from "./routers/tasks";
import { classesRouter } from "./routers/classes";
import { playbookRouter } from "./routers/playbook";
import { authRouter } from "./routers/auth";


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
});


export type AppRouter = typeof appRouter;
