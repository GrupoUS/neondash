/**
 * Z-API tRPC Router
 * Handles WhatsApp connection management and messaging
 */
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { leads, mentorados, whatsappMessages } from "../drizzle/schema";
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
  zapiClientToken?: string | null;
}): ZApiCredentials | null {
  if (!mentorado.zapiInstanceId || !mentorado.zapiToken) {
    return null;
  }

  const decryptedToken = safeDecrypt(mentorado.zapiToken);
  if (!decryptedToken) {
    return null;
  }

  // Decrypt client token (account security token) if present
  const decryptedClientToken = mentorado.zapiClientToken
    ? safeDecrypt(mentorado.zapiClientToken)
    : undefined;

  return {
    instanceId: mentorado.zapiInstanceId,
    token: decryptedToken,
    clientToken: decryptedClientToken ?? undefined,
  };
}

/**
 * Link orphan WhatsApp messages to existing CRM leads by matching phone numbers
 * Uses phonesMatch() for flexible format matching (handles +55, 9th digit, etc.)
 * Returns count of newly linked messages
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

  // Match orphan messages to leads
  for (const msg of orphanMessages) {
    const matchedLead = allLeads.find(
      (lead) => lead.telefone && zapiService.phonesMatch(lead.telefone, msg.phone)
    );

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
        clientToken: z.string().optional(), // Account Security Token (optional)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mentorado = await getMentoradoWithZapi(ctx.user.id);
      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      // Encrypt tokens before storing
      const encryptedToken = encrypt(input.token);
      const encryptedClientToken = input.clientToken ? encrypt(input.clientToken) : null;

      const db = getDb();
      await db
        .update(mentorados)
        .set({
          zapiInstanceId: input.instanceId,
          zapiToken: encryptedToken,
          zapiClientToken: encryptedClientToken,
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

    // Validate QR code response
    if (!qrResponse.value) {
      // If connected, QR code won't be generated
      if (qrResponse.connected) {
        return {
          qrCode: null,
          connected: true,
        };
      }
      throw new Error("Z-API não retornou o QR Code. Verifique se a instância está ativa.");
    }

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

  /**
   * Get all conversations (unique phone numbers with last message)
   * For the Chat page inbox view
   * Auto-links orphan messages to leads using phone matching
   */
  getAllConversations: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentoradoWithZapi(ctx.user.id);
    if (!mentorado) {
      return [];
    }

    const db = getDb();

    // Step 1: Auto-link orphan messages to existing leads
    await linkOrphanMessages(mentorado.id);

    // Step 2: Get all messages grouped by phone
    const allMessages = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.mentoradoId, mentorado.id))
      .orderBy(desc(whatsappMessages.createdAt));

    // Step 3: Get all leads for proactive matching
    const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentorado.id));

    // Group by NORMALIZED phone to merge duplicates with different formats
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
      // Normalize phone for grouping (merges +5562... with 62...)
      const normalizedPhone = zapiService.normalizePhoneNumber(msg.phone);

      if (!conversationMap.has(normalizedPhone)) {
        // First occurrence = latest message for this phone
        conversationMap.set(normalizedPhone, {
          phone: msg.phone, // Keep original for display
          name: null, // Will be populated from lead if exists
          leadId: msg.leadId,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }
      // Count inbound messages as unread
      const conv = conversationMap.get(normalizedPhone)!;
      if (msg.direction === "inbound") {
        conv.unreadCount += 1;
      }
      // Keep first leadId found
      if (!conv.leadId && msg.leadId) {
        conv.leadId = msg.leadId;
      }
    }

    // Step 4: Proactively match leads for conversations without leadId
    for (const [normalizedPhone, conv] of conversationMap.entries()) {
      if (!conv.leadId) {
        // Try to find a lead with matching phone
        const matchedLead = allLeads.find(
          (lead) => lead.telefone && zapiService.phonesMatch(lead.telefone, normalizedPhone)
        );
        if (matchedLead) {
          conv.leadId = matchedLead.id;
          conv.name = matchedLead.nome;
        }
      }
    }

    // Step 5: Get lead names for conversations with leadId
    for (const lead of allLeads) {
      for (const conv of conversationMap.values()) {
        if (conv.leadId === lead.id && !conv.name) {
          conv.name = lead.nome;
        }
      }
    }

    // Return as sorted array (most recent first)
    return Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }),

  /**
   * Manually trigger linking of orphan WhatsApp messages to CRM leads
   * Useful when leads are added after messages were received
   */
  linkContacts: protectedProcedure.mutation(async ({ ctx }) => {
    const mentorado = await getMentoradoWithZapi(ctx.user.id);
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
      const mentorado = await getMentoradoWithZapi(ctx.user.id);
      if (!mentorado) {
        return [];
      }

      const db = getDb();
      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(
          and(
            eq(whatsappMessages.mentoradoId, mentorado.id),
            eq(whatsappMessages.phone, input.phone)
          )
        )
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(input.limit);

      return messages.reverse(); // Return in chronological order
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATOR API PROCEDURES
  // For managing instances via the Z-API Integrator Partner program
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if integrator mode is available
   */
  isIntegratorAvailable: protectedProcedure.query(() => {
    return { available: zapiService.isIntegratorModeAvailable() };
  }),

  /**
   * Create and connect a new instance (one-click flow)
   * This provision a new Z-API instance and automatically configures it
   */
  createAndConnectInstance: protectedProcedure.mutation(async ({ ctx }) => {
    const mentorado = await getMentoradoWithZapi(ctx.user.id);
    if (!mentorado) {
      throw new Error("Mentorado não encontrado");
    }

    // Check if already has an active instance
    if (mentorado.zapiInstanceId && mentorado.zapiManagedByIntegrator === "sim") {
      throw new Error("Você já possui uma instância WhatsApp ativa");
    }

    // Verify integrator mode is available
    if (!zapiService.isIntegratorModeAvailable()) {
      throw new Error("Modo integrador não está configurado. Entre em contato com o suporte.");
    }

    // Create new instance via Integrator API
    const instanceName = `neondash-${mentorado.id}-${mentorado.nomeCompleto.split(" ")[0]}`;
    const result = await zapiService.createInstance(instanceName);

    // Encrypt token before storing
    const encryptedToken = encrypt(result.token);
    const dueDate = result.due ? new Date(result.due) : null;

    // Update mentorado with the new instance credentials
    const db = getDb();
    await db
      .update(mentorados)
      .set({
        zapiInstanceId: result.id,
        zapiToken: encryptedToken,
        zapiClientToken: null, // Clean up any old client token
        zapiConnected: "nao",
        zapiInstanceStatus: "trial",
        zapiInstanceDueDate: dueDate,
        zapiInstanceCreatedAt: new Date(),
        zapiManagedByIntegrator: "sim",
        updatedAt: new Date(),
      })
      .where(eq(mentorados.id, mentorado.id));

    return {
      success: true,
      instanceId: result.id,
      status: "trial",
      dueDate: dueDate?.toISOString() ?? null,
      message: "Instância criada com sucesso! Agora escaneie o QR code para conectar.",
    };
  }),

  /**
   * Get instance lifecycle information
   */
  getInstanceLifecycle: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = await getMentoradoWithZapi(ctx.user.id);
    if (!mentorado) {
      return { hasInstance: false };
    }

    if (!mentorado.zapiInstanceId) {
      return { hasInstance: false };
    }

    return {
      hasInstance: true,
      instanceId: mentorado.zapiInstanceId,
      status: mentorado.zapiInstanceStatus,
      dueDate: mentorado.zapiInstanceDueDate?.toISOString() ?? null,
      createdAt: mentorado.zapiInstanceCreatedAt?.toISOString() ?? null,
      managedByIntegrator: mentorado.zapiManagedByIntegrator === "sim",
      connected: mentorado.zapiConnected === "sim",
      phone: mentorado.zapiPhone,
    };
  }),

  /**
   * Activate instance (convert trial to paid)
   * Admin-only procedure
   */
  activateInstance: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Admin-only: verify user role before proceeding
      if (ctx.user.role !== "admin") {
        throw new Error("Apenas administradores podem ativar instâncias");
      }

      const db = getDb();
      const [mentorado] = await db
        .select()
        .from(mentorados)
        .where(eq(mentorados.id, input.mentoradoId))
        .limit(1);

      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      if (!mentorado.zapiInstanceId || !mentorado.zapiToken) {
        throw new Error("Mentorado não possui instância Z-API configurada");
      }

      const decryptedToken = safeDecrypt(mentorado.zapiToken);
      if (!decryptedToken) {
        throw new Error("Erro ao descriptografar token");
      }

      // Subscribe to the instance via Integrator API
      await zapiService.subscribeInstance(mentorado.zapiInstanceId, decryptedToken);

      // Update status in database
      await db
        .update(mentorados)
        .set({
          zapiInstanceStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(mentorados.id, mentorado.id));

      return { success: true, message: "Instância ativada com sucesso" };
    }),

  /**
   * Cancel instance subscription
   * Admin-only procedure
   */
  cancelInstance: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Admin-only: verify user role before proceeding
      if (ctx.user.role !== "admin") {
        throw new Error("Apenas administradores podem cancelar instâncias");
      }

      const db = getDb();
      const [mentorado] = await db
        .select()
        .from(mentorados)
        .where(eq(mentorados.id, input.mentoradoId))
        .limit(1);

      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      if (!mentorado.zapiInstanceId || !mentorado.zapiToken) {
        throw new Error("Mentorado não possui instância Z-API configurada");
      }

      const decryptedToken = safeDecrypt(mentorado.zapiToken);
      if (!decryptedToken) {
        throw new Error("Erro ao descriptografar token");
      }

      // Cancel the instance via Integrator API
      await zapiService.cancelInstance(mentorado.zapiInstanceId, decryptedToken);

      // Update status in database
      await db
        .update(mentorados)
        .set({
          zapiInstanceStatus: "canceled",
          updatedAt: new Date(),
        })
        .where(eq(mentorados.id, mentorado.id));

      return {
        success: true,
        message: "Instância cancelada. Permanece ativa até o fim do período.",
      };
    }),
});
