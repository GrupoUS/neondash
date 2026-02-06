import { and, eq } from "drizzle-orm";
import type { Express } from "express";
import { leads, mentorados, whatsappContacts, whatsappMessages } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  type BaileysConnectionEventPayload,
  type BaileysContactEventPayload,
  type BaileysMessageEventPayload,
  type BaileysQrEventPayload,
  baileysService,
} from "../services/baileysService";
import { baileysSessionManager } from "../services/baileysSessionManager";
import { sseService } from "../services/sseService";

let listenersRegistered = false;

async function findLeadByPhone(mentoradoId: number, phone: string) {
  const db = getDb();
  const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentoradoId));

  return (
    allLeads.find((lead) => {
      if (!lead.telefone) return false;
      return baileysService.normalizePhone(lead.telefone) === baileysService.normalizePhone(phone);
    }) ?? null
  );
}

export function registerBaileysWebhooks(app: Express) {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  void app;

  void baileysSessionManager.restorePersistedSessions();

  baileysSessionManager.on(
    "qr",
    ({ mentoradoId, qr, status, connected }: BaileysQrEventPayload) => {
      sseService.broadcast(mentoradoId, "status_update", {
        status,
        connected,
        qr,
        provider: "baileys",
      });
    }
  );

  baileysSessionManager.on(
    "connection.update",
    async ({ mentoradoId, status, phone, connected }: BaileysConnectionEventPayload) => {
      const db = getDb();

      if (status === "connected") {
        await db
          .update(mentorados)
          .set({
            baileysConnected: "sim",
            baileysConnectedAt: new Date(),
            baileysPhone: phone ?? null,
            updatedAt: new Date(),
          })
          .where(eq(mentorados.id, mentoradoId));
      } else {
        await db
          .update(mentorados)
          .set({
            baileysConnected: "nao",
            baileysPhone: null,
            baileysConnectedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(mentorados.id, mentoradoId));
      }

      sseService.broadcast(mentoradoId, "status_update", {
        status,
        connected,
        phone,
        provider: "baileys",
      });
    }
  );

  baileysSessionManager.on(
    "message",
    async ({ mentoradoId, phone, content, message }: BaileysMessageEventPayload) => {
      if (!content) {
        return;
      }

      const db = getDb();
      const normalizedPhone = baileysService.normalizePhone(phone);
      const lead = await findLeadByPhone(mentoradoId, normalizedPhone);

      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId,
          leadId: lead?.id ?? null,
          phone: normalizedPhone,
          direction: "inbound",
          content,
          zapiMessageId: message.key?.id ?? null,
          status: "delivered",
          isFromAi: "nao",
        })
        .returning();

      sseService.broadcast(mentoradoId, "message", {
        id: savedMessage?.id,
        phone: normalizedPhone,
        leadId: lead?.id ?? null,
        direction: "inbound",
        content,
        status: "delivered",
        provider: "baileys",
        createdAt: savedMessage?.createdAt ?? new Date().toISOString(),
      });
    }
  );

  // Handle contact name updates from Baileys
  baileysSessionManager.on(
    "contacts",
    async ({ mentoradoId, contacts }: BaileysContactEventPayload) => {
      if (contacts.length === 0) return;

      const db = getDb();

      for (const contact of contacts) {
        if (!contact.name) continue;

        // Upsert contact - insert if not exists, update name if exists
        const existingContact = await db
          .select()
          .from(whatsappContacts)
          .where(
            and(
              eq(whatsappContacts.mentoradoId, mentoradoId),
              eq(whatsappContacts.phone, contact.phone)
            )
          )
          .limit(1);

        if (existingContact.length > 0) {
          await db
            .update(whatsappContacts)
            .set({ name: contact.name, updatedAt: new Date() })
            .where(eq(whatsappContacts.id, existingContact[0].id));
        } else {
          await db.insert(whatsappContacts).values({
            mentoradoId,
            phone: contact.phone,
            name: contact.name,
          });
        }
      }
    }
  );
}
