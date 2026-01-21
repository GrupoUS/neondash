import { serial, pgEnum, pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const turmaEnum = pgEnum("turma", ["neon_estrutura", "neon_escala"]);
export const ativoEnum = pgEnum("ativo", ["sim", "nao"]);

/**
 * Core user table backing auth flow.
 * Columns use camelCase in TS but mapped to snake_case in DB.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Mentorados table - extends users with profile info
 */
export const mentorados = pgTable("mentorados", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  nomeCompleto: varchar("nome_completo", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  fotoUrl: varchar("foto_url", { length: 500 }),
  turma: turmaEnum("turma").notNull(),
  metaFaturamento: integer("meta_faturamento").notNull().default(16000),
  metaLeads: integer("meta_leads").default(50),
  metaProcedimentos: integer("meta_procedimentos").default(10),
  metaPosts: integer("meta_posts").default(12),
  metaStories: integer("meta_stories").default(60),
  ativo: ativoEnum("ativo").default("sim").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Mentorado = typeof mentorados.$inferSelect;
export type InsertMentorado = typeof mentorados.$inferInsert;

/**
 * Monthly metrics table - stores performance data for each month
 */
export const metricasMensais = pgTable("metricas_mensais", {
  id: serial("id").primaryKey(),
  mentoradoId: integer("mentorado_id").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  ano: integer("ano").notNull(),
  mes: integer("mes").notNull(), // 1-12
  faturamento: integer("faturamento").notNull().default(0),
  lucro: integer("lucro").notNull().default(0),
  postsFeed: integer("posts_feed").notNull().default(0),
  stories: integer("stories").notNull().default(0),
  leads: integer("leads").notNull().default(0),
  procedimentos: integer("procedimentos").notNull().default(0),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MetricaMensal = typeof metricasMensais.$inferSelect;
export type InsertMetricaMensal = typeof metricasMensais.$inferInsert;

/**
 * Feedback/suggestions table - stores personalized monthly feedback
 */
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  mentoradoId: integer("mentorado_id").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  ano: integer("ano").notNull(),
  mes: integer("mes").notNull(),
  analiseMes: text("analise_mes").notNull(),
  focoProximoMes: text("foco_proximo_mes").notNull(),
  sugestaoMentor: text("sugestao_mentor").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
