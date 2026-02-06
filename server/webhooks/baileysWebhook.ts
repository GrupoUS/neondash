import { and, eq } from "drizzle-orm";
import type { Express } from "express";
import {
  leads,
  mentorados,
  statusLeadEnum,
  whatsappContacts,
  whatsappMessages,
} from "../../drizzle/schema";
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

async function findOrCreateLead(mentoradoId: number, phone: string) {
  const existing = await findLeadByPhone(mentoradoId, phone);
  if (existing) return existing;

  const db = getDb();
  const fallbackStatus = statusLeadEnum.enumValues[0];
  const targetStatus = statusLeadEnum.enumValues.includes("primeiro_contato")
    ? "primeiro_contato"
    : fallbackStatus;

  const [created] = await db
    .insert(leads)
    .values({
      mentoradoId,
      nome: `Novo Contato WhatsApp ${phone.slice(-4)}`,
      email: `${phone}@whatsapp.local`,
      telefone: phone,
      origem: "whatsapp",
      status: targetStatus,
    })
    .returning();

  return created ?? null;
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
        // Successfully connected - persist to database
        await db
          .update(mentorados)
          .set({
            baileysConnected: "sim",
            baileysConnectedAt: new Date(),
            baileysPhone: phone ?? null,
            updatedAt: new Date(),
          })
          .where(eq(mentorados.id, mentoradoId));
      } else if (status === "disconnected") {
        // Only clear connection when EXPLICITLY disconnected, not during "connecting" state
        // This prevents the connection from being marked as disconnected during normal reconnection cycles
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
      // Note: "connecting" status is intentionally ignored to preserve existing connection state

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
      const lead = await findOrCreateLead(mentoradoId, normalizedPhone);

      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId,
          leadId: lead?.id ?? null,
          phone: normalizedPhone,
          direction: "inbound",
          content,
          // Keep provider-specific IDs out of Z-API-specific semantics to avoid cross-provider collisions.
          zapiMessageId: null,
          status: "delivered",
          isFromAi: "nao",
        })
        .returning();

      sseService.broadcastToPhone(mentoradoId, normalizedPhone, "new-message", {
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

  baileysSessionManager.on(
    "connection.update",
    ({ mentoradoId, connected, phone }: BaileysConnectionEventPayload) => {
      if (!phone) return;
      const normalizedPhone = baileysService.normalizePhone(phone);
      const eventName = connected ? "contact-online" : "contact-offline";
      sseService.broadcastToPhone(mentoradoId, normalizedPhone, eventName, {
        phone: normalizedPhone,
        isOnline: connected,
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
