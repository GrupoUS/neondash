import { integer, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { mentorados } from "./schema";

/**
 * Baileys Sessions - Persistent storage for WhatsApp sessions
 */
export const baileysSessions = pgTable(
  "baileys_sessions",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 255 }).notNull(),
    value: text("value").notNull(), // JSON stringified value
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("baileys_sessions_key_idx").on(table.mentoradoId, table.key),
  ]
);

export type BaileysSession = typeof baileysSessions.$inferSelect;
export type InsertBaileysSession = typeof baileysSessions.$inferInsert;
