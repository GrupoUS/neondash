CREATE TYPE "public"."angulo_foto" AS ENUM('frontal', 'perfil_esquerdo', 'perfil_direito', 'obliquo');--> statement-breakpoint
CREATE TYPE "public"."paciente_genero" AS ENUM('masculino', 'feminino', 'outro', 'prefiro_nao_dizer');--> statement-breakpoint
CREATE TYPE "public"."paciente_status" AS ENUM('ativo', 'inativo');--> statement-breakpoint
CREATE TYPE "public"."status_tratamento" AS ENUM('planejado', 'em_andamento', 'concluido', 'cancelado', 'pausado');--> statement-breakpoint
CREATE TYPE "public"."tipo_consentimento" AS ENUM('dados_pessoais', 'marketing', 'fotos', 'procedimento');--> statement-breakpoint
CREATE TYPE "public"."tipo_documento" AS ENUM('consentimento', 'exame', 'prescricao', 'outro');--> statement-breakpoint
CREATE TYPE "public"."tipo_foto" AS ENUM('antes', 'depois', 'evolucao', 'simulacao');--> statement-breakpoint
CREATE TYPE "public"."tipo_pele_fitzpatrick" AS ENUM('I', 'II', 'III', 'IV', 'V', 'VI');--> statement-breakpoint
CREATE TYPE "public"."campaign_platform" AS ENUM('instagram', 'whatsapp', 'both');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'active', 'completed', 'paused', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'generating', 'scheduled', 'publishing', 'published', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('image', 'carousel', 'reel', 'story');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('promocao', 'educativo', 'depoimento', 'antes_depois', 'dica', 'lancamento', 'institucional');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed');--> statement-breakpoint
CREATE TABLE "facebook_ad_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"ad_account_id" varchar(100) NOT NULL,
	"account_name" varchar(255),
	"currency" varchar(10) DEFAULT 'BRL',
	"timezone" varchar(50) DEFAULT 'America/Sao_Paulo',
	"is_active" "sim_nao" DEFAULT 'sim' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facebook_ads_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"ad_account_id" varchar(100) NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"spend" integer DEFAULT 0 NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"cpm" integer DEFAULT 0,
	"cpc" integer DEFAULT 0,
	"ctr" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"conversion_value" integer DEFAULT 0,
	"cost_per_conversion" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facebook_ads_sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL,
	"campaigns_count" integer DEFAULT 0 NOT NULL,
	"sync_status" "sync_status" NOT NULL,
	"error_message" text,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facebook_ads_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp NOT NULL,
	"scope" text NOT NULL,
	"ad_account_id" varchar(100),
	"ad_account_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "facebook_ads_tokens_mentorado_id_unique" UNIQUE("mentorado_id")
);
--> statement-breakpoint
CREATE TABLE "pacientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"nome_completo" varchar(255) NOT NULL,
	"nome_preferido" varchar(100),
	"email" varchar(320),
	"telefone" varchar(20),
	"data_nascimento" date,
	"genero" "paciente_genero",
	"cpf" varchar(14),
	"rg" varchar(20),
	"endereco" text,
	"cep" varchar(9),
	"logradouro" varchar(255),
	"numero" varchar(20),
	"complemento" varchar(100),
	"bairro" varchar(100),
	"cidade" varchar(100),
	"estado" varchar(2),
	"convenio" varchar(100),
	"numero_carteirinha" varchar(50),
	"telefone_secundario" varchar(20),
	"metodo_contato_preferido" varchar(20) DEFAULT 'whatsapp',
	"numero_convenio" varchar(50),
	"contato_emergencia_nome" varchar(255),
	"contato_emergencia_telefone" varchar(20),
	"contato_emergencia_relacao" varchar(50),
	"lgpd_consentimento" "sim_nao" DEFAULT 'nao',
	"lgpd_data_consentimento" timestamp,
	"lgpd_consentimento_marketing" "sim_nao" DEFAULT 'nao',
	"lgpd_consentimento_fotos" "sim_nao" DEFAULT 'nao',
	"foto_url" text,
	"observacoes" text,
	"status" "paciente_status" DEFAULT 'ativo' NOT NULL,
	"numero_prontuario" varchar(20),
	"total_consultas" integer DEFAULT 0,
	"total_faltas" integer DEFAULT 0,
	"ultima_visita" timestamp,
	"proxima_consulta" timestamp,
	"valor_total_gasto" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pacientes_chat_ia" (
	"id" serial PRIMARY KEY NOT NULL,
	"paciente_id" integer NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"foto_id" integer,
	"imagem_url" text,
	"imagem_gerada_url" text,
	"tokens" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pacientes_consentimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"paciente_id" integer NOT NULL,
	"tipo" "tipo_consentimento" NOT NULL,
	"consentido" "sim_nao" NOT NULL,
	"ip_address" varchar(45),
	"documento_s3_key" text,
	"data_consentimento" timestamp DEFAULT now() NOT NULL,
	"data_revogacao" timestamp,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "pacientes_documentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"paciente_id" integer NOT NULL,
	"procedimento_realizado_id" integer,
	"tipo" "tipo_documento" NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"url" text NOT NULL,
	"s3_key" text,
	"mime_type" varchar(100),
	"tamanho_bytes" integer,
	"data_assinatura" timestamp,
	"assinado_por" varchar(255),
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pacientes_fotos" (
	"id" serial PRIMARY KEY NOT NULL,
	"paciente_id" integer NOT NULL,
	"procedimento_realizado_id" integer,
	"url" text NOT NULL,
	"s3_key" text,
	"thumbnail_url" text,
	"tipo" "tipo_foto" NOT NULL,
	"angulo" "angulo_foto",
	"data_captura" timestamp DEFAULT now() NOT NULL,
	"descricao" text,
	"area_fotografada" varchar(255),
	"par_com_id" integer,
	"grupo_id" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pacientes_info_medica" (
	"id" serial PRIMARY KEY NOT NULL,
	"paciente_id" integer NOT NULL,
	"tipo_sanguineo" varchar(5),
	"alergias" text,
	"medicamentos_atuais" text,
	"condicoes_preexistentes" text,
	"historico_cirurgico" text,
	"contraindicacoes" text,
	"observacoes_clinicas" text,
	"tipo_pele" "tipo_pele_fitzpatrick",
	"fototipo" varchar(20),
	"queixas_principais" text[],
	"historico_procedimentos_anteriores" text,
	"expectativas_tratamento" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pacientes_info_medica_paciente_id_unique" UNIQUE("paciente_id")
);
--> statement-breakpoint
CREATE TABLE "pacientes_procedimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"paciente_id" integer NOT NULL,
	"procedimento_id" integer,
	"titulo" varchar(255),
	"status" "status_tratamento" DEFAULT 'planejado',
	"data_realizacao" timestamp,
	"profissional_responsavel" varchar(255),
	"profissional_responsavel_id" integer,
	"notas_clinicas" text,
	"diagnostico" text,
	"tecnica_utilizada" text,
	"observacoes" text,
	"peso" numeric(5, 2),
	"altura" numeric(3, 2),
	"pressao_arterial" varchar(20),
	"duracao_minutos" integer,
	"valor_cobrado" integer,
	"valor_real" integer,
	"resultado_avaliacao" text,
	"area_aplicacao" varchar(255),
	"produtos_utilizados" text,
	"quantidade_aplicada" varchar(100),
	"lotes_produtos" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planos_tratamento" (
	"id" serial PRIMARY KEY NOT NULL,
	"paciente_id" integer NOT NULL,
	"mentorado_id" integer NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"objetivos" text[],
	"status" "status_tratamento" DEFAULT 'planejado',
	"progresso_percentual" integer DEFAULT 0,
	"sessoes_planejadas" integer DEFAULT 0,
	"sessoes_realizadas" integer DEFAULT 0,
	"data_inicio" date,
	"data_prevista_fim" date,
	"data_real_fim" date,
	"valor_total" integer,
	"valor_pago" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_content_generation_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"generation_type" varchar(50) NOT NULL,
	"prompt_used" text NOT NULL,
	"result_summary" text,
	"model_used" varchar(50) NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"images_generated" integer,
	"estimated_cost_cents" integer DEFAULT 0,
	"post_id" integer,
	"campaign_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"platform" "campaign_platform" NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"topic" text,
	"target_audience" text,
	"tone_of_voice" varchar(100),
	"total_posts" integer DEFAULT 0,
	"published_posts" integer DEFAULT 0,
	"total_reach" integer DEFAULT 0,
	"total_engagement" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"mentorado_id" integer NOT NULL,
	"caption" text NOT NULL,
	"hashtags" text[],
	"call_to_action" text,
	"image_url" text,
	"image_prompt" text,
	"media_type" "post_type" DEFAULT 'image' NOT NULL,
	"scheduled_for" timestamp,
	"published_at" timestamp,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"instagram_container_id" varchar(100),
	"instagram_media_id" varchar(100),
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"order" integer DEFAULT 0,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "template_category" NOT NULL,
	"platform" "campaign_platform" NOT NULL,
	"caption_template" text NOT NULL,
	"image_prompt_template" text,
	"suggested_hashtags" text[],
	"is_public" "sim_nao" DEFAULT 'nao' NOT NULL,
	"usage_count" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_campaign_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"lead_id" integer,
	"phone" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"zapi_message_id" varchar(128),
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"replied_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"marketing_campaign_id" integer,
	"name" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"media_url" text,
	"media_type" varchar(20),
	"target_filter" jsonb,
	"target_contacts_count" integer DEFAULT 0,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"completed_at" timestamp,
	"status" "whatsapp_campaign_status" DEFAULT 'draft' NOT NULL,
	"messages_sent" integer DEFAULT 0,
	"messages_delivered" integer DEFAULT 0,
	"messages_read" integer DEFAULT 0,
	"messages_replied" integer DEFAULT 0,
	"messages_failed" integer DEFAULT 0,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "insumos" ALTER COLUMN "rendimento" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "insumos" ALTER COLUMN "rendimento" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "procedimentos_interesse" SET DATA TYPE integer[];--> statement-breakpoint
