import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  date,
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
  "ranking",
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
export const tipoTransacaoEnum = pgEnum("tipo_transacao", ["receita", "despesa"]);
export const syncStatusEnum = pgEnum("sync_status", ["success", "failed", "partial"]);
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


export const temperaturaLeadEnum = pgEnum("temperatura_lead", ["frio", "morno", "quente"]);

// WhatsApp / Z-API enums
export const messageDirectionEnum = pgEnum("message_direction", ["inbound", "outbound"]);
export const messageStatusEnum = pgEnum("message_status", ["pending", "sent", "delivered", "read", "failed"]);
export const zapiInstanceStatusEnum = pgEnum("zapi_instance_status", ["trial", "active", "suspended", "canceled"]);
export const actionItemStatusEnum = pgEnum("action_item_status", ["pending", "completed"]);

// Patient Management Enums
export const pacienteStatusEnum = pgEnum("paciente_status", ["ativo", "inativo"]);
export const pacienteGeneroEnum = pgEnum("paciente_genero", ["masculino", "feminino", "outro", "prefiro_nao_dizer"]);
export const tipoFotoEnum = pgEnum("tipo_foto", ["antes", "depois", "evolucao", "simulacao"]);
export const tipoDocumentoEnum = pgEnum("tipo_documento", ["consentimento", "exame", "prescricao", "outro"]);
export const anguloFotoEnum = pgEnum("angulo_foto", ["frontal", "perfil_esquerdo", "perfil_direito", "obliquo"]);


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
    // Z-API WhatsApp Integration
    zapiInstanceId: varchar("zapi_instance_id", { length: 128 }),
    zapiToken: text("zapi_token"), // Encrypted - Instance Token
    zapiClientToken: text("zapi_client_token"), // Encrypted - Account Security Token (optional)
    zapiConnected: simNaoEnum("zapi_connected").default("nao"),
    zapiConnectedAt: timestamp("zapi_connected_at"),
    zapiPhone: varchar("zapi_phone", { length: 20 }),
    // Z-API Integrator Lifecycle Management
    zapiInstanceStatus: zapiInstanceStatusEnum("zapi_instance_status"),
    zapiInstanceDueDate: timestamp("zapi_instance_due_date"), // Trial expiry or next billing date
    zapiInstanceCreatedAt: timestamp("zapi_instance_created_at"), // When instance was provisioned
    zapiManagedByIntegrator: simNaoEnum("zapi_managed_by_integrator").default("nao"), // Distinguishes managed vs legacy
    // Meta WhatsApp Cloud API Integration
    metaWabaId: varchar("meta_waba_id", { length: 128 }),
    metaPhoneNumberId: varchar("meta_phone_number_id", { length: 128 }),
    metaAccessToken: text("meta_access_token"), // Encrypted - Permanent System User Access Token
    metaConnected: simNaoEnum("meta_connected").default("nao"),
    metaConnectedAt: timestamp("meta_connected_at"),
    metaPhoneNumber: varchar("meta_phone_number", { length: 20 }),
    // Instagram Integration
    instagramConnected: simNaoEnum("instagram_connected").default("nao"),
    instagramBusinessAccountId: varchar("instagram_business_account_id", { length: 100 }),
    // Baileys Self-Hosted WhatsApp Integration
    baileysConnected: simNaoEnum("baileys_connected").default("nao"),
    baileysPhone: varchar("baileys_phone", { length: 20 }),
    baileysConnectedAt: timestamp("baileys_connected_at"),
    lastMetricsReminder: timestamp("last_metrics_reminder"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("mentorados_user_id_idx").on(table.userId),
    uniqueIndex("mentorados_user_id_unique_idx").on(table.userId),
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
    // Monthly Goal Overrides (Optional)
    metaFaturamento: integer("meta_faturamento"),
    metaLeads: integer("meta_leads"),
    metaProcedimentos: integer("meta_procedimentos"),
    metaPosts: integer("meta_posts"),
    metaStories: integer("meta_stories"),
    // Instagram Sync Tracking
    instagramSynced: simNaoEnum("instagram_synced").default("nao"),
    instagramSyncDate: timestamp("instagram_sync_date"),
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
 * OpenClaw Sessions - Chat sessions for AI assistant
 */
export const openclawSessions = pgTable(
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

export type OpenClawSession = typeof openclawSessions.$inferSelect;
export type InsertOpenClawSession = typeof openclawSessions.$inferInsert;

/**
 * OpenClaw Messages - Chat message history
 */
export const openclawMessages = pgTable(
  "moltbot_messages",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => openclawSessions.id, { onDelete: "cascade" }),
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

export type OpenClawMessage = typeof openclawMessages.$inferSelect;
export type InsertOpenClawMessage = typeof openclawMessages.$inferInsert;

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
    
    // Novos campos
    indicadoPor: text("indicado_por"),
    profissao: text("profissao"),
    produtoInteresse: text("produto_interesse"),
    possuiClinica: simNaoEnum("possui_clinica"),
    anosEstetica: integer("anos_estetica"),
    faturamentoMensal: text("faturamento_mensal"),
    dorPrincipal: text("dor_principal"),
    desejoPrincipal: text("desejo_principal"),
    temperatura: temperaturaLeadEnum("temperatura"),

    // Campos Aesthetic (B2C)
    dataNascimento: date("data_nascimento"),
    genero: text("genero"),
    procedimentosInteresse: text("procedimentos_interesse").array(),
    historicoEstetico: text("historico_estetico"),
    alergias: text("alergias"),
    tipoPele: text("tipo_pele"),
    disponibilidade: text("disponibilidade"),
    
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
 * CRM Column Config - Custom Kanban columns
 */
export const crmColumnConfig = pgTable(
  "crm_column_config",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    originalId: varchar("original_id", { length: 50 }).notNull(), // 'novo', 'qualificado', etc
    label: varchar("label", { length: 100 }).notNull(), // Custom display name
    color: varchar("color", { length: 20 }).notNull(),   // e.g. "bg-blue-500"
    visible: simNaoEnum("visible").default("sim").notNull(),
    order: integer("order").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("crm_col_config_mentorado_idx").on(table.mentoradoId),
    uniqueIndex("crm_col_config_unique_idx").on(table.mentoradoId, table.originalId),
    index("crm_col_config_order_idx").on(table.mentoradoId, table.order),
  ]
);

export type CrmColumnConfig = typeof crmColumnConfig.$inferSelect;
export type InsertCrmColumnConfig = typeof crmColumnConfig.$inferInsert;


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
    // Admin grading fields
    grade: integer("grade"), // 0-10 scale
    feedback: text("feedback"), // Admin/Mentor feedback
    feedbackAt: timestamp("feedback_at"),
    gradedBy: integer("graded_by").references(() => users.id, { onDelete: "set null" }),
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

    // 1. Ponto de Partida (Context)
    atuacaoSaude: text("atuacao_saude"),
    tempoLivre: text("tempo_livre"),
    jaAtuaEstetica: text("ja_atua_estetica"),
    temClinica: text("tem_clinica"),

    // 2. Realidade Financeira (Financial Reality)
    rendaMensal: text("renda_mensal"),
    faturaEstetica: text("fatura_estetica"),
    contas: text("contas"),
    custoVida: text("custo_vida"),
    capacidadeInvestimento: text("capacidade_investimento"), // NEW: Investment capacity

    // 3. Desafios Atuais (Current Challenges)
    incomodaRotina: text("incomoda_rotina"),
    dificuldadeCrescer: text("dificuldade_crescer"),
    tentativasAnteriores: text("tentativas_anteriores"), // NEW: Previous attempts

    // 4. Visão de Sucesso (Success Vision)
    objetivo6Meses: text("objetivo_6_meses"),
    resultadoTransformador: text("resultado_transformador"),
    visaoUmAno: text("visao_um_ano"), // NEW: 1-year vision
    porqueAgora: text("porque_agora"), // NEW: Why now?

    // 5. Compromisso (Commitment)
    horasDisponiveis: text("horas_disponiveis"), // NEW: Available hours/week
    nivelPrioridade: text("nivel_prioridade"), // NEW: Priority level 1-10
    redeApoio: text("rede_apoio"), // NEW: Support network
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


/**
 * System Settings - Global configuration (Prompts, etc.)
 */
export const systemSettings = pgTable(
  "system_settings",
  {
    key: varchar("key", { length: 100 }).primaryKey(),
    value: text("value").notNull(),
    description: text("description"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP / Z-API INTEGRATION TABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * WhatsApp Messages - Message history for Z-API integration
 */
export const whatsappMessages = pgTable(
  "whatsapp_messages",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    phone: varchar("phone", { length: 20 }).notNull(),
    direction: messageDirectionEnum("direction").notNull(),
    content: text("content").notNull(),
    zapiMessageId: varchar("zapi_message_id", { length: 128 }),
    status: messageStatusEnum("status").default("pending").notNull(),
    isFromAi: simNaoEnum("is_from_ai").default("nao"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("whatsapp_messages_mentorado_idx").on(table.mentoradoId),
    index("whatsapp_messages_lead_idx").on(table.leadId),
    index("whatsapp_messages_phone_idx").on(table.phone),
    index("whatsapp_messages_created_idx").on(table.createdAt),
  ]
);

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;

/**
 * WhatsApp Contacts - Contact list for conversations not linked to CRM leads
 * Stores contact names and notes per mentorado
 */
export const whatsappContacts = pgTable(
  "whatsapp_contacts",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    phone: varchar("phone", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("whatsapp_contacts_phone_mentorado_idx").on(table.mentoradoId, table.phone),
    index("whatsapp_contacts_mentorado_idx").on(table.mentoradoId),
  ]
);

export type WhatsappContact = typeof whatsappContacts.$inferSelect;
export type InsertWhatsappContact = typeof whatsappContacts.$inferInsert;

/**
 * AI Agent Config - Configuration for AI SDR per mentorado
 */
export const aiAgentConfig = pgTable(
  "ai_agent_config",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    enabled: simNaoEnum("enabled").default("nao").notNull(),
    systemPrompt: text("system_prompt"),
    greetingMessage: text("greeting_message"),
    qualificationQuestions: text("qualification_questions"), // JSON string
    workingHoursStart: varchar("working_hours_start", { length: 5 }).default("09:00"),
    workingHoursEnd: varchar("working_hours_end", { length: 5 }).default("18:00"),
    workingDays: varchar("working_days", { length: 20 }).default("1,2,3,4,5"), // CSV: 0=Sun, 6=Sat
    responseDelayMs: integer("response_delay_ms").default(3000),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("ai_agent_config_mentorado_idx").on(table.mentoradoId)]
);

export type AiAgentConfig = typeof aiAgentConfig.$inferSelect;
export type InsertAiAgentConfig = typeof aiAgentConfig.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// INSTAGRAM INTEGRATION TABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Instagram Tokens - OAuth tokens for Instagram API integration
 * Modeled after googleTokens but references mentorados instead of users
 */
export const instagramTokens = pgTable(
  "instagram_tokens",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" })
      .unique(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at").notNull(),
    scope: text("scope").notNull(),
    instagramBusinessAccountId: varchar("instagram_business_account_id", { length: 100 }),
    instagramUsername: varchar("instagram_username", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("instagram_tokens_mentorado_idx").on(table.mentoradoId),
    index("instagram_tokens_expires_idx").on(table.expiresAt),
  ]
);

export type InstagramToken = typeof instagramTokens.$inferSelect;
export type InsertInstagramToken = typeof instagramTokens.$inferInsert;

/**
 * Instagram Sync Log - Tracks Instagram content sync history
 */
export const instagramSyncLog = pgTable(
  "instagram_sync_log",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
    postsCount: integer("posts_count").notNull().default(0),
    storiesCount: integer("stories_count").notNull().default(0),
    syncStatus: syncStatusEnum("sync_status").notNull(),
    errorMessage: text("error_message"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("instagram_sync_mentorado_periodo_idx").on(table.mentoradoId, table.ano, table.mes),
    index("instagram_sync_mentorado_idx").on(table.mentoradoId),
    index("instagram_sync_periodo_idx").on(table.ano, table.mes),
    index("instagram_sync_status_idx").on(table.syncStatus),
    index("instagram_sync_date_idx").on(table.syncedAt),
  ]
);

export type InstagramSyncLog = typeof instagramSyncLog.$inferSelect;
export type InsertInstagramSyncLog = typeof instagramSyncLog.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// FACEBOOK ADS INTEGRATION TABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Facebook Ads Tokens - OAuth tokens for Facebook Marketing API integration
 * Modeled after instagramTokens for consistency
 */
export const facebookAdsTokens = pgTable(
  "facebook_ads_tokens",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" })
      .unique(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at").notNull(),
    scope: text("scope").notNull(),
    adAccountId: varchar("ad_account_id", { length: 100 }), // act_XXXXX
    adAccountName: varchar("ad_account_name", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("facebook_ads_tokens_mentorado_idx").on(table.mentoradoId),
    index("facebook_ads_tokens_expires_idx").on(table.expiresAt),
  ]
);

export type FacebookAdsToken = typeof facebookAdsTokens.$inferSelect;
export type InsertFacebookAdsToken = typeof facebookAdsTokens.$inferInsert;

/**
 * Facebook Ad Accounts - Stores linked ad accounts per mentorado
 * A mentorado may have access to multiple ad accounts
 */
export const facebookAdAccounts = pgTable(
  "facebook_ad_accounts",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    adAccountId: varchar("ad_account_id", { length: 100 }).notNull(), // act_XXXXX
    accountName: varchar("account_name", { length: 255 }),
    currency: varchar("currency", { length: 10 }).default("BRL"),
    timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
    isActive: simNaoEnum("is_active").default("sim").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("facebook_ad_accounts_unique_idx").on(table.mentoradoId, table.adAccountId),
    index("facebook_ad_accounts_mentorado_idx").on(table.mentoradoId),
  ]
);

export type FacebookAdAccount = typeof facebookAdAccounts.$inferSelect;
export type InsertFacebookAdAccount = typeof facebookAdAccounts.$inferInsert;

/**
 * Facebook Ads Sync Log - Tracks sync history for Facebook Marketing API
 */
export const facebookAdsSyncLog = pgTable(
  "facebook_ads_sync_log",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
    campaignsCount: integer("campaigns_count").notNull().default(0),
    syncStatus: syncStatusEnum("sync_status").notNull(),
    errorMessage: text("error_message"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("facebook_ads_sync_mentorado_periodo_idx").on(table.mentoradoId, table.ano, table.mes),
    index("facebook_ads_sync_mentorado_idx").on(table.mentoradoId),
    index("facebook_ads_sync_periodo_idx").on(table.ano, table.mes),
    index("facebook_ads_sync_status_idx").on(table.syncStatus),
  ]
);

export type FacebookAdsSyncLog = typeof facebookAdsSyncLog.$inferSelect;
export type InsertFacebookAdsSyncLog = typeof facebookAdsSyncLog.$inferInsert;

/**
 * Facebook Ads Insights - Monthly aggregated metrics from Facebook Marketing API
 * Stores key advertising metrics for performance tracking
 */
export const facebookAdsInsights = pgTable(
  "facebook_ads_insights",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    adAccountId: varchar("ad_account_id", { length: 100 }).notNull(),
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
    // Core Metrics (stored as integers, amounts in centavos)
    impressions: integer("impressions").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    spend: integer("spend").notNull().default(0), // in centavos (BRL)
    reach: integer("reach").notNull().default(0),
    // Calculated Metrics (stored for quick access)
    cpm: integer("cpm").default(0), // Cost per 1000 impressions (centavos)
    cpc: integer("cpc").default(0), // Cost per click (centavos)
    ctr: integer("ctr").default(0), // CTR * 10000 for precision (e.g., 1.5% = 150)
    // Conversion Metrics
    conversions: integer("conversions").default(0),
    conversionValue: integer("conversion_value").default(0), // in centavos
    costPerConversion: integer("cost_per_conversion").default(0), // in centavos
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("facebook_ads_insights_unique_idx").on(table.mentoradoId, table.adAccountId, table.ano, table.mes),
    index("facebook_ads_insights_mentorado_idx").on(table.mentoradoId),
    index("facebook_ads_insights_periodo_idx").on(table.ano, table.mes),
  ]
);

export type FacebookAdsInsight = typeof facebookAdsInsights.$inferSelect;
export type InsertFacebookAdsInsight = typeof facebookAdsInsights.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// CALL NOTES TABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Call Notes - Records from mentor-mentee calls
 */
export const callNotes = pgTable(
  "call_notes",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    dataCall: timestamp("data_call").notNull(),
    principaisInsights: text("principais_insights").notNull(),
    acoesAcordadas: text("acoes_acordadas").notNull(),
    proximosPassos: text("proximos_passos").notNull(),
    duracaoMinutos: integer("duracao_minutos"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("call_notes_mentorado_idx").on(table.mentoradoId),
    index("call_notes_data_idx").on(table.dataCall),
    index("call_notes_mentorado_data_idx").on(table.mentoradoId, table.dataCall),
  ]
);

export type CallNote = typeof callNotes.$inferSelect;
export type InsertCallNote = typeof callNotes.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// WEEKLY PLANNING TABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Weekly Plans - Stores weekly planning content created by mentors
 */
export const weeklyPlans = pgTable(
  "weekly_plans",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    semana: integer("semana").notNull(), // Week number: 1, 2, 3, 4
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
    titulo: varchar("titulo", { length: 255 }).notNull(),
    conteudo: text("conteudo").notNull(), // Raw text from mentor
    ativo: simNaoEnum("ativo").default("sim").notNull(),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("weekly_plans_mentorado_semana_idx").on(
      table.mentoradoId,
      table.ano,
      table.mes,
      table.semana
    ),
    index("weekly_plans_mentorado_idx").on(table.mentoradoId),
    index("weekly_plans_ativo_idx").on(table.mentoradoId, table.ativo),
  ]
);

export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type InsertWeeklyPlan = typeof weeklyPlans.$inferInsert;

/**
 * Weekly Plan Progress - Tracks step completion per mentorado
 */
export const weeklyPlanProgress = pgTable(
  "weekly_plan_progress",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id")
      .notNull()
      .references(() => weeklyPlans.id, { onDelete: "cascade" }),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    stepIndex: integer("step_index").notNull(), // Line number in content
    completed: simNaoEnum("completed").default("nao").notNull(),
    notes: text("notes"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("weekly_progress_unique_idx").on(table.planId, table.mentoradoId, table.stepIndex),
    index("weekly_progress_plan_idx").on(table.planId),
    index("weekly_progress_mentorado_idx").on(table.mentoradoId),
  ]
);

export type WeeklyPlanProgress = typeof weeklyPlanProgress.$inferSelect;
export type InsertWeeklyPlanProgress = typeof weeklyPlanProgress.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// MENTORSHIP PLANNING TABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mentorship Sessions - Individual mentor-mentee session tracking
 */
export const mentorshipSessions = pgTable(
  "mentorship_sessions",
  {
    id: serial("id").primaryKey(),
    mentorId: integer("mentor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    sessionDate: timestamp("session_date").defaultNow().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("mentorship_sessions_mentor_idx").on(table.mentorId),
    index("mentorship_sessions_mentorado_idx").on(table.mentoradoId),
    index("mentorship_sessions_date_idx").on(table.sessionDate),
  ]
);

export type MentorshipSession = typeof mentorshipSessions.$inferSelect;
export type InsertMentorshipSession = typeof mentorshipSessions.$inferInsert;

/**
 * Mentorship Action Items - Trackable tasks from mentorship sessions
 */
export const mentorshipActionItems = pgTable(
  "mentorship_action_items",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => mentorshipSessions.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    status: actionItemStatusEnum("status").default("pending").notNull(),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("mentorship_action_items_session_idx").on(table.sessionId),
    index("mentorship_action_items_status_idx").on(table.status),
  ]
);

export type MentorshipActionItem = typeof mentorshipActionItems.$inferSelect;
export type InsertMentorshipActionItem = typeof mentorshipActionItems.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Notification Settings - Global admin-configurable notification settings
 */
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  // Schedule config (which days of month to send reminders)
  reminderDays: text("reminder_days").notNull().default("[1,3,6,11]"), // JSON array
  // Enable/disable notification types
  metricsRemindersEnabled: simNaoEnum("metrics_reminders_enabled").default("sim").notNull(),
  badgeNotificationsEnabled: simNaoEnum("badge_notifications_enabled").default("sim").notNull(),
  rankingNotificationsEnabled: simNaoEnum("ranking_notifications_enabled").default("sim").notNull(),
  // Email templates (JSON with subject/body overrides per template)
  emailTemplates: text("email_templates"), // JSON: { templateName: { subject, body } }
  // In-app notification templates (JSON with title/message overrides)
  inAppTemplates: text("in_app_templates"), // JSON: { templateName: { title, message } }
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// FINANCIAL MODULE TABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Categorias Financeiras - Categories for income/expenses
 */
export const categoriasFinanceiras = pgTable(
  "categorias_financeiras",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    tipo: tipoTransacaoEnum("tipo").notNull(),
    nome: varchar("nome", { length: 100 }).notNull(),
    descricao: text("descricao"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("categorias_fin_mentorado_idx").on(table.mentoradoId),
    uniqueIndex("categorias_fin_unique_idx").on(table.mentoradoId, table.tipo, table.nome),
  ]
);

export type CategoriaFinanceira = typeof categoriasFinanceiras.$inferSelect;
export type InsertCategoriaFinanceira = typeof categoriasFinanceiras.$inferInsert;

/**
 * Formas de Pagamento - Payment methods with fees
 */
export const formasPagamento = pgTable(
  "formas_pagamento",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 100 }).notNull(),
    taxaPercentual: integer("taxa_percentual").default(0), // 150 = 1.5%
    prazoRecebimentoDias: integer("prazo_recebimento_dias").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("formas_pag_mentorado_idx").on(table.mentoradoId),
    uniqueIndex("formas_pag_unique_idx").on(table.mentoradoId, table.nome),
  ]
);

