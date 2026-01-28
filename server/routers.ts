import { publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { mentoradosRouter } from "./mentoradosRouter";
import { gamificacaoRouter } from "./gamificacaoRouter";
import { moltbotRouter } from "./moltbotRouter";
import { leadsRouter } from "./leadsRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
  mentorados: mentoradosRouter,
  gamificacao: gamificacaoRouter,
  moltbot: moltbotRouter,
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
