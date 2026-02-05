CREATE TYPE "public"."action_item_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."tipo_transacao" AS ENUM('receita', 'despesa');--> statement-breakpoint
ALTER TYPE "public"."categoria" ADD VALUE 'ranking';--> statement-breakpoint
CREATE TABLE "categorias_financeiras" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"tipo" "tipo_transacao" NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formas_pagamento" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"nome" varchar(100) NOT NULL,
	"taxa_percentual" integer DEFAULT 0,
	"prazo_recebimento_dias" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insumos" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"nome" varchar(255) NOT NULL,
	"valor_compra" integer NOT NULL,
	"rendimento" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_action_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"description" text NOT NULL,
	"status" "action_item_status" DEFAULT 'pending' NOT NULL,
	"due_date" date,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" integer NOT NULL,
	"mentorado_id" integer NOT NULL,
	"session_date" timestamp DEFAULT now() NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"reminder_days" text DEFAULT '[1,3,6,11]' NOT NULL,
	"metrics_reminders_enabled" "sim_nao" DEFAULT 'sim' NOT NULL,
	"badge_notifications_enabled" "sim_nao" DEFAULT 'sim' NOT NULL,
	"ranking_notifications_enabled" "sim_nao" DEFAULT 'sim' NOT NULL,
	"email_templates" text,
	"in_app_templates" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "procedimento_insumos" (
	"id" serial PRIMARY KEY NOT NULL,
	"procedimento_id" integer NOT NULL,
	"insumo_id" integer NOT NULL,
	"quantidade" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "procedimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"nome" varchar(255) NOT NULL,
	"preco_venda" integer NOT NULL,
	"custo_operacional" integer DEFAULT 0,
	"custo_investimento" integer DEFAULT 0,
	"percentual_parceiro" integer DEFAULT 0,
	"percentual_imposto" integer DEFAULT 700,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"data" date NOT NULL,
	"tipo" "tipo_transacao" NOT NULL,
	"categoria_id" integer,
	"descricao" text NOT NULL,
	"nome_cliente_fornecedor" varchar(255),
	"forma_pagamento_id" integer,
	"valor" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_plan_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"mentorado_id" integer NOT NULL,
	"step_index" integer NOT NULL,
	"completed" "sim_nao" DEFAULT 'nao' NOT NULL,
	"notes" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"semana" integer NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"conteudo" text NOT NULL,
	"ativo" "sim_nao" DEFAULT 'sim' NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"phone" varchar(20) NOT NULL,
	"name" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metricas_mensais" ADD COLUMN "meta_faturamento" integer;--> statement-breakpoint
ALTER TABLE "metricas_mensais" ADD COLUMN "meta_leads" integer;--> statement-breakpoint
ALTER TABLE "metricas_mensais" ADD COLUMN "meta_procedimentos" integer;--> statement-breakpoint
ALTER TABLE "metricas_mensais" ADD COLUMN "meta_posts" integer;--> statement-breakpoint
ALTER TABLE "metricas_mensais" ADD COLUMN "meta_stories" integer;--> statement-breakpoint
ALTER TABLE "categorias_financeiras" ADD CONSTRAINT "categorias_financeiras_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formas_pagamento" ADD CONSTRAINT "formas_pagamento_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_action_items" ADD CONSTRAINT "mentorship_action_items_session_id_mentorship_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentorship_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedimento_insumos" ADD CONSTRAINT "procedimento_insumos_procedimento_id_procedimentos_id_fk" FOREIGN KEY ("procedimento_id") REFERENCES "public"."procedimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedimento_insumos" ADD CONSTRAINT "procedimento_insumos_insumo_id_insumos_id_fk" FOREIGN KEY ("insumo_id") REFERENCES "public"."insumos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedimentos" ADD CONSTRAINT "procedimentos_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_categoria_id_categorias_financeiras_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_financeiras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_forma_pagamento_id_formas_pagamento_id_fk" FOREIGN KEY ("forma_pagamento_id") REFERENCES "public"."formas_pagamento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_plan_progress" ADD CONSTRAINT "weekly_plan_progress_plan_id_weekly_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."weekly_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_plan_progress" ADD CONSTRAINT "weekly_plan_progress_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_plans" ADD CONSTRAINT "weekly_plans_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_plans" ADD CONSTRAINT "weekly_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categorias_fin_mentorado_idx" ON "categorias_financeiras" USING btree ("mentorado_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categorias_fin_unique_idx" ON "categorias_financeiras" USING btree ("mentorado_id","tipo","nome");--> statement-breakpoint
CREATE INDEX "formas_pag_mentorado_idx" ON "formas_pagamento" USING btree ("mentorado_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formas_pag_unique_idx" ON "formas_pagamento" USING btree ("mentorado_id","nome");--> statement-breakpoint
CREATE INDEX "insumos_mentorado_idx" ON "insumos" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "mentorship_action_items_session_idx" ON "mentorship_action_items" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "mentorship_action_items_status_idx" ON "mentorship_action_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mentorship_sessions_mentor_idx" ON "mentorship_sessions" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "mentorship_sessions_mentorado_idx" ON "mentorship_sessions" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "mentorship_sessions_date_idx" ON "mentorship_sessions" USING btree ("session_date");--> statement-breakpoint
CREATE UNIQUE INDEX "proc_insumo_unique_idx" ON "procedimento_insumos" USING btree ("procedimento_id","insumo_id");--> statement-breakpoint
CREATE INDEX "proc_insumo_proc_idx" ON "procedimento_insumos" USING btree ("procedimento_id");--> statement-breakpoint
CREATE INDEX "proc_insumo_insumo_idx" ON "procedimento_insumos" USING btree ("insumo_id");--> statement-breakpoint
CREATE INDEX "procedimentos_mentorado_idx" ON "procedimentos" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "transacoes_mentorado_idx" ON "transacoes" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "transacoes_data_idx" ON "transacoes" USING btree ("data");--> statement-breakpoint
CREATE INDEX "transacoes_mentorado_data_idx" ON "transacoes" USING btree ("mentorado_id","data");--> statement-breakpoint
CREATE INDEX "transacoes_categoria_idx" ON "transacoes" USING btree ("categoria_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_progress_unique_idx" ON "weekly_plan_progress" USING btree ("plan_id","mentorado_id","step_index");--> statement-breakpoint
CREATE INDEX "weekly_progress_plan_idx" ON "weekly_plan_progress" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "weekly_progress_mentorado_idx" ON "weekly_plan_progress" USING btree ("mentorado_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_plans_mentorado_semana_idx" ON "weekly_plans" USING btree ("mentorado_id","ano","mes","semana");--> statement-breakpoint
CREATE INDEX "weekly_plans_mentorado_idx" ON "weekly_plans" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "weekly_plans_ativo_idx" ON "weekly_plans" USING btree ("mentorado_id","ativo");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_contacts_phone_mentorado_idx" ON "whatsapp_contacts" USING btree ("mentorado_id","phone");--> statement-breakpoint
CREATE INDEX "whatsapp_contacts_mentorado_idx" ON "whatsapp_contacts" USING btree ("mentorado_id");