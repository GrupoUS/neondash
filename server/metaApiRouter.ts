/**
 * Meta WhatsApp Cloud API tRPC Router
 * Handles WhatsApp Business connection management and messaging via Meta API
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/
 */
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { leads, mentorados, whatsappContacts, whatsappMessages } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { encrypt, safeDecrypt } from "./services/crypto";
import {
  type MetaApiCredentials,
  metaApiService,
  normalizePhoneNumber,
} from "./services/metaApiService";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get mentorado with Meta API credentials
 */
async function getMentoradoWithMeta(userId: number) {
  const db = getDb();
  const [mentorado] = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.userId, userId))
    .limit(1);

  return mentorado ?? null;
}

/**
 * Build Meta API credentials from mentorado data
 */
function buildCredentials(mentorado: {
  metaPhoneNumberId: string | null;
  metaAccessToken: string | null;
}): MetaApiCredentials | null {
  if (!mentorado.metaPhoneNumberId || !mentorado.metaAccessToken) {
    return null;
  }

  const decryptedToken = safeDecrypt(mentorado.metaAccessToken);
  if (!decryptedToken) {
    return null;
  }

  return {
    phoneNumberId: mentorado.metaPhoneNumberId,
    accessToken: decryptedToken,
  };
}

/**
 * Link orphan WhatsApp messages to existing CRM leads by matching phone numbers
 */
async function linkOrphanMessages(mentoradoId: number): Promise<number> {
  const db = getDb();

  // Get messages without a leadId
  const orphanMessages = await db
    .select()
    .from(whatsappMessages)
    .where(and(eq(whatsappMessages.mentoradoId, mentoradoId), isNull(whatsappMessages.leadId)));

  if (orphanMessages.length === 0) return 0;

  // Get all leads for this mentorado
  const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentoradoId));

  if (allLeads.length === 0) return 0;

  let linkedCount = 0;

  // Match orphan messages to leads using last 8 digits comparison
  for (const msg of orphanMessages) {
    const normalizedMsgPhone = msg.phone.replace(/\D/g, "");
    const matchedLead = allLeads.find((lead) => {
      if (!lead.telefone) return false;
      const leadPhone = lead.telefone.replace(/\D/g, "");
      return leadPhone.slice(-8) === normalizedMsgPhone.slice(-8);
    });

    if (matchedLead) {
      await db
        .update(whatsappMessages)
        .set({ leadId: matchedLead.id })
        .where(eq(whatsappMessages.id, msg.id));
      linkedCount++;
    }
  }

  return linkedCount;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════

export const metaApiRouter = router({
  /**
   * Get current Meta WhatsApp connection status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentoradoWithMeta(ctx.user.id);
    if (!mentorado) {
      return { configured: false, connected: false };
    }

    const credentials = buildCredentials(mentorado);
    if (!credentials) {
      return { configured: false, connected: false };
    }

    // Verify connection by getting phone number details
    try {
      const phoneDetails = await metaApiService.getPhoneNumberDetails(credentials);

      // Update connection status in DB if not already connected
      if (mentorado.metaConnected !== "sim") {
        const db = getDb();
        await db
          .update(mentorados)
          .set({
            metaConnected: "sim",
            metaConnectedAt: new Date(),
            metaPhoneNumber: phoneDetails.display_phone_number,
            updatedAt: new Date(),
          })
          .where(eq(mentorados.id, mentorado.id));
      }

      return {
        configured: true,
        connected: true,
        phone: phoneDetails.display_phone_number,
        verifiedName: phoneDetails.verified_name,
        qualityRating: phoneDetails.quality_rating,
        wabaId: mentorado.metaWabaId,
      };
    } catch (error) {
      // Token might be expired or invalid
      const db = getDb();
      await db
        .update(mentorados)
        .set({
          metaConnected: "nao",
          updatedAt: new Date(),
        })
        .where(eq(mentorados.id, mentorado.id));

      return {
        configured: true,
        connected: false,
        error: error instanceof Error ? error.message : "Conexão falhou",
      };
    }
  }),

  /**
   * Configure Meta WhatsApp credentials
   * Called after Embedded Signup flow completes
   */
  configure: protectedProcedure
    .input(
      z.object({
        wabaId: z.string().min(1, "WABA ID é obrigatório"),
        phoneNumberId: z.string().min(1, "Phone Number ID é obrigatório"),
        accessToken: z.string().min(1, "Access Token é obrigatório"),
        phoneNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mentorado = await getMentoradoWithMeta(ctx.user.id);
      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      // Encrypt access token before storing
      const encryptedToken = encrypt(input.accessToken);

      const db = getDb();
      await db
        .update(mentorados)
        .set({
          metaWabaId: input.wabaId,
          metaPhoneNumberId: input.phoneNumberId,
          metaAccessToken: encryptedToken,
          metaPhoneNumber: input.phoneNumber ?? null,
          metaConnected: "sim",
          metaConnectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mentorados.id, mentorado.id));

      return { success: true };
    }),

  /**
   * Disconnect Meta WhatsApp integration
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const mentorado = await getMentoradoWithMeta(ctx.user.id);
    if (!mentorado) {
      throw new Error("Mentorado não encontrado");
    }

    const db = getDb();
    await db
      .update(mentorados)
      .set({
        metaWabaId: null,
        metaPhoneNumberId: null,
        metaAccessToken: null,
        metaPhoneNumber: null,
        metaConnected: "nao",
        metaConnectedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(mentorados.id, mentorado.id));

    return { success: true };
  }),

  /**
   * Send a WhatsApp message via Meta API
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
      const mentorado = await getMentoradoWithMeta(ctx.user.id);
      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      const credentials = buildCredentials(mentorado);
      if (!credentials) {
        throw new Error("Meta WhatsApp não configurado");
      }

      // Send message via Meta API
      const response = await metaApiService.sendTextMessage(credentials, {
        to: input.phone,
        message: input.message,
      });

      // Extract message ID from response
      const metaMessageId = response.messages?.[0]?.id;

      // Store message in DB
      const db = getDb();
      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId: mentorado.id,
          leadId: input.leadId ?? null,
          phone: normalizePhoneNumber(input.phone),
          direction: "outbound",
          content: input.message,
          zapiMessageId: metaMessageId ?? null, // Reuse field for Meta message ID
          status: "sent",
          isFromAi: "nao",
        })
        .returning();

      return {
        success: true,
        messageId: savedMessage?.id,
        metaMessageId,
      };
    }),

  /**
   * Send a template message via Meta API
   */
  sendTemplateMessage: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(8, "Telefone inválido"),
        templateName: z.string().min(1, "Nome do template é obrigatório"),
        languageCode: z.string().default("pt_BR"),
        leadId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mentorado = await getMentoradoWithMeta(ctx.user.id);
      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      const credentials = buildCredentials(mentorado);
      if (!credentials) {
        throw new Error("Meta WhatsApp não configurado");
      }

      // Send template message
      const response = await metaApiService.sendTemplateMessage(
        credentials,
        input.phone,
        input.templateName,
        input.languageCode
      );

      const metaMessageId = response.messages?.[0]?.id;

      // Store message in DB
      const db = getDb();
      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId: mentorado.id,
          leadId: input.leadId ?? null,
          phone: normalizePhoneNumber(input.phone),
          direction: "outbound",
          content: `[Template: ${input.templateName}]`,
          zapiMessageId: metaMessageId ?? null,
          status: "sent",
          isFromAi: "nao",
        })
        .returning();

      return {
        success: true,
        messageId: savedMessage?.id,
        metaMessageId,
      };
    }),

  /**
   * Get message history for a lead or phone number
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        leadId: z.number().optional(),
        phone: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const mentorado = await getMentoradoWithMeta(ctx.user.id);
      if (!mentorado) {
        return [];
      }

      // Build query conditions
      const conditions = [eq(whatsappMessages.mentoradoId, mentorado.id)];

      if (input.leadId) {
        conditions.push(eq(whatsappMessages.leadId, input.leadId));
      } else if (input.phone) {
        const normalizedPhone = normalizePhoneNumber(input.phone);
        conditions.push(eq(whatsappMessages.phone, normalizedPhone));
      }

      const db = getDb();
      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(and(...conditions))
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(input.limit);

      return messages.reverse(); // Return in chronological order
    }),

  /**
   * Get all conversations (unique phone numbers with last message)
   * For the Chat page inbox view
   */
  getAllConversations: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentoradoWithMeta(ctx.user.id);
    if (!mentorado) {
      return [];
    }

    const db = getDb();

    // Link any orphan messages first
    await linkOrphanMessages(mentorado.id);

    // Get saved contacts for custom names
    const savedContacts = await db
      .select()
      .from(whatsappContacts)
      .where(eq(whatsappContacts.mentoradoId, mentorado.id));

    // Get all leads for name matching
    const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentorado.id));

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
      const normalizedPhone = msg.phone.replace(/\D/g, "");

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
      const savedContact = savedContacts.find((c) => {
        const contactPhone = c.phone.replace(/\D/g, "");
        return contactPhone.slice(-8) === normalizedPhone.slice(-8);
      });

      if (savedContact?.name) {
        conv.name = savedContact.name;
        continue;
      }

      // Check leads
      const matchedLead = allLeads.find((lead) => {
        if (!lead.telefone) return false;
        const leadPhone = lead.telefone.replace(/\D/g, "");
        return leadPhone.slice(-8) === normalizedPhone.slice(-8);
      });

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
   * Manually trigger linking of orphan WhatsApp messages to CRM leads
   */
  linkContacts: protectedProcedure.mutation(async ({ ctx }) => {
    const mentorado = await getMentoradoWithMeta(ctx.user.id);
    if (!mentorado) {
      return { success: false, linkedCount: 0, message: "Mentorado não encontrado" };
    }

    const linkedCount = await linkOrphanMessages(mentorado.id);
    return {
      success: true,
      linkedCount,
      message:
        linkedCount > 0
          ? `${linkedCount} mensagem(ns) vinculada(s) a contatos do CRM`
          : "Nenhuma mensagem nova para vincular",
    };
  }),

  /**
   * Get messages by phone number (for chat page)
   */
  getMessagesByPhone: protectedProcedure
    .input(z.object({ phone: z.string().min(1), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const mentorado = await getMentoradoWithMeta(ctx.user.id);
      if (!mentorado) {
        return [];
      }

      const db = getDb();
      const normalizedPhone = normalizePhoneNumber(input.phone);

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

      return messages.reverse(); // Return in chronological order
    }),

  /**
   * Mark a message as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ messageId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const mentorado = await getMentoradoWithMeta(ctx.user.id);
      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      const credentials = buildCredentials(mentorado);
      if (!credentials) {
        throw new Error("Meta WhatsApp não configurado");
      }

      await metaApiService.markMessageAsRead(credentials, input.messageId);
      return { success: true };
    }),
});
