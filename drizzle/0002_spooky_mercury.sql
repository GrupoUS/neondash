CREATE TYPE "public"."message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."prioridade_task" AS ENUM('alta', 'media', 'baixa');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('success', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."temperatura_lead" AS ENUM('frio', 'morno', 'quente');--> statement-breakpoint
CREATE TABLE "ai_agent_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"enabled" "sim_nao" DEFAULT 'nao' NOT NULL,
	"system_prompt" text,
	"greeting_message" text,
	"qualification_questions" text,
	"working_hours_start" varchar(5) DEFAULT '09:00',
	"working_hours_end" varchar(5) DEFAULT '18:00',
	"working_days" varchar(20) DEFAULT '1,2,3,4,5',
	"response_delay_ms" integer DEFAULT 3000,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"data_call" timestamp NOT NULL,
	"principais_insights" text NOT NULL,
	"acoes_acordadas" text NOT NULL,
	"proximos_passos" text NOT NULL,
	"duracao_minutos" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_column_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"original_id" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"color" varchar(20) NOT NULL,
	"visible" "sim_nao" DEFAULT 'sim' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp NOT NULL,
	"scope" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL,
	"posts_count" integer DEFAULT 0 NOT NULL,
	"stories_count" integer DEFAULT 0 NOT NULL,
	"sync_status" "sync_status" NOT NULL,
	"error_message" text,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp NOT NULL,
	"scope" text NOT NULL,
	"instagram_business_account_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_tokens_mentorado_id_unique" UNIQUE("mentorado_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"lead_id" integer,
	"phone" varchar(20) NOT NULL,
	"direction" "message_direction" NOT NULL,
	"content" text NOT NULL,
	"zapi_message_id" varchar(128),
	"status" "message_status" DEFAULT 'pending' NOT NULL,
	"is_from_ai" "sim_nao" DEFAULT 'nao',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interacoes" ALTER COLUMN "lead_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnosticos" ADD COLUMN "organizacao" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "indicado_por" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "profissao" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "produto_interesse" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "possui_clinica" "sim_nao";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "anos_estetica" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "faturamento_mensal" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "dor_principal" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "desejo_principal" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "temperatura" "temperatura_lead";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "data_nascimento" date;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "genero" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "procedimentos_interesse" text[];--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "historico_estetico" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "alergias" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "tipo_pele" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "disponibilidade" text;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "onboarding_completed" "sim_nao" DEFAULT 'nao' NOT NULL;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_instance_id" varchar(128);--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_token" text;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_client_token" text;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_connected" "sim_nao" DEFAULT 'nao';--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_connected_at" timestamp;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "instagram_connected" "sim_nao" DEFAULT 'nao';--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "instagram_business_account_id" varchar(100);--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "last_metrics_reminder" timestamp;--> statement-breakpoint
ALTER TABLE "metricas_mensais" ADD COLUMN "instagram_synced" "sim_nao" DEFAULT 'nao';--> statement-breakpoint
ALTER TABLE "metricas_mensais" ADD COLUMN "instagram_sync_date" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" "prioridade_task" DEFAULT 'media' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_agent_config" ADD CONSTRAINT "ai_agent_config_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_notes" ADD CONSTRAINT "call_notes_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_column_config" ADD CONSTRAINT "crm_column_config_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_tokens" ADD CONSTRAINT "google_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_sync_log" ADD CONSTRAINT "instagram_sync_log_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_tokens" ADD CONSTRAINT "instagram_tokens_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_agent_config_mentorado_idx" ON "ai_agent_config" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "call_notes_mentorado_idx" ON "call_notes" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "call_notes_data_idx" ON "call_notes" USING btree ("data_call");--> statement-breakpoint
CREATE INDEX "call_notes_mentorado_data_idx" ON "call_notes" USING btree ("mentorado_id","data_call");--> statement-breakpoint
CREATE INDEX "crm_col_config_mentorado_idx" ON "crm_column_config" USING btree ("mentorado_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_col_config_unique_idx" ON "crm_column_config" USING btree ("mentorado_id","original_id");--> statement-breakpoint
CREATE INDEX "crm_col_config_order_idx" ON "crm_column_config" USING btree ("mentorado_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "google_tokens_user_idx" ON "google_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "instagram_sync_mentorado_periodo_idx" ON "instagram_sync_log" USING btree ("mentorado_id","ano","mes");--> statement-breakpoint
CREATE INDEX "instagram_sync_mentorado_idx" ON "instagram_sync_log" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "instagram_sync_periodo_idx" ON "instagram_sync_log" USING btree ("ano","mes");--> statement-breakpoint
CREATE INDEX "instagram_sync_status_idx" ON "instagram_sync_log" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "instagram_sync_date_idx" ON "instagram_sync_log" USING btree ("synced_at");--> statement-breakpoint
CREATE INDEX "instagram_tokens_mentorado_idx" ON "instagram_tokens" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "instagram_tokens_expires_idx" ON "instagram_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_mentorado_idx" ON "whatsapp_messages" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_lead_idx" ON "whatsapp_messages" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_phone_idx" ON "whatsapp_messages" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_created_idx" ON "whatsapp_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tasks_priority_idx" ON "tasks" USING btree ("priority");