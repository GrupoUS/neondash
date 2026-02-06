import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { aiAgentRouter } from "./aiAgentRouter";
import { aiAssistantRouter } from "./aiAssistantRouter";
import { atividadesRouter } from "./atividadesRouter";
import { baileysRouter } from "./baileysRouter";
import { crmColumnsRouter } from "./crmColumnsRouter";
import { diagnosticoRouter } from "./diagnostico";
import { facebookAdsRouter } from "./facebookAdsRouter";
import { financeiroRouter } from "./financeiroRouter";
import { gamificacaoRouter } from "./gamificacaoRouter";
import { instagramRouter } from "./instagramRouter";
import { interacoesRouter } from "./interacoesRouter";
import { interactionTemplatesRouter } from "./interactionTemplatesRouter";
import { leadsRouter } from "./leadsRouter";
import { marketingRouter } from "./marketingRouter";
import { mentoradosRouter } from "./mentoradosRouter";
import { metaApiRouter } from "./metaApiRouter";
import { notificationsRouter } from "./notificationsRouter";
import { pacientesRouter } from "./pacientesRouter";
import { procedimentosRouter } from "./procedimentosRouter";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { calendarRouter } from "./routers/calendar";
import { classesRouter } from "./routers/classes";
import { mentorRouter } from "./routers/mentor";
import { mentorshipRouter } from "./routers/mentorship";
import { planejamentoRouter } from "./routers/planejamento";
import { playbookRouter } from "./routers/playbook";
import { tasksRouter } from "./routers/tasks";
import { whatsappRouter } from "./whatsappRouter";
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
  whatsapp: whatsappRouter,
  baileys: baileysRouter,
  metaApi: metaApiRouter,
  aiAgent: aiAgentRouter,
  instagram: instagramRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
  mentor: mentorRouter,
  mentorship: mentorshipRouter,
  financeiro: financeiroRouter,
  procedimentos: procedimentosRouter,
  marketing: marketingRouter,
  pacientes: pacientesRouter,
  facebookAds: facebookAdsRouter,
});

export type AppRouter = typeof appRouter;
