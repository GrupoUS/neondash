import { relations } from "drizzle-orm";
import {
  users,
  mentorados,
  metricasMensais,
  feedbacks,
  badges,
  mentoradoBadges,
  rankingMensal,
  metasProgressivas,
  notificacoes,
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
}));

// ═══════════════════════════════════════════════════════════════════════════
// METRICAS MENSAIS RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const metricasMensaisRelations = relations(
  metricasMensais,
  ({ one }) => ({
    mentorado: one(mentorados, {
      fields: [metricasMensais.mentoradoId],
      references: [mentorados.id],
    }),
  })
);

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

export const mentoradoBadgesRelations = relations(
  mentoradoBadges,
  ({ one }) => ({
    mentorado: one(mentorados, {
      fields: [mentoradoBadges.mentoradoId],
      references: [mentorados.id],
    }),
    badge: one(badges, {
      fields: [mentoradoBadges.badgeId],
      references: [badges.id],
    }),
  })
);

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

export const metasProgressivasRelations = relations(
  metasProgressivas,
  ({ one }) => ({
    mentorado: one(mentorados, {
      fields: [metasProgressivas.mentoradoId],
      references: [mentorados.id],
    }),
  })
);

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICACOES RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const notificacoesRelations = relations(notificacoes, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [notificacoes.mentoradoId],
    references: [mentorados.id],
  }),
}));
