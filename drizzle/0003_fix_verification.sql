CREATE TABLE IF NOT EXISTS "system_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instagram_tokens" ADD COLUMN IF NOT EXISTS "instagram_username" varchar(100);
