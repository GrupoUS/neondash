/**
 * Baileys tRPC Router
 * Self-hosted WhatsApp connection using Baileys library
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { leads, mentorados, whatsappContacts, whatsappMessages } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { baileysService } from "./services/baileysService";

/**
 * Get mentorado for current user
 */
async function getMentorado(userId: number) {
  const db = getDb();
  const [mentorado] = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.userId, userId))
    .limit(1);

  return mentorado ?? null;
}

export const baileysRouter = router({
  /**
   * Get current WhatsApp connection status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentorado(ctx.user.id);
    if (!mentorado) {
      return { configured: false, connected: false, connecting: false, phone: null };
    }

    const status = baileysService.getConnectionStatus(mentorado.id);

    // Update connection status in DB if connected
    if (status.connected && status.phone) {
      const db = getDb();
      await db
        .update(mentorados)
        .set({
          baileysConnected: "sim",
          baileysPhone: status.phone,
          baileysConnectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mentorados.id, mentorado.id));
    }

    return {
      configured: status.configured,
      connected: status.connected,
      connecting: status.connecting,
      phone: status.phone,
    };
  }),

  /**
   * Start connection and get QR code
   */
  getQRCode: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentorado(ctx.user.id);
    if (!mentorado) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Mentorado não encontrado",
      });
    }

    const result = await baileysService.getQRCode(mentorado.id);

    return {
      qrCode: result.qrCode,
      connected: result.connected,
    };
  }),

  /**
   * Disconnect WhatsApp session
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const mentorado = await getMentorado(ctx.user.id);
    if (!mentorado) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Mentorado não encontrado",
      });
    }

    await baileysService.disconnect(mentorado.id);

    // Update database
    const db = getDb();
    await db
      .update(mentorados)
      .set({
        baileysConnected: "nao",
        baileysPhone: null,
        updatedAt: new Date(),
      })
      .where(eq(mentorados.id, mentorado.id));

    return { success: true };
  }),

  /**
   * Send a WhatsApp message
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(8, "Telefone inválido"),
        message: z.string().min(1, "Mensagem não pode ser vazia"),
        leadId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mentorado = await getMentorado(ctx.user.id);
      if (!mentorado) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mentorado não encontrado",
        });
      }

      // Send message via Baileys
      const result = await baileysService.sendTextMessage(mentorado.id, input.phone, input.message);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Erro ao enviar mensagem",
        });
      }

      // Store message in DB
      const db = getDb();
      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId: mentorado.id,
          leadId: input.leadId ?? null,
          phone: baileysService.normalizePhoneNumber(input.phone),
          direction: "outbound",
          content: input.message,
          zapiMessageId: result.messageId ?? null, // Reusing existing column for Baileys message ID
          status: "sent",
          isFromAi: "nao",
        })
        .returning();

      return {
        success: true,
        messageId: savedMessage?.id,
        externalMessageId: result.messageId,
      };
    }),

  /**
   * Send media message (image/video/document)
   */
  sendMedia: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(8),
        mediaUrl: z.string().url(),
        mediaType: z.enum(["image", "video", "document"]),
        caption: z.string().optional(),
        fileName: z.string().optional(),
        leadId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mentorado = await getMentorado(ctx.user.id);
      if (!mentorado) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mentorado não encontrado",
        });
      }

      const result = await baileysService.sendMediaMessage(
        mentorado.id,
        input.phone,
        input.mediaUrl,
        input.mediaType,
        input.caption,
        input.fileName
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Erro ao enviar mídia",
        });
      }

      // Store message in DB (note: mediaUrl/mediaType stored in content for now)
      const db = getDb();
      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId: mentorado.id,
          leadId: input.leadId ?? null,
          phone: baileysService.normalizePhoneNumber(input.phone),
          direction: "outbound",
          content: input.caption ?? `[${input.mediaType}: ${input.mediaUrl}]`,
          zapiMessageId: result.messageId ?? null,
          status: "sent",
          isFromAi: "nao",
        })
        .returning();

      return {
        success: true,
        messageId: savedMessage?.id,
      };
    }),

  /**
   * Get message history for a phone number
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const mentorado = await getMentorado(ctx.user.id);
      if (!mentorado) {
        return [];
      }

      const db = getDb();
      const normalizedPhone = baileysService.normalizePhoneNumber(input.phone);

      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(
          and(
            eq(whatsappMessages.mentoradoId, mentorado.id),
            eq(whatsappMessages.phone, normalizedPhone)
          )
        )
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(input.limit);

      return messages.reverse(); // Chronological order
    }),

  /**
   * Get all conversations (inbox)
   */
  getAllConversations: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentorado(ctx.user.id);
    if (!mentorado) {
      return [];
    }

    const db = getDb();

    // Get all leads for name matching
    const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentorado.id));

    // Get saved contacts
    const savedContacts = await db
      .select()
      .from(whatsappContacts)
      .where(eq(whatsappContacts.mentoradoId, mentorado.id));

    // Get all messages
    const allMessages = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.mentoradoId, mentorado.id))
      .orderBy(desc(whatsappMessages.createdAt));

    // Group by phone
    const conversationMap = new Map<
      string,
      {
        phone: string;
        name: string | null;
        leadId: number | null;
        lastMessage: string | null;
        lastMessageAt: Date | string | null;
        unreadCount: number;
      }
    >();

    for (const msg of allMessages) {
      const normalizedPhone = baileysService.normalizePhoneNumber(msg.phone);

      if (!conversationMap.has(normalizedPhone)) {
        conversationMap.set(normalizedPhone, {
          phone: msg.phone,
          name: null,
          leadId: msg.leadId,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }

      const conv = conversationMap.get(normalizedPhone)!;
      if (msg.direction === "inbound") {
        conv.unreadCount += 1;
      }
      if (!conv.leadId && msg.leadId) {
        conv.leadId = msg.leadId;
      }
    }

    // Enrich with names
    for (const [normalizedPhone, conv] of conversationMap.entries()) {
      // Check saved contacts first
      const savedContact = savedContacts.find((c) =>
        baileysService.phonesMatch(c.phone, normalizedPhone)
      );
      if (savedContact?.name) {
        conv.name = savedContact.name;
        continue;
      }

      // Check leads
      const matchedLead = allLeads.find(
        (lead) => lead.telefone && baileysService.phonesMatch(lead.telefone, normalizedPhone)
      );
      if (matchedLead) {
        conv.leadId = matchedLead.id;
        conv.name = matchedLead.nome;
      }
    }

    return Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }),

  /**
   * Link orphan messages to leads
   */
  linkContacts: protectedProcedure.mutation(async ({ ctx }) => {
    const mentorado = await getMentorado(ctx.user.id);
    if (!mentorado) {
      return { success: false, linkedCount: 0 };
    }

    const db = getDb();

    // Get orphan messages
    const orphanMessages = await db
      .select()
      .from(whatsappMessages)
      .where(and(eq(whatsappMessages.mentoradoId, mentorado.id), isNull(whatsappMessages.leadId)));

    // Get all leads
    const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentorado.id));

    let linkedCount = 0;

    for (const msg of orphanMessages) {
      const matchedLead = allLeads.find(
        (lead) => lead.telefone && baileysService.phonesMatch(lead.telefone, msg.phone)
      );

      if (matchedLead) {
        await db
          .update(whatsappMessages)
          .set({ leadId: matchedLead.id })
          .where(eq(whatsappMessages.id, msg.id));
        linkedCount++;
      }
    }

    return { success: true, linkedCount };
  }),
});
