import type { proto } from "@whiskeysockets/baileys";
import { and, eq } from "drizzle-orm";
import type { Express } from "express";
import { leads, mentorados, whatsappMessages } from "../../drizzle/schema";
import { getDb } from "../db";
import { baileysService } from "../services/baileysService";
import { sseService } from "../services/sseService";

export function registerBaileysWebhooks(app: Express) {
  // We don't need app here strictly if we only listen to internal events,
  // but we might want to expose a webhook endpoint later if needed.
  // For now, we just register the event listeners.

  baileysService.on("qr", ({ mentoradoId, qr }) => {
    sseService.broadcast(mentoradoId, "connection_update", {
      status: "connecting",
      qr,
    });
  });

  baileysService.on("connection.update", async ({ mentoradoId, status, phone }) => {
    const db = getDb();
    if (status === "connected") {
      await db
        .update(mentorados)
        .set({
          baileysConnected: "sim",
          baileysConnectedAt: new Date(),
          baileysPhone: phone,
          updatedAt: new Date(),
        })
        .where(eq(mentorados.id, mentoradoId));

      sseService.broadcast(mentoradoId, "connection_update", {
        status: "connected",
        phone,
      });
    } else {
      // handle disconnect if needed, though usually initiated by user or handled in service logout
      sseService.broadcast(mentoradoId, "connection_update", {
        status: "disconnected",
      });
    }
  });

  baileysService.on(
    "message",
    async ({ mentoradoId, message }: { mentoradoId: number; message: proto.IWebMessageInfo }) => {
      const db = getDb();
      const content =
        message.message?.conversation || message.message?.extendedTextMessage?.text || "";
      const remoteJid = message.key?.remoteJid;
      if (!remoteJid || !content) return;

      const phone = remoteJid.split("@")[0];

      // Attempt to link to lead
      // We can use a helper or simple query
      // For now simple match
      const [lead] = await db
        .select()
        .from(leads)
        .where(and(eq(leads.mentoradoId, mentoradoId), eq(leads.telefone, phone))) // Matches exact number for now, ideally normalize
        .limit(1);

      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId,
          leadId: lead?.id,
          phone,
          direction: "inbound",
          content,
          status: "delivered", // incoming messages are delivered to us
          isFromAi: "nao",
          createdAt: new Date(), // Baileys timestamp might be better but date is fine
        })
        .returning();

      sseService.broadcast(mentoradoId, "new_message", savedMessage);
    }
  );
}