export type FormaPagamento = typeof formasPagamento.$inferSelect;
export type InsertFormaPagamento = typeof formasPagamento.$inferInsert;

/**
 * Transacoes - Financial transactions (DRE entries)
 */
export const transacoes = pgTable(
  "transacoes",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    data: date("data").notNull(),
    tipo: tipoTransacaoEnum("tipo").notNull(),
    categoriaId: integer("categoria_id").references(() => categoriasFinanceiras.id),
    descricao: text("descricao").notNull(),
    nomeClienteFornecedor: varchar("nome_cliente_fornecedor", { length: 255 }),
    formaPagamentoId: integer("forma_pagamento_id").references(() => formasPagamento.id),
    valor: integer("valor").notNull(), // em centavos
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("transacoes_mentorado_idx").on(table.mentoradoId),
    index("transacoes_data_idx").on(table.data),
    index("transacoes_mentorado_data_idx").on(table.mentoradoId, table.data),
    index("transacoes_categoria_idx").on(table.categoriaId),
  ]
);

export type Transacao = typeof transacoes.$inferSelect;
export type InsertTransacao = typeof transacoes.$inferInsert;

/**
 * Insumos - Supplies/ingredients used in procedures
 */
export const insumos = pgTable(
  "insumos",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 255 }).notNull(),
    valorCompra: integer("valor_compra").notNull(), // em centavos
    rendimento: real("rendimento").notNull().default(1), // número de usos (aceita decimais, ex: 1.5)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("insumos_mentorado_idx").on(table.mentoradoId)]
);

