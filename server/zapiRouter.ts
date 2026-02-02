/**
 * Z-API tRPC Router
 * Handles WhatsApp connection management and messaging
 */
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { mentorados, whatsappMessages } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { encrypt, safeDecrypt } from "./services/crypto";
import { type ZApiCredentials, zapiService } from "./services/zapiService";

/**
 * Get mentorado with Z-API credentials
 */
async function getMentoradoWithZapi(userId: number) {
  const db = getDb();
  const [mentorado] = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.userId, userId))
    .limit(1);

  return mentorado ?? null;
}

/**
 * Build Z-API credentials from mentorado data
 */
function buildCredentials(mentorado: {
  zapiInstanceId: string | null;
  zapiToken: string | null;
}): ZApiCredentials | null {
  if (!mentorado.zapiInstanceId || !mentorado.zapiToken) {
    return null;
  }

  const decryptedToken = safeDecrypt(mentorado.zapiToken);
  if (!decryptedToken) {
    return null;
  }

  return {
    instanceId: mentorado.zapiInstanceId,
    token: decryptedToken,
  };
}

export const zapiRouter = router({
  /**
   * Get current WhatsApp connection status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentoradoWithZapi(ctx.user.id);
    if (!mentorado) {
      return { configured: false, connected: false };
    }

    const credentials = buildCredentials(mentorado);
    if (!credentials) {
      return { configured: false, connected: false };
    }

    const status = await zapiService.getConnectionStatus(credentials);

    // Update connection status in DB if changed
    const isConnected = status.connected ? "sim" : "nao";
    if (mentorado.zapiConnected !== isConnected) {
      const db = getDb();
      await db
        .update(mentorados)
        .set({
          zapiConnected: isConnected,
          zapiConnectedAt: status.connected ? new Date() : null,
          zapiPhone: status.phoneNumber ?? mentorado.zapiPhone,
          updatedAt: new Date(),
        })
        .where(eq(mentorados.id, mentorado.id));
    }

    return {
      configured: true,
      connected: status.connected,
      phone: status.phoneNumber ?? mentorado.zapiPhone,
      error: status.error,
    };
  }),

  /**
   * Configure Z-API credentials
   */
  configure: protectedProcedure
    .input(
      z.object({
        instanceId: z.string().min(1, "Instance ID é obrigatório"),
        token: z.string().min(1, "Token é obrigatório"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mentorado = await getMentoradoWithZapi(ctx.user.id);
      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      // Encrypt token before storing
      const encryptedToken = encrypt(input.token);

      const db = getDb();
      await db
        .update(mentorados)
        .set({
          zapiInstanceId: input.instanceId,
          zapiToken: encryptedToken,
          zapiConnected: "nao",
          updatedAt: new Date(),
        })
        .where(eq(mentorados.id, mentorado.id));

      return { success: true };
    }),

  /**
   * Get QR code for WhatsApp connection
   */
  getQRCode: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentoradoWithZapi(ctx.user.id);
    if (!mentorado) {
      throw new Error("Mentorado não encontrado");
    }

    const credentials = buildCredentials(mentorado);
    if (!credentials) {
      throw new Error("Z-API não configurado. Configure as credenciais primeiro.");
    }

    const qrResponse = await zapiService.getQRCode(credentials);

    return {
      qrCode: qrResponse.value,
      connected: qrResponse.connected,
    };
  }),

  /**
   * Disconnect WhatsApp session
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const mentorado = await getMentoradoWithZapi(ctx.user.id);
    if (!mentorado) {
      throw new Error("Mentorado não encontrado");
    }

    const credentials = buildCredentials(mentorado);
    if (!credentials) {
      throw new Error("Z-API não configurado");
    }

    await zapiService.disconnect(credentials);

    const db = getDb();
    await db
      .update(mentorados)
      .set({
        zapiConnected: "nao",
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
      const mentorado = await getMentoradoWithZapi(ctx.user.id);
      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      const credentials = buildCredentials(mentorado);
      if (!credentials) {
        throw new Error("Z-API não configurado");
      }

      // Send message via Z-API
      const response = await zapiService.sendTextMessage(credentials, {
        phone: input.phone,
        message: input.message,
      });

      // Store message in DB
      const db = getDb();
      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId: mentorado.id,
          leadId: input.leadId ?? null,
          phone: input.phone,
          direction: "outbound",
          content: input.message,
          zapiMessageId: response.zapiMessageId ?? response.id,
          status: "sent",
          isFromAi: "nao",
        })
        .returning();

      return {
        success: true,
        messageId: savedMessage?.id,
        zapiMessageId: response.zapiMessageId,
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
      const mentorado = await getMentoradoWithZapi(ctx.user.id);
      if (!mentorado) {
        return [];
      }

      // Build query conditions
      const conditions = [eq(whatsappMessages.mentoradoId, mentorado.id)];

      if (input.leadId) {
        conditions.push(eq(whatsappMessages.leadId, input.leadId));
      } else if (input.phone) {
        // Normalize for comparison
        const normalizedPhone = zapiService.normalizePhoneNumber(input.phone);
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
   * Get unread message count per lead
   */
  getUnreadCounts: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentoradoWithZapi(ctx.user.id);
    if (!mentorado) {
      return {};
    }

    // Get all inbound messages that haven't been "seen"
    // For now, simple count per lead
    const db = getDb();
    const messages = await db
      .select({
        leadId: whatsappMessages.leadId,
      })
      .from(whatsappMessages)
      .where(
        and(
          eq(whatsappMessages.mentoradoId, mentorado.id),
          eq(whatsappMessages.direction, "inbound")
        )
      );

    // Count messages per lead
    const counts: Record<number, number> = {};
    for (const msg of messages) {
      if (msg.leadId) {
        counts[msg.leadId] = (counts[msg.leadId] ?? 0) + 1;
      }
    }

    return counts;
  }),
});
