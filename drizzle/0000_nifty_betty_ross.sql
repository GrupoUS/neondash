CREATE TYPE "public"."ativo" AS ENUM('sim', 'nao');--> statement-breakpoint
CREATE TYPE "public"."categoria" AS ENUM('faturamento', 'conteudo', 'operacional', 'consistencia', 'especial');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."sim_nao" AS ENUM('sim', 'nao');--> statement-breakpoint
CREATE TYPE "public"."tipo_meta" AS ENUM('faturamento', 'leads', 'procedimentos', 'posts', 'stories');--> statement-breakpoint
CREATE TYPE "public"."tipo_notificacao" AS ENUM('lembrete_metricas', 'alerta_meta', 'conquista', 'ranking');--> statement-breakpoint
CREATE TYPE "public"."turma" AS ENUM('neon_estrutura', 'neon_escala');--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text NOT NULL,
	"icone" varchar(50) NOT NULL,
	"cor" varchar(20) DEFAULT 'gold' NOT NULL,
	"categoria" "categoria" NOT NULL,
	"criterio" text NOT NULL,
	"pontos" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "badges_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL,
	"analise_mes" text NOT NULL,
	"foco_proximo_mes" text NOT NULL,
	"sugestao_mentor" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorado_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"badge_id" integer NOT NULL,
	"conquistado_em" timestamp DEFAULT now() NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorados" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"nome_completo" varchar(255) NOT NULL,
	"email" varchar(320),
	"foto_url" varchar(500),
	"turma" "turma" NOT NULL,
	"meta_faturamento" integer DEFAULT 16000 NOT NULL,
	"meta_leads" integer DEFAULT 50,
	"meta_procedimentos" integer DEFAULT 10,
	"meta_posts" integer DEFAULT 12,
	"meta_stories" integer DEFAULT 60,
	"ativo" "ativo" DEFAULT 'sim' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metas_progressivas" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"tipo" "tipo_meta" NOT NULL,
	"meta_atual" integer NOT NULL,
	"meta_inicial" integer NOT NULL,
	"incremento" integer DEFAULT 10 NOT NULL,
	"vezes_atingida" integer DEFAULT 0 NOT NULL,
	"ultima_atualizacao" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metricas_mensais" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL,
	"faturamento" integer DEFAULT 0 NOT NULL,
	"lucro" integer DEFAULT 0 NOT NULL,
	"posts_feed" integer DEFAULT 0 NOT NULL,
	"stories" integer DEFAULT 0 NOT NULL,
	"leads" integer DEFAULT 0 NOT NULL,
	"procedimentos" integer DEFAULT 0 NOT NULL,
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"tipo" "tipo_notificacao" NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"mensagem" text NOT NULL,
	"lida" "sim_nao" DEFAULT 'nao' NOT NULL,
	"enviada_por_email" "sim_nao" DEFAULT 'nao' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranking_mensal" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorado_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL,
	"turma" "turma" NOT NULL,
	"posicao" integer NOT NULL,
	"pontuacao_total" integer DEFAULT 0 NOT NULL,
	"pontos_bonus" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"image_url" text,
	"login_method" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorado_badges" ADD CONSTRAINT "mentorado_badges_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorado_badges" ADD CONSTRAINT "mentorado_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorados" ADD CONSTRAINT "mentorados_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metas_progressivas" ADD CONSTRAINT "metas_progressivas_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metricas_mensais" ADD CONSTRAINT "metricas_mensais_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_mensal" ADD CONSTRAINT "ranking_mensal_mentorado_id_mentorados_id_fk" FOREIGN KEY ("mentorado_id") REFERENCES "public"."mentorados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "badges_codigo_idx" ON "badges" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "badges_categoria_idx" ON "badges" USING btree ("categoria");--> statement-breakpoint
CREATE UNIQUE INDEX "feedbacks_mentorado_periodo_idx" ON "feedbacks" USING btree ("mentorado_id","ano","mes");--> statement-breakpoint
CREATE INDEX "mentorado_badges_mentorado_idx" ON "mentorado_badges" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "mentorado_badges_badge_idx" ON "mentorado_badges" USING btree ("badge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentorado_badges_unique_idx" ON "mentorado_badges" USING btree ("mentorado_id","badge_id","ano","mes");--> statement-breakpoint
CREATE INDEX "mentorados_user_id_idx" ON "mentorados" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mentorados_email_idx" ON "mentorados" USING btree ("email");--> statement-breakpoint
CREATE INDEX "mentorados_turma_idx" ON "mentorados" USING btree ("turma");--> statement-breakpoint
CREATE INDEX "mentorados_turma_ativo_idx" ON "mentorados" USING btree ("turma","ativo");--> statement-breakpoint
CREATE UNIQUE INDEX "metas_mentorado_tipo_idx" ON "metas_progressivas" USING btree ("mentorado_id","tipo");--> statement-breakpoint
CREATE INDEX "metricas_mentorado_idx" ON "metricas_mensais" USING btree ("mentorado_id");--> statement-breakpoint
CREATE UNIQUE INDEX "metricas_mentorado_periodo_idx" ON "metricas_mensais" USING btree ("mentorado_id","ano","mes");--> statement-breakpoint
CREATE INDEX "metricas_periodo_idx" ON "metricas_mensais" USING btree ("ano","mes");--> statement-breakpoint
CREATE INDEX "notificacoes_mentorado_idx" ON "notificacoes" USING btree ("mentorado_id");--> statement-breakpoint
CREATE INDEX "notificacoes_mentorado_lida_idx" ON "notificacoes" USING btree ("mentorado_id","lida");--> statement-breakpoint
CREATE INDEX "notificacoes_created_idx" ON "notificacoes" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_mentorado_periodo_idx" ON "ranking_mensal" USING btree ("mentorado_id","ano","mes");--> statement-breakpoint
CREATE INDEX "ranking_turma_periodo_idx" ON "ranking_mensal" USING btree ("turma","ano","mes");--> statement-breakpoint
CREATE INDEX "ranking_posicao_idx" ON "ranking_mensal" USING btree ("turma","ano","mes","posicao");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");