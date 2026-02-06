import { relations } from "drizzle-orm";
import {
  aiAgentConfig,
  badges,
  callNotes,
  feedbacks,
  instagramSyncLog,
  instagramTokens,
  interacoes,
  leads,
  mentoradoBadges,
  mentorados,
  metasProgressivas,
  metricasMensais,
  notificacoes,
  pacientes,
  pacientesChatIa,
  pacientesConsentimentos,
  pacientesDocumentos,
  pacientesFotos,
  pacientesInfoMedica,
  pacientesProcedimentos,
  planosTratamento,
  procedimentos,
  rankingMensal,
  users,
  weeklyPlanProgress,
  weeklyPlans,
  whatsappMessages,
} from "./schema";

// ═══════════════════════════════════════════════════════════════════════════
// USER RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const usersRelations = relations(users, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [users.id],
    references: [mentorados.userId],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// MENTORADO RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const mentoradosRelations = relations(mentorados, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorados.userId],
    references: [users.id],
  }),
  metricas: many(metricasMensais),
  feedbacks: many(feedbacks),
  badges: many(mentoradoBadges),
  rankings: many(rankingMensal),
  metasProgressivas: many(metasProgressivas),
  notificacoes: many(notificacoes),
  leads: many(leads),
  interacoes: many(interacoes),
  // Instagram Integration
  instagramTokens: one(instagramTokens),
  instagramSyncLogs: many(instagramSyncLog),
  // Call Notes
  callNotes: many(callNotes),
  // Weekly Planning
  weeklyPlans: many(weeklyPlans),
  weeklyPlanProgress: many(weeklyPlanProgress),
}));

// ═══════════════════════════════════════════════════════════════════════════
// METRICAS MENSAIS RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const metricasMensaisRelations = relations(metricasMensais, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [metricasMensais.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACKS RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [feedbacks.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// BADGES RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const badgesRelations = relations(badges, ({ many }) => ({
  mentoradoBadges: many(mentoradoBadges),
}));

// ═══════════════════════════════════════════════════════════════════════════
// MENTORADO BADGES RELATIONS (Junction Table)
// ═══════════════════════════════════════════════════════════════════════════

export const mentoradoBadgesRelations = relations(mentoradoBadges, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [mentoradoBadges.mentoradoId],
    references: [mentorados.id],
  }),
  badge: one(badges, {
    fields: [mentoradoBadges.badgeId],
    references: [badges.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// RANKING MENSAL RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const rankingMensalRelations = relations(rankingMensal, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [rankingMensal.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// METAS PROGRESSIVAS RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const metasProgressivasRelations = relations(metasProgressivas, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [metasProgressivas.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICACOES RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const notificacoesRelations = relations(notificacoes, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [notificacoes.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// LEADS RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const leadsRelations = relations(leads, ({ one, many }) => ({
  mentorado: one(mentorados, {
    fields: [leads.mentoradoId],
    references: [mentorados.id],
  }),
  interacoes: many(interacoes),
}));

// ═══════════════════════════════════════════════════════════════════════════
// INTERACOES RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const interacoesRelations = relations(interacoes, ({ one }) => ({
  lead: one(leads, {
    fields: [interacoes.leadId],
    references: [leads.id],
  }),
  mentorado: one(mentorados, {
    fields: [interacoes.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP MESSAGES RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [whatsappMessages.mentoradoId],
    references: [mentorados.id],
  }),
  lead: one(leads, {
    fields: [whatsappMessages.leadId],
    references: [leads.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// AI AGENT CONFIG RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const aiAgentConfigRelations = relations(aiAgentConfig, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [aiAgentConfig.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// INSTAGRAM TOKENS RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const instagramTokensRelations = relations(instagramTokens, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [instagramTokens.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// INSTAGRAM SYNC LOG RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const instagramSyncLogRelations = relations(instagramSyncLog, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [instagramSyncLog.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// CALL NOTES RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const callNotesRelations = relations(callNotes, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [callNotes.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// WEEKLY PLANNING RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const weeklyPlansRelations = relations(weeklyPlans, ({ one, many }) => ({
  mentorado: one(mentorados, {
    fields: [weeklyPlans.mentoradoId],
    references: [mentorados.id],
  }),
  createdByUser: one(users, {
    fields: [weeklyPlans.createdBy],
    references: [users.id],
  }),
  progress: many(weeklyPlanProgress),
}));

export const weeklyPlanProgressRelations = relations(weeklyPlanProgress, ({ one }) => ({
  plan: one(weeklyPlans, {
    fields: [weeklyPlanProgress.planId],
    references: [weeklyPlans.id],
  }),
  mentorado: one(mentorados, {
    fields: [weeklyPlanProgress.mentoradoId],
    references: [mentorados.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// PACIENTES RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const pacientesRelations = relations(pacientes, ({ many }) => ({
  infoMedica: many(pacientesInfoMedica),
  procedimentos: many(pacientesProcedimentos),
  fotos: many(pacientesFotos),
  documentos: many(pacientesDocumentos),
  chats: many(pacientesChatIa),
  planosTratamento: many(planosTratamento),
  consentimentos: many(pacientesConsentimentos),
}));

export const pacientesInfoMedicaRelations = relations(pacientesInfoMedica, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [pacientesInfoMedica.pacienteId],
    references: [pacientes.id],
  }),
}));

export const pacientesProcedimentosRelations = relations(pacientesProcedimentos, ({ one, many }) => ({
  paciente: one(pacientes, {
    fields: [pacientesProcedimentos.pacienteId],
    references: [pacientes.id],
  }),
  procedimento: one(procedimentos, {
    fields: [pacientesProcedimentos.procedimentoId],
    references: [procedimentos.id],
  }),
  profissional: one(users, {
    fields: [pacientesProcedimentos.profissionalResponsavelId],
    references: [users.id],
  }),
  fotos: many(pacientesFotos),
  documentos: many(pacientesDocumentos),
}));

export const pacientesFotosRelations = relations(pacientesFotos, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [pacientesFotos.pacienteId],
    references: [pacientes.id],
  }),
  procedimentoRealizado: one(pacientesProcedimentos, {
    fields: [pacientesFotos.procedimentoRealizadoId],
    references: [pacientesProcedimentos.id],
  }),
}));

export const pacientesDocumentosRelations = relations(pacientesDocumentos, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [pacientesDocumentos.pacienteId],
    references: [pacientes.id],
  }),
  procedimentoRealizado: one(pacientesProcedimentos, {
    fields: [pacientesDocumentos.procedimentoRealizadoId],
    references: [pacientesProcedimentos.id],
  }),
}));

export const pacientesChatIaRelations = relations(pacientesChatIa, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [pacientesChatIa.pacienteId],
    references: [pacientes.id],
  }),
  foto: one(pacientesFotos, {
    fields: [pacientesChatIa.fotoId],
    references: [pacientesFotos.id],
  }),
}));

export const planosTratamentoRelations = relations(planosTratamento, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [planosTratamento.pacienteId],
    references: [pacientes.id],
  }),
  mentorado: one(mentorados, {
    fields: [planosTratamento.mentoradoId],
    references: [mentorados.id],
  }),
  criadoPor: one(users, {
    fields: [planosTratamento.createdBy],
    references: [users.id],
  }),
}));

export const pacientesConsentimentosRelations = relations(pacientesConsentimentos, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [pacientesConsentimentos.pacienteId],
    references: [pacientes.id],
  }),
  criadoPor: one(users, {
    fields: [pacientesConsentimentos.createdBy],
    references: [users.id],
  }),
}));

export const procedimentosRelations = relations(procedimentos, ({ many }) => ({
  historico: many(pacientesProcedimentos),
}));
