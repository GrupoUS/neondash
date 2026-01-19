import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Mentorados table - extends users with profile info
 */
export const mentorados = mysqlTable("mentorados", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  nomeCompleto: varchar("nomeCompleto", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).unique(),
  fotoUrl: varchar("fotoUrl", { length: 500 }),
  turma: mysqlEnum("turma", ["neon_estrutura", "neon_escala"]).notNull(),
  metaFaturamento: int("metaFaturamento").notNull().default(16000),
  metaLeads: int("metaLeads").default(50),
  metaProcedimentos: int("metaProcedimentos").default(10),
  metaPosts: int("metaPosts").default(12),
  metaStories: int("metaStories").default(60),
  ativo: mysqlEnum("ativo", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Mentorado = typeof mentorados.$inferSelect;
export type InsertMentorado = typeof mentorados.$inferInsert;

/**
 * Monthly metrics table - stores performance data for each month
 */
export const metricasMensais = mysqlTable("metricas_mensais", {
  id: int("id").autoincrement().primaryKey(),
  mentoradoId: int("mentoradoId").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  ano: int("ano").notNull(),
  mes: int("mes").notNull(), // 1-12
  faturamento: int("faturamento").notNull().default(0),
  lucro: int("lucro").notNull().default(0),
  postsFeed: int("postsFeed").notNull().default(0),
  stories: int("stories").notNull().default(0),
  leads: int("leads").notNull().default(0),
  procedimentos: int("procedimentos").notNull().default(0),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MetricaMensal = typeof metricasMensais.$inferSelect;
export type InsertMetricaMensal = typeof metricasMensais.$inferInsert;

/**
 * Feedback/suggestions table - stores personalized monthly feedback
 */
export const feedbacks = mysqlTable("feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  mentoradoId: int("mentoradoId").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  ano: int("ano").notNull(),
  mes: int("mes").notNull(),
  analiseMes: text("analiseMes").notNull(),
  focoProximoMes: text("focoProximoMes").notNull(),
  sugestaoMentor: text("sugestaoMentor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

/**
 * Badges table - defines available badges/achievements
 */
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao").notNull(),
  icone: varchar("icone", { length: 50 }).notNull(), // Lucide icon name
  cor: varchar("cor", { length: 20 }).notNull().default("gold"), // gold, silver, bronze, purple, blue
  categoria: mysqlEnum("categoria", ["faturamento", "conteudo", "operacional", "consistencia", "especial"]).notNull(),
  criterio: text("criterio").notNull(), // JSON with criteria for earning
  pontos: int("pontos").notNull().default(10),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * Mentorado badges - tracks which badges each mentorado has earned
 */
export const mentoradoBadges = mysqlTable("mentorado_badges", {
  id: int("id").autoincrement().primaryKey(),
  mentoradoId: int("mentoradoId").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  badgeId: int("badgeId").notNull().references(() => badges.id, { onDelete: "cascade" }),
  conquistadoEm: timestamp("conquistadoEm").defaultNow().notNull(),
  ano: int("ano").notNull(),
  mes: int("mes").notNull(),
});

export type MentoradoBadge = typeof mentoradoBadges.$inferSelect;
export type InsertMentoradoBadge = typeof mentoradoBadges.$inferInsert;

/**
 * Ranking history - stores monthly rankings
 */
export const rankingMensal = mysqlTable("ranking_mensal", {
  id: int("id").autoincrement().primaryKey(),
  mentoradoId: int("mentoradoId").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  ano: int("ano").notNull(),
  mes: int("mes").notNull(),
  turma: mysqlEnum("turma", ["neon_estrutura", "neon_escala"]).notNull(),
  posicao: int("posicao").notNull(),
  pontuacaoTotal: int("pontuacaoTotal").notNull().default(0),
  pontosBonus: int("pontosBonus").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RankingMensal = typeof rankingMensal.$inferSelect;
export type InsertRankingMensal = typeof rankingMensal.$inferInsert;

/**
 * Metas progressivas - tracks progressive goals that increase over time
 */
export const metasProgressivas = mysqlTable("metas_progressivas", {
  id: int("id").autoincrement().primaryKey(),
  mentoradoId: int("mentoradoId").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  tipo: mysqlEnum("tipo", ["faturamento", "leads", "procedimentos", "posts", "stories"]).notNull(),
  metaAtual: int("metaAtual").notNull(),
  metaInicial: int("metaInicial").notNull(),
  incremento: int("incremento").notNull().default(10), // Percentage increase per achievement
  vezesAtingida: int("vezesAtingida").notNull().default(0),
  ultimaAtualizacao: timestamp("ultimaAtualizacao").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MetaProgressiva = typeof metasProgressivas.$inferSelect;
export type InsertMetaProgressiva = typeof metasProgressivas.$inferInsert;

/**
 * Notificações/Lembretes - stores scheduled notifications
 */
export const notificacoes = mysqlTable("notificacoes", {
  id: int("id").autoincrement().primaryKey(),
  mentoradoId: int("mentoradoId").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  tipo: mysqlEnum("tipo", ["lembrete_metricas", "alerta_meta", "conquista", "ranking"]).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  mensagem: text("mensagem").notNull(),
  lida: mysqlEnum("lida", ["sim", "nao"]).default("nao").notNull(),
  enviadaPorEmail: mysqlEnum("enviadaPorEmail", ["sim", "nao"]).default("nao").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;
