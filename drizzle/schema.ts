import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const turmaEnum = pgEnum("turma", ["neon"]);
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
export const channelTypeEnum = pgEnum("channel_type", ["webchat", "whatsapp", "telegram", "slack"]);

export const origemLeadEnum = pgEnum("origem_lead", [
  "instagram",
  "whatsapp",
  "google",
  "indicacao",
  "site",
  "outro",
]);

export const statusLeadEnum = pgEnum("status_lead", [
  "novo",
  "primeiro_contato",
  "qualificado",
  "proposta",
  "negociacao",
  "fechado",
  "perdido",
]);

export const tipoInteracaoEnum = pgEnum("tipo_interacao", [
  "ligacao",
  "email",
  "whatsapp",
  "reuniao",
  "nota",
]);

export const prioridadeTaskEnum = pgEnum("prioridade_task", ["alta", "media", "baixa"]);

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
  (table) => [
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
    onboardingCompleted: simNaoEnum("onboarding_completed").default("nao").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
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
  (table) => [
    index("metricas_mentorado_idx").on(table.mentoradoId),
    uniqueIndex("metricas_mentorado_periodo_idx").on(table.mentoradoId, table.ano, table.mes),
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
  (table) => [
    uniqueIndex("feedbacks_mentorado_periodo_idx").on(table.mentoradoId, table.ano, table.mes),
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
  (table) => [
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
  (table) => [
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
  (table) => [
    uniqueIndex("ranking_mentorado_periodo_idx").on(table.mentoradoId, table.ano, table.mes),
    index("ranking_turma_periodo_idx").on(table.turma, table.ano, table.mes),
    index("ranking_posicao_idx").on(table.turma, table.ano, table.mes, table.posicao),
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
  (table) => [uniqueIndex("metas_mentorado_tipo_idx").on(table.mentoradoId, table.tipo)]
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
  (table) => [
    index("notificacoes_mentorado_idx").on(table.mentoradoId),
    index("notificacoes_mentorado_lida_idx").on(table.mentoradoId, table.lida),
    index("notificacoes_created_idx").on(table.createdAt),
  ]
);

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;

/**
 * Moltbot Sessions - Chat sessions for AI assistant
 */
export const moltbotSessions = pgTable(
  "moltbot_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channelType: channelTypeEnum("channel_type").notNull(),
    sessionId: varchar("session_id", { length: 128 }).notNull(),
    isActive: simNaoEnum("is_active").default("sim").notNull(),
    config: text("config"), // JSON stringified config
    lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("moltbot_sessions_user_idx").on(table.userId),
    index("moltbot_sessions_active_idx").on(table.isActive),
    uniqueIndex("moltbot_sessions_user_channel_idx").on(table.userId, table.channelType),
  ]
);

export type MoltbotSession = typeof moltbotSessions.$inferSelect;
export type InsertMoltbotSession = typeof moltbotSessions.$inferInsert;

/**
 * Moltbot Messages - Chat message history
 */
export const moltbotMessages = pgTable(
  "moltbot_messages",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => moltbotSessions.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(), // "user" | "assistant"
    content: text("content").notNull(),
    metadata: text("metadata"), // JSON stringified metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("moltbot_messages_session_idx").on(table.sessionId),
    index("moltbot_messages_created_idx").on(table.createdAt),
  ]
);

export type MoltbotMessage = typeof moltbotMessages.$inferSelect;
export type InsertMoltbotMessage = typeof moltbotMessages.$inferInsert;

/**
 * Leads - CRM Leads
 */
export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    telefone: text("telefone"),
    empresa: text("empresa"),
    origem: origemLeadEnum("origem").notNull(),
    status: statusLeadEnum("status").notNull().default("novo"),
    valorEstimado: integer("valor_estimado"), // em centavos
    tags: text("tags").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("leads_mentorado_idx").on(table.mentoradoId),
    index("leads_status_idx").on(table.status),
    index("leads_origem_idx").on(table.origem),
    index("leads_mentorado_status_idx").on(table.mentoradoId, table.status),
    index("leads_created_idx").on(table.createdAt),
  ]
);

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Interacoes - CRM Interactions
 */
export const interacoes = pgTable(
  "interacoes",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id")

      .references(() => leads.id, { onDelete: "cascade" }),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    tipo: tipoInteracaoEnum("tipo").notNull(),
    notas: text("notas"),
    duracao: integer("duracao"), // minutos, para ligações
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("interacoes_lead_idx").on(table.leadId),
    index("interacoes_mentorado_idx").on(table.mentoradoId),
    index("interacoes_created_idx").on(table.createdAt),
    index("interacoes_lead_created_idx").on(table.leadId, table.createdAt),
  ]
);

export type Interacao = typeof interacoes.$inferSelect;
export type InsertInteracao = typeof interacoes.$inferInsert;

/**
 * Tasks - Mentorado specific tasks/checklist
 */
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: text("status").notNull().default("todo"), // "todo" | "done"
    category: text("category").default("geral"),
    priority: prioridadeTaskEnum("priority").default("media").notNull(),
    source: text("source").default("manual"), // "manual" | "atividade"
    atividadeCodigo: varchar("atividade_codigo", { length: 100 }), // Link to origin activity
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tasks_mentorado_idx").on(table.mentoradoId),
    index("tasks_status_idx").on(table.status),
    index("tasks_priority_idx").on(table.priority),
  ]
);

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Classes - Educational content and meetings
 */
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"), // Video or meeting URL
  date: timestamp("date"), // For live events
  type: text("type").default("aula"), // "aula" | "encontro" | "material"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

