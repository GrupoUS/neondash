import {
  serial,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const turmaEnum = pgEnum("turma", ["neon_estrutura", "neon_escala"]);
export const ativoEnum = pgEnum("ativo", ["sim", "nao"]);
export const categoriaEnum = pgEnum("categoria", [
  "faturamento",
  "conteudo",
  "operacional",
  "consistencia",
  "especial",
]);
export const tipoMetaEnum = pgEnum("tipo_meta", [
  "faturamento",
  "leads",
  "procedimentos",
  "posts",
  "stories",
]);
export const tipoNotificacaoEnum = pgEnum("tipo_notificacao", [
  "lembrete_metricas",
  "alerta_meta",
  "conquista",
  "ranking",
]);
export const simNaoEnum = pgEnum("sim_nao", ["sim", "nao"]);

// ═══════════════════════════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Users - Core user table backing Clerk auth
 */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    imageUrl: text("image_url"),
    loginMethod: varchar("login_method", { length: 64 }),
    role: roleEnum("role").default("user").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    index("users_email_idx").on(table.email),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Mentorados - Extended profile for mentees
 */
export const mentorados = pgTable(
  "mentorados",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
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
  },
  table => [
    index("mentorados_user_id_idx").on(table.userId),
    index("mentorados_email_idx").on(table.email),
    index("mentorados_turma_idx").on(table.turma),
    index("mentorados_turma_ativo_idx").on(table.turma, table.ativo),
  ]
);

export type Mentorado = typeof mentorados.$inferSelect;
export type InsertMentorado = typeof mentorados.$inferInsert;

/**
 * Metricas Mensais - Monthly performance metrics
 */
export const metricasMensais = pgTable(
  "metricas_mensais",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
    faturamento: integer("faturamento").notNull().default(0),
    lucro: integer("lucro").notNull().default(0),
    postsFeed: integer("posts_feed").notNull().default(0),
    stories: integer("stories").notNull().default(0),
    leads: integer("leads").notNull().default(0),
    procedimentos: integer("procedimentos").notNull().default(0),
    observacoes: text("observacoes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => [
    index("metricas_mentorado_idx").on(table.mentoradoId),
    uniqueIndex("metricas_mentorado_periodo_idx").on(
      table.mentoradoId,
      table.ano,
      table.mes
    ),
    index("metricas_periodo_idx").on(table.ano, table.mes),
  ]
);

export type MetricaMensal = typeof metricasMensais.$inferSelect;
export type InsertMetricaMensal = typeof metricasMensais.$inferInsert;

/**
 * Feedbacks - Monthly feedback from mentors
 */
export const feedbacks = pgTable(
  "feedbacks",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
    analiseMes: text("analise_mes").notNull(),
    focoProximoMes: text("foco_proximo_mes").notNull(),
    sugestaoMentor: text("sugestao_mentor").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("feedbacks_mentorado_periodo_idx").on(
      table.mentoradoId,
      table.ano,
      table.mes
    ),
  ]
);

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

/**
 * Badges - Achievement definitions
 */
export const badges = pgTable(
  "badges",
  {
    id: serial("id").primaryKey(),
    codigo: varchar("codigo", { length: 50 }).notNull().unique(),
    nome: varchar("nome", { length: 100 }).notNull(),
    descricao: text("descricao").notNull(),
    icone: varchar("icone", { length: 50 }).notNull(),
    cor: varchar("cor", { length: 20 }).notNull().default("gold"),
    categoria: categoriaEnum("categoria").notNull(),
    criterio: text("criterio").notNull(),
    pontos: integer("pontos").notNull().default(10),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("badges_codigo_idx").on(table.codigo),
    index("badges_categoria_idx").on(table.categoria),
  ]
);

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * Mentorado Badges - Earned badges tracking
 */
export const mentoradoBadges = pgTable(
  "mentorado_badges",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    badgeId: integer("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    conquistadoEm: timestamp("conquistado_em").defaultNow().notNull(),
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
  },
  table => [
    index("mentorado_badges_mentorado_idx").on(table.mentoradoId),
    index("mentorado_badges_badge_idx").on(table.badgeId),
    uniqueIndex("mentorado_badges_unique_idx").on(
      table.mentoradoId,
      table.badgeId,
      table.ano,
      table.mes
    ),
  ]
);

export type MentoradoBadge = typeof mentoradoBadges.$inferSelect;
export type InsertMentoradoBadge = typeof mentoradoBadges.$inferInsert;

/**
 * Ranking Mensal - Monthly rankings
 */
export const rankingMensal = pgTable(
  "ranking_mensal",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
    turma: turmaEnum("turma").notNull(),
    posicao: integer("posicao").notNull(),
    pontuacaoTotal: integer("pontuacao_total").notNull().default(0),
    pontosBonus: integer("pontos_bonus").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("ranking_mentorado_periodo_idx").on(
      table.mentoradoId,
      table.ano,
      table.mes
    ),
    index("ranking_turma_periodo_idx").on(table.turma, table.ano, table.mes),
    index("ranking_posicao_idx").on(
      table.turma,
      table.ano,
      table.mes,
      table.posicao
    ),
  ]
);

export type RankingMensal = typeof rankingMensal.$inferSelect;
export type InsertRankingMensal = typeof rankingMensal.$inferInsert;

/**
 * Metas Progressivas - Progressive goals tracking
 */
export const metasProgressivas = pgTable(
  "metas_progressivas",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    tipo: tipoMetaEnum("tipo").notNull(),
    metaAtual: integer("meta_atual").notNull(),
    metaInicial: integer("meta_inicial").notNull(),
    incremento: integer("incremento").notNull().default(10),
    vezesAtingida: integer("vezes_atingida").notNull().default(0),
    ultimaAtualizacao: timestamp("ultima_atualizacao").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("metas_mentorado_tipo_idx").on(table.mentoradoId, table.tipo),
  ]
);

export type MetaProgressiva = typeof metasProgressivas.$inferSelect;
export type InsertMetaProgressiva = typeof metasProgressivas.$inferInsert;

/**
 * Notificacoes - User notifications
 */
export const notificacoes = pgTable(
  "notificacoes",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    tipo: tipoNotificacaoEnum("tipo").notNull(),
    titulo: varchar("titulo", { length: 200 }).notNull(),
    mensagem: text("mensagem").notNull(),
    lida: simNaoEnum("lida").default("nao").notNull(),
    enviadaPorEmail: simNaoEnum("enviada_por_email").default("nao").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => [
    index("notificacoes_mentorado_idx").on(table.mentoradoId),
    index("notificacoes_mentorado_lida_idx").on(table.mentoradoId, table.lida),
    index("notificacoes_created_idx").on(table.createdAt),
  ]
);

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;