ALTER TABLE "atividade_progress" ADD COLUMN "grade" integer;--> statement-breakpoint
ALTER TABLE "atividade_progress" ADD COLUMN "feedback" text;--> statement-breakpoint
ALTER TABLE "atividade_progress" ADD COLUMN "feedback_at" timestamp;--> statement-breakpoint
ALTER TABLE "atividade_progress" ADD COLUMN "graded_by" integer;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "meta_waba_id" varchar(128);--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "meta_phone_number_id" varchar(128);--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "meta_access_token" text;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "meta_connected" "sim_nao" DEFAULT 'nao';--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "meta_connected_at" timestamp;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "meta_phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "baileys_connected" "sim_nao" DEFAULT 'nao';--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "baileys_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "baileys_connected_at" timestamp;--> statement-breakpoint
ALTER TABLE "facebook_ad_accounts" ADD CONSTRAINT "facebook_ad_accounts_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facebook_ads_insights" ADD CONSTRAINT "facebook_ads_insights_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facebook_ads_sync_log" ADD CONSTRAINT "facebook_ads_sync_log_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facebook_ads_tokens" ADD CONSTRAINT "facebook_ads_tokens_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_chat_ia" ADD CONSTRAINT "pacientes_chat_ia_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_chat_ia" ADD CONSTRAINT "pacientes_chat_ia_foto_id_pacientes_fotos_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."pacientes_fotos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_consentimentos" ADD CONSTRAINT "pacientes_consentimentos_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_consentimentos" ADD CONSTRAINT "pacientes_consentimentos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_documentos" ADD CONSTRAINT "pacientes_documentos_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_documentos" ADD CONSTRAINT "pacientes_documentos_procedimento_realizado_id_pacientes_procedimentos_id_fk" FOREIGN KEY ("procedimento_realizado_id") REFERENCES "public"."pacientes_procedimentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_fotos" ADD CONSTRAINT "pacientes_fotos_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_fotos" ADD CONSTRAINT "pacientes_fotos_procedimento_realizado_id_pacientes_procedimentos_id_fk" FOREIGN KEY ("procedimento_realizado_id") REFERENCES "public"."pacientes_procedimentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_info_medica" ADD CONSTRAINT "pacientes_info_medica_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_procedimentos" ADD CONSTRAINT "pacientes_procedimentos_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_procedimentos" ADD CONSTRAINT "pacientes_procedimentos_procedimento_id_procedimentos_id_fk" FOREIGN KEY ("procedimento_id") REFERENCES "public"."procedimentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes_procedimentos" ADD CONSTRAINT "pacientes_procedimentos_profissional_responsavel_id_users_id_fk" FOREIGN KEY ("profissional_responsavel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planos_tratamento" ADD CONSTRAINT "planos_tratamento_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planos_tratamento" ADD CONSTRAINT "planos_tratamento_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planos_tratamento" ADD CONSTRAINT "planos_tratamento_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_content_generation_log" ADD CONSTRAINT "ai_content_generation_log_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_content_generation_log" ADD CONSTRAINT "ai_content_generation_log_post_id_marketing_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."marketing_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_content_generation_log" ADD CONSTRAINT "ai_content_generation_log_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_posts" ADD CONSTRAINT "marketing_posts_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_posts" ADD CONSTRAINT "marketing_posts_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_templates" ADD CONSTRAINT "marketing_templates_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_templates" ADD CONSTRAINT "marketing_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_campaign_messages" ADD CONSTRAINT "whatsapp_campaign_messages_campaign_id_whatsapp_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."whatsapp_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_campaign_messages" ADD CONSTRAINT "whatsapp_campaign_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_campaigns" ADD CONSTRAINT "whatsapp_campaigns_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_campaigns" ADD CONSTRAINT "whatsapp_campaigns_marketing_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("marketing_campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "facebook_ad_accounts_unique_idx" ON "facebook_ad_accounts" USING btree ("mentorado_id","ad_account_id");--> statement-breakpoint
CREATE INDEX "facebook_ad_accounts_mentorado_idx" ON "facebook_ad_accounts" USING btree ("mentorado_id");--> statement-breakpoint
CREATE UNIQUE INDEX "facebook_ads_insights_unique_idx" ON "facebook_ads_insights" USING btree ("mentorado_id","ad_account_id","ano","mes");--> statement-breakpoint
CREATE INDEX "facebook_ads_insights_mentorado_idx" ON "facebook_ads_insights" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "facebook_ads_insights_periodo_idx" ON "facebook_ads_insights" USING btree ("ano","mes");--> statement-breakpoint
CREATE UNIQUE INDEX "facebook_ads_sync_mentorado_periodo_idx" ON "facebook_ads_sync_log" USING btree ("mentorado_id","ano","mes");--> statement-breakpoint
CREATE INDEX "facebook_ads_sync_mentorado_idx" ON "facebook_ads_sync_log" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "facebook_ads_sync_periodo_idx" ON "facebook_ads_sync_log" USING btree ("ano","mes");--> statement-breakpoint
CREATE INDEX "facebook_ads_sync_status_idx" ON "facebook_ads_sync_log" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "facebook_ads_tokens_mentorado_idx" ON "facebook_ads_tokens" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "facebook_ads_tokens_expires_idx" ON "facebook_ads_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "pacientes_mentorado_idx" ON "pacientes" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "pacientes_status_idx" ON "pacientes" USING btree ("mentorado_id","status");--> statement-breakpoint
CREATE INDEX "pacientes_nome_idx" ON "pacientes" USING btree ("nome_completo");--> statement-breakpoint
CREATE INDEX "pacientes_telefone_idx" ON "pacientes" USING btree ("telefone");--> statement-breakpoint
CREATE UNIQUE INDEX "pacientes_cpf_mentorado_idx" ON "pacientes" USING btree ("mentorado_id","cpf");--> statement-breakpoint
CREATE INDEX "pacientes_chat_paciente_idx" ON "pacientes_chat_ia" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "pacientes_chat_session_idx" ON "pacientes_chat_ia" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "pacientes_chat_paciente_session_idx" ON "pacientes_chat_ia" USING btree ("paciente_id","session_id");--> statement-breakpoint
CREATE INDEX "pacientes_chat_created_idx" ON "pacientes_chat_ia" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pacientes_consentimentos_paciente_idx" ON "pacientes_consentimentos" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "pacientes_consentimentos_tipo_idx" ON "pacientes_consentimentos" USING btree ("paciente_id","tipo");--> statement-breakpoint
CREATE INDEX "pacientes_docs_paciente_idx" ON "pacientes_documentos" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "pacientes_docs_tipo_idx" ON "pacientes_documentos" USING btree ("paciente_id","tipo");--> statement-breakpoint
CREATE INDEX "pacientes_docs_proc_idx" ON "pacientes_documentos" USING btree ("procedimento_realizado_id");--> statement-breakpoint
CREATE INDEX "pacientes_fotos_paciente_idx" ON "pacientes_fotos" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "pacientes_fotos_tipo_idx" ON "pacientes_fotos" USING btree ("paciente_id","tipo");--> statement-breakpoint
CREATE INDEX "pacientes_fotos_data_idx" ON "pacientes_fotos" USING btree ("data_captura");--> statement-breakpoint
CREATE INDEX "pacientes_fotos_grupo_idx" ON "pacientes_fotos" USING btree ("grupo_id");--> statement-breakpoint
CREATE INDEX "pacientes_fotos_proc_idx" ON "pacientes_fotos" USING btree ("procedimento_realizado_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pacientes_info_medica_paciente_idx" ON "pacientes_info_medica" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "pacientes_proc_paciente_idx" ON "pacientes_procedimentos" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "pacientes_proc_data_idx" ON "pacientes_procedimentos" USING btree ("data_realizacao");--> statement-breakpoint
CREATE INDEX "pacientes_proc_paciente_data_idx" ON "pacientes_procedimentos" USING btree ("paciente_id","data_realizacao");--> statement-breakpoint
CREATE INDEX "planos_tratamento_paciente_idx" ON "planos_tratamento" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "planos_tratamento_mentorado_idx" ON "planos_tratamento" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "ai_log_mentorado_idx" ON "ai_content_generation_log" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "ai_log_type_idx" ON "ai_content_generation_log" USING btree ("generation_type");--> statement-breakpoint
CREATE INDEX "ai_log_created_idx" ON "ai_content_generation_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_log_mentorado_month_idx" ON "ai_content_generation_log" USING btree ("mentorado_id","created_at");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_mentorado_idx" ON "marketing_campaigns" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_status_idx" ON "marketing_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_platform_idx" ON "marketing_campaigns" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_dates_idx" ON "marketing_campaigns" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "marketing_posts_campaign_idx" ON "marketing_posts" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "marketing_posts_mentorado_idx" ON "marketing_posts" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "marketing_posts_status_idx" ON "marketing_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "marketing_posts_scheduled_idx" ON "marketing_posts" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "marketing_posts_order_idx" ON "marketing_posts" USING btree ("campaign_id","order");--> statement-breakpoint
CREATE INDEX "marketing_templates_mentorado_idx" ON "marketing_templates" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "marketing_templates_category_idx" ON "marketing_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "marketing_templates_platform_idx" ON "marketing_templates" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "marketing_templates_public_idx" ON "marketing_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "wc_messages_campaign_idx" ON "whatsapp_campaign_messages" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "wc_messages_lead_idx" ON "whatsapp_campaign_messages" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "wc_messages_status_idx" ON "whatsapp_campaign_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wc_messages_phone_idx" ON "whatsapp_campaign_messages" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "whatsapp_campaigns_mentorado_idx" ON "whatsapp_campaigns" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "whatsapp_campaigns_status_idx" ON "whatsapp_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsapp_campaigns_scheduled_idx" ON "whatsapp_campaigns" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "whatsapp_campaigns_marketing_idx" ON "whatsapp_campaigns" USING btree ("marketing_campaign_id");--> statement-breakpoint
ALTER TABLE "atividade_progress" ADD CONSTRAINT "atividade_progress_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;