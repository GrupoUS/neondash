CREATE TYPE "public"."zapi_instance_status" AS ENUM('trial', 'active', 'suspended', 'canceled');--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diagnosticos" ADD COLUMN "capacidade_investimento" text;--> statement-breakpoint
ALTER TABLE "diagnosticos" ADD COLUMN "tentativas_anteriores" text;--> statement-breakpoint
ALTER TABLE "diagnosticos" ADD COLUMN "visao_um_ano" text;--> statement-breakpoint
ALTER TABLE "diagnosticos" ADD COLUMN "porque_agora" text;--> statement-breakpoint
ALTER TABLE "diagnosticos" ADD COLUMN "horas_disponiveis" text;--> statement-breakpoint
ALTER TABLE "diagnosticos" ADD COLUMN "nivel_prioridade" text;--> statement-breakpoint
ALTER TABLE "diagnosticos" ADD COLUMN "rede_apoio" text;--> statement-breakpoint
ALTER TABLE "instagram_tokens" ADD COLUMN "instagram_username" varchar(100);--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_instance_status" "zapi_instance_status";--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_instance_due_date" timestamp;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_instance_created_at" timestamp;--> statement-breakpoint
ALTER TABLE "mentorados" ADD COLUMN "zapi_managed_by_integrator" "sim_nao" DEFAULT 'nao';--> statement-breakpoint
CREATE UNIQUE INDEX "mentorados_user_id_unique_idx" ON "mentorados" USING btree ("user_id");