/**
 * Class Progress - Tracking watched status per mentorado
 */
export const classProgress = pgTable(
  "class_progress",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    classId: integer("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // "pending" | "watched"
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("class_progress_unique_idx").on(table.mentoradoId, table.classId),
    index("class_progress_mentorado_idx").on(table.mentoradoId),
  ]
);

export type ClassProgress = typeof classProgress.$inferSelect;
export type InsertClassProgress = typeof classProgress.$inferInsert;

/**
 * Playbook Modules - Phases/Modules of the mentorship
 */
export const playbookModules = pgTable(
  "playbook_modules",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    order: integer("order").notNull().default(0),
    turma: turmaEnum("turma"), // Optional: specific to a track
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("playbook_modules_order_idx").on(table.order),
    index("playbook_modules_turma_idx").on(table.turma),
  ]
);

export type PlaybookModule = typeof playbookModules.$inferSelect;
export type InsertPlaybookModule = typeof playbookModules.$inferInsert;

/**
 * Playbook Items - Specific actionable items within a module
 */
export const playbookItems = pgTable(
  "playbook_items",
  {
    id: serial("id").primaryKey(),
    moduleId: integer("module_id")
      .notNull()
      .references(() => playbookModules.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: text("type").default("task"), // "task" | "video" | "link"
    contentUrl: text("content_url"), // For videos or links
    isOptional: simNaoEnum("is_optional").default("nao").notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("playbook_items_module_idx").on(table.moduleId),
    index("playbook_items_order_idx").on(table.order),
  ]
);

export type PlaybookItem = typeof playbookItems.$inferSelect;
export type InsertPlaybookItem = typeof playbookItems.$inferInsert;

/**
 * Mentorado Playbook Progress - Tracking item completion
 */
export const playbookProgress = pgTable(
  "playbook_progress",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => playbookItems.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("completed"),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("playbook_progress_unique_idx").on(table.mentoradoId, table.itemId),
    index("playbook_progress_mentorado_idx").on(table.mentoradoId),
  ]
);

export type PlaybookProgress = typeof playbookProgress.$inferSelect;
export type InsertPlaybookProgress = typeof playbookProgress.$inferInsert;

/**
 * Atividade Progress - Tracking PLAY NEON activity steps per mentorado
 */
export const atividadeProgress = pgTable(
  "atividade_progress",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    atividadeCodigo: varchar("atividade_codigo", { length: 100 }).notNull(),
    stepCodigo: varchar("step_codigo", { length: 100 }).notNull(),
    completed: simNaoEnum("completed").default("nao").notNull(),
    completedAt: timestamp("completed_at"),
    notes: text("notes"), // Notas do mentorado para este passo
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("atividade_progress_unique_idx").on(
      table.mentoradoId,
      table.atividadeCodigo,
      table.stepCodigo
    ),
    index("atividade_progress_mentorado_idx").on(table.mentoradoId),
    index("atividade_progress_atividade_idx").on(table.mentoradoId, table.atividadeCodigo),
  ]
);

export type AtividadeProgress = typeof atividadeProgress.$inferSelect;
export type InsertAtividadeProgress = typeof atividadeProgress.$inferInsert;

/**
 * Interaction Templates - Pre-defined message templates for mentors
 */
export const interactionTemplates = pgTable(
  "interaction_templates",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    type: tipoInteracaoEnum("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("interaction_templates_user_idx").on(table.userId)]
);

export type InteractionTemplate = typeof interactionTemplates.$inferSelect;

export type InsertInteractionTemplate = typeof interactionTemplates.$inferInsert;

/**
 * Diagnosticos - Onboarding diagnostic data
 */
export const diagnosticos = pgTable(
  "diagnosticos",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    // 1. Sobre o Momento Atual Profissional
    atuacaoSaude: text("atuacao_saude"),
    tempoLivre: text("tempo_livre"),
    jaAtuaEstetica: text("ja_atua_estetica"),
    temClinica: text("tem_clinica"),

    // 2. Resultados Atuais
    rendaMensal: text("renda_mensal"),
    faturaEstetica: text("fatura_estetica"),
    contas: text("contas"), // PJ, PF, Investimento
    custoVida: text("custo_vida"),

    // 3. Dores e Desafios
    incomodaRotina: text("incomoda_rotina"),
    dificuldadeCrescer: text("dificuldade_crescer"),

    // 4. Objetivos e Sonhos
    objetivo6Meses: text("objetivo_6_meses"),
    resultadoTransformador: text("resultado_transformador"),
    organizacao: text("organizacao"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("diagnosticos_mentorado_idx").on(table.mentoradoId)]
);

export type Diagnostico = typeof diagnosticos.$inferSelect;
export type InsertDiagnostico = typeof diagnosticos.$inferInsert;

/**
 * Google Tokens - OAuth tokens for Google Calendar integration
 */
export const googleTokens = pgTable(
  "google_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at").notNull(),
    scope: text("scope").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("google_tokens_user_idx").on(table.userId)]
);

export type GoogleToken = typeof googleTokens.$inferSelect;
export type InsertGoogleToken = typeof googleTokens.$inferInsert;
