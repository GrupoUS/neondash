import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { aiAgentRouter } from "./aiAgentRouter";
import { aiAssistantRouter } from "./aiAssistantRouter";
import { atividadesRouter } from "./atividadesRouter";
import { crmColumnsRouter } from "./crmColumnsRouter";
import { diagnosticoRouter } from "./diagnostico";
import { gamificacaoRouter } from "./gamificacaoRouter";
import { instagramRouter } from "./instagramRouter";
import { interacoesRouter } from "./interacoesRouter";
import { interactionTemplatesRouter } from "./interactionTemplatesRouter";
import { leadsRouter } from "./leadsRouter";
import { mentoradosRouter } from "./mentoradosRouter";
import { notificationsRouter } from "./notificationsRouter";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { calendarRouter } from "./routers/calendar";
import { classesRouter } from "./routers/classes";
import { mentorRouter } from "./routers/mentor";
import { mentorshipRouter } from "./routers/mentorship";
import { planejamentoRouter } from "./routers/planejamento";
import { playbookRouter } from "./routers/playbook";
import { tasksRouter } from "./routers/tasks";
import { zapiRouter } from "./zapiRouter";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  mentorados: mentoradosRouter,
  gamificacao: gamificacaoRouter,
  aiAssistant: aiAssistantRouter,
  leads: leadsRouter,
  tasks: tasksRouter,
  classes: classesRouter,
  playbook: playbookRouter,
  planejamento: planejamentoRouter,
  atividades: atividadesRouter,
  interactionTemplates: interactionTemplatesRouter,
  diagnostico: diagnosticoRouter,
  interacoes: interacoesRouter,
  calendar: calendarRouter,
  crmColumns: crmColumnsRouter,
  zapi: zapiRouter,
  aiAgent: aiAgentRouter,
  instagram: instagramRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
  mentor: mentorRouter,
  mentorship: mentorshipRouter,
});

export type AppRouter = typeof appRouter;
