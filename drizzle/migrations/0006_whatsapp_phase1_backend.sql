ALTER TABLE "whatsapp_messages"
  ADD COLUMN IF NOT EXISTS "media_type" varchar(50),
  ADD COLUMN IF NOT EXISTS "media_url" text,
  ADD COLUMN IF NOT EXISTS "media_thumbnail" text,
  ADD COLUMN IF NOT EXISTS "media_size" integer,
  ADD COLUMN IF NOT EXISTS "quoted_message_id" integer,
  ADD COLUMN IF NOT EXISTS "read_at" timestamp;

CREATE INDEX IF NOT EXISTS "whatsapp_messages_zapi_message_idx"
  ON "whatsapp_messages" ("zapi_message_id");

ALTER TABLE "whatsapp_contacts"
  ADD COLUMN IF NOT EXISTS "profile_pic_url" text,
  ADD COLUMN IF NOT EXISTS "last_seen" timestamp,
  ADD COLUMN IF NOT EXISTS "is_online" "sim_nao" DEFAULT 'nao' NOT NULL,
  ADD COLUMN IF NOT EXISTS "synced_at" timestamp;

CREATE INDEX IF NOT EXISTS "whatsapp_contacts_phone_idx"
  ON "whatsapp_contacts" ("phone");

CREATE INDEX IF NOT EXISTS "whatsapp_contacts_last_seen_idx"
  ON "whatsapp_contacts" ("last_seen");

CREATE INDEX IF NOT EXISTS "whatsapp_contacts_synced_idx"
  ON "whatsapp_contacts" ("synced_at");

CREATE TABLE IF NOT EXISTS "whatsapp_reactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "message_id" integer NOT NULL REFERENCES "whatsapp_messages"("id") ON DELETE cascade,
  "mentorado_id" integer NOT NULL REFERENCES "mentorados"("id") ON DELETE cascade,
  "phone" varchar(20) NOT NULL,
  "emoji" varchar(32) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "whatsapp_reactions_message_idx"
  ON "whatsapp_reactions" ("message_id");

CREATE INDEX IF NOT EXISTS "whatsapp_reactions_phone_idx"
  ON "whatsapp_reactions" ("phone");

CREATE INDEX IF NOT EXISTS "whatsapp_reactions_created_idx"
  ON "whatsapp_reactions" ("created_at");

CREATE INDEX IF NOT EXISTS "whatsapp_reactions_mentorado_idx"
  ON "whatsapp_reactions" ("mentorado_id");