export type Insumo = typeof insumos.$inferSelect;
export type InsertInsumo = typeof insumos.$inferInsert;

/**
 * Procedimentos - Services/procedures offered
 */
export const procedimentos = pgTable(
  "procedimentos",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 255 }).notNull(),
    precoVenda: integer("preco_venda").notNull(), // em centavos
    custoOperacional: integer("custo_operacional").default(0), // em centavos
    custoInvestimento: integer("custo_investimento").default(0), // em centavos
    percentualParceiro: integer("percentual_parceiro").default(0), // 0-10000 (0-100%)
    percentualImposto: integer("percentual_imposto").default(700), // 700 = 7%
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("procedimentos_mentorado_idx").on(table.mentoradoId)]
);

export type Procedimento = typeof procedimentos.$inferSelect;
export type InsertProcedimento = typeof procedimentos.$inferInsert;

/**
 * Procedimento Insumos - Junction table for procedure-supply relationship
 */
export const procedimentoInsumos = pgTable(
  "procedimento_insumos",
  {
    id: serial("id").primaryKey(),
    procedimentoId: integer("procedimento_id")
      .notNull()
      .references(() => procedimentos.id, { onDelete: "cascade" }),
    insumoId: integer("insumo_id")
      .notNull()
      .references(() => insumos.id, { onDelete: "cascade" }),
    quantidade: integer("quantidade").default(1),
  },
  (table) => [
    uniqueIndex("proc_insumo_unique_idx").on(table.procedimentoId, table.insumoId),
    index("proc_insumo_proc_idx").on(table.procedimentoId),
    index("proc_insumo_insumo_idx").on(table.insumoId),
  ]
);

export type ProcedimentoInsumo = typeof procedimentoInsumos.$inferSelect;
export type InsertProcedimentoInsumo = typeof procedimentoInsumos.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// PATIENT MANAGEMENT TABLES (Prontuário Estético)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pacientes - Core patient table
 * Each patient belongs to a mentorado (clinic owner)
 */
export const pacientes = pgTable(
  "pacientes",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    nomeCompleto: varchar("nome_completo", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    telefone: varchar("telefone", { length: 20 }),
    dataNascimento: date("data_nascimento"),
    genero: pacienteGeneroEnum("genero"),
    cpf: varchar("cpf", { length: 14 }),
    endereco: text("endereco"),
    fotoUrl: text("foto_url"),
    observacoes: text("observacoes"),
    status: pacienteStatusEnum("status").default("ativo").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("pacientes_mentorado_idx").on(table.mentoradoId),
    index("pacientes_status_idx").on(table.mentoradoId, table.status),
    index("pacientes_nome_idx").on(table.nomeCompleto),
    index("pacientes_telefone_idx").on(table.telefone),
    uniqueIndex("pacientes_cpf_mentorado_idx").on(table.mentoradoId, table.cpf),
  ]
);

export type Paciente = typeof pacientes.$inferSelect;
export type InsertPaciente = typeof pacientes.$inferInsert;

/**
 * Pacientes Info Médica - Medical information for each patient
 * One-to-one relationship with pacientes
 */
export const pacientesInfoMedica = pgTable(
  "pacientes_info_medica",
  {
    id: serial("id").primaryKey(),
    pacienteId: integer("paciente_id")
      .notNull()
      .references(() => pacientes.id, { onDelete: "cascade" })
      .unique(),
    tipoSanguineo: varchar("tipo_sanguineo", { length: 5 }),
    alergias: text("alergias"),
    medicamentosAtuais: text("medicamentos_atuais"),
    condicoesPreexistentes: text("condicoes_preexistentes"),
    historicoCircurgico: text("historico_cirurgico"),
    contraindacacoes: text("contraindicacoes"),
    observacoesClinicas: text("observacoes_clinicas"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("pacientes_info_medica_paciente_idx").on(table.pacienteId)]
);

export type PacienteInfoMedica = typeof pacientesInfoMedica.$inferSelect;
export type InsertPacienteInfoMedica = typeof pacientesInfoMedica.$inferInsert;

/**
 * Pacientes Procedimentos - Procedure history for each patient
 */
export const pacientesProcedimentos = pgTable(
  "pacientes_procedimentos",
  {
    id: serial("id").primaryKey(),
    pacienteId: integer("paciente_id")
      .notNull()
      .references(() => pacientes.id, { onDelete: "cascade" }),
    procedimentoId: integer("procedimento_id").references(() => procedimentos.id, {
      onDelete: "set null",
    }),
    nomeProcedimento: varchar("nome_procedimento", { length: 255 }).notNull(),
    dataRealizacao: timestamp("data_realizacao").notNull(),
    profissionalResponsavel: varchar("profissional_responsavel", { length: 255 }),
    valorCobrado: integer("valor_cobrado"), // em centavos
    valorReal: integer("valor_real"), // valor com desconto, em centavos
    observacoes: text("observacoes"),
    resultadoAvaliacao: text("resultado_avaliacao"),
    // Specific to aesthetic procedures
    areaAplicacao: varchar("area_aplicacao", { length: 255 }),
    produtosUtilizados: text("produtos_utilizados"),
    quantidadeAplicada: varchar("quantidade_aplicada", { length: 100 }),
    lotesProdutos: text("lotes_produtos"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("pacientes_proc_paciente_idx").on(table.pacienteId),
    index("pacientes_proc_data_idx").on(table.dataRealizacao),
    index("pacientes_proc_paciente_data_idx").on(table.pacienteId, table.dataRealizacao),
  ]
);

export type PacienteProcedimento = typeof pacientesProcedimentos.$inferSelect;
export type InsertPacienteProcedimento = typeof pacientesProcedimentos.$inferInsert;

/**
 * Pacientes Fotos - Photo gallery for each patient (before/after, evolution)
 */
export const pacientesFotos = pgTable(
  "pacientes_fotos",
  {
    id: serial("id").primaryKey(),
    pacienteId: integer("paciente_id")
      .notNull()
      .references(() => pacientes.id, { onDelete: "cascade" }),
    procedimentoRealizadoId: integer("procedimento_realizado_id").references(
      () => pacientesProcedimentos.id,
      { onDelete: "set null" }
    ),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    tipo: tipoFotoEnum("tipo").notNull(),
    angulo: anguloFotoEnum("angulo"),
    dataCaptura: timestamp("data_captura").defaultNow().notNull(),
    descricao: text("descricao"),
    areaFotografada: varchar("area_fotografada", { length: 255 }),
    // Metadata for comparison
    parComId: integer("par_com_id"), // ID of the paired before/after photo
    grupoId: varchar("grupo_id", { length: 64 }), // Group photos for comparison sets
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("pacientes_fotos_paciente_idx").on(table.pacienteId),
    index("pacientes_fotos_tipo_idx").on(table.pacienteId, table.tipo),
    index("pacientes_fotos_data_idx").on(table.dataCaptura),
    index("pacientes_fotos_grupo_idx").on(table.grupoId),
    index("pacientes_fotos_proc_idx").on(table.procedimentoRealizadoId),
  ]
);

export type PacienteFoto = typeof pacientesFotos.$inferSelect;
export type InsertPacienteFoto = typeof pacientesFotos.$inferInsert;

/**
 * Pacientes Documentos - Document management for patients
 * (consent forms, exams, prescriptions)
 */
export const pacientesDocumentos = pgTable(
  "pacientes_documentos",
  {
    id: serial("id").primaryKey(),
    pacienteId: integer("paciente_id")
      .notNull()
      .references(() => pacientes.id, { onDelete: "cascade" }),
    procedimentoRealizadoId: integer("procedimento_realizado_id").references(
      () => pacientesProcedimentos.id,
      { onDelete: "set null" }
    ),
    tipo: tipoDocumentoEnum("tipo").notNull(),
    nome: varchar("nome", { length: 255 }).notNull(),
    url: text("url").notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    tamanhoBytes: integer("tamanho_bytes"),
    dataAssinatura: timestamp("data_assinatura"),
    assinadoPor: varchar("assinado_por", { length: 255 }),
    observacoes: text("observacoes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("pacientes_docs_paciente_idx").on(table.pacienteId),
    index("pacientes_docs_tipo_idx").on(table.pacienteId, table.tipo),
    index("pacientes_docs_proc_idx").on(table.procedimentoRealizadoId),
  ]
);

export type PacienteDocumento = typeof pacientesDocumentos.$inferSelect;
export type InsertPacienteDocumento = typeof pacientesDocumentos.$inferInsert;

/**
 * Pacientes Chat IA - AI chat history for each patient
 * Stores conversations with the AI assistant for analysis and simulations
 */
export const pacientesChatIa = pgTable(
  "pacientes_chat_ia",
  {
    id: serial("id").primaryKey(),
    pacienteId: integer("paciente_id")
      .notNull()
      .references(() => pacientes.id, { onDelete: "cascade" }),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
    content: text("content").notNull(),
    // For image-based messages
    fotoId: integer("foto_id").references(() => pacientesFotos.id, { onDelete: "set null" }),
    imagemUrl: text("imagem_url"),
    imagemGeradaUrl: text("imagem_gerada_url"), // AI-generated simulation result
    // Metadata
    tokens: integer("tokens"),
    metadata: jsonb("metadata"), // { procedimento, prompt_type, etc }
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("pacientes_chat_paciente_idx").on(table.pacienteId),
    index("pacientes_chat_session_idx").on(table.sessionId),
    index("pacientes_chat_paciente_session_idx").on(table.pacienteId, table.sessionId),
    index("pacientes_chat_created_idx").on(table.createdAt),
  ]
);

export type PacienteChatIa = typeof pacientesChatIa.$inferSelect;
export type InsertPacienteChatIa = typeof pacientesChatIa.$inferInsert;
