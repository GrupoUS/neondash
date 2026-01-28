/**
 * Moltbot Router - tRPC procedures for AI assistant integration
 *
 * Provides:
 * - Session management (create, terminate, list)
 * - Message handling (send, history)
 * - WhatsApp pairing (QR code, disconnect)
 * - Mentorado context for AI
 */

import { z } from "zod";
import { mentoradoProcedure, router } from "./_core/trpc";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  moltbotSessions,
  moltbotMessages,
  mentorados,
  metricasMensais,
  feedbacks,
} from "../drizzle/schema";
import { moltbotService } from "./services/moltbotService";
import { TRPCError } from "@trpc/server";

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates session ownership before allowing operations
 */
async function validateSessionOwnership(
  sessionId: string,
  userId: number
): Promise<typeof moltbotSessions.$inferSelect> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const [session] = await db
    .select()
    .from(moltbotSessions)
    .where(eq(moltbotSessions.sessionId, sessionId))
    .limit(1);

  if (!session) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
  }

  if (session.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }

  return session;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════

export const moltbotRouter = router({
  /**
   * Create a webchat session for the current user
   */
  createWebchatSession: mentoradoProcedure
    .input(
      z.object({
        initialMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = await moltbotService.createSession(
        ctx.user.id,
        "webchat"
      );

      // If initial message provided, send it
      if (input.initialMessage) {
        await moltbotService.sendMessage(
          sessionId,
          input.initialMessage,
          ctx.user.id
        );
      }

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          service: "moltbot",
          action: "createWebchatSession",
          userId: ctx.user.id,
          sessionId,
        })
      );

      return { sessionId, status: "active" };
    }),

  /**
   * Get all active sessions for the current user
   */
  getActiveSessions: mentoradoProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const sessions = await db
      .select()
      .from(moltbotSessions)
      .where(
        and(
          eq(moltbotSessions.userId, ctx.user.id),
          eq(moltbotSessions.isActive, "sim")
        )
      )
      .orderBy(desc(moltbotSessions.lastActivityAt));

    return sessions;
  }),

  /**
   * Terminate a chat session
   */
  terminateSession: mentoradoProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate ownership
      await validateSessionOwnership(input.sessionId, ctx.user.id);

      const success = await moltbotService.terminateSession(input.sessionId);

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          service: "moltbot",
          action: "terminateSession",
          userId: ctx.user.id,
          sessionId: input.sessionId,
        })
      );

      return { success };
    }),

  /**
   * Send a message in a chat session
   */
  sendMessage: mentoradoProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate ownership
      await validateSessionOwnership(input.sessionId, ctx.user.id);

      const messageId = await moltbotService.sendMessage(
        input.sessionId,
        input.content,
        ctx.user.id
      );

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          service: "moltbot",
          action: "sendMessage",
          userId: ctx.user.id,
          sessionId: input.sessionId,
          messageId,
        })
      );

      return { messageId };
    }),

  /**
   * Get message history for a session
   */
  getMessageHistory: mentoradoProcedure
    .input(
      z.object({
        sessionId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().optional(), // For pagination
      })
    )
    .query(async ({ ctx, input }) => {
      // Validate ownership
      const session = await validateSessionOwnership(
        input.sessionId,
        ctx.user.id
      );

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const messages = await db
        .select()
        .from(moltbotMessages)
        .where(eq(moltbotMessages.sessionId, session.id))
        .orderBy(desc(moltbotMessages.createdAt))
        .limit(input.limit + 1); // +1 to check if more exist

      const hasMore = messages.length > input.limit;
      const items = hasMore ? messages.slice(0, -1) : messages;

      return {
        items: items.reverse(), // Return in chronological order
        hasMore,
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      };
    }),

  /**
   * Get mentorado context data for AI assistant
   */
  getMoltbotContext: mentoradoProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Mentorado is guaranteed by mentoradoProcedure
    const mentorado = ctx.mentorado;

    // Get current year/month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get metrics for the last 6 months
    const metrics = await db
      .select()
      .from(metricasMensais)
      .where(eq(metricasMensais.mentoradoId, mentorado.id))
      .orderBy(desc(metricasMensais.ano), desc(metricasMensais.mes))
      .limit(6);

    // Get latest feedback
    const [latestFeedback] = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.mentoradoId, mentorado.id))
      .orderBy(desc(feedbacks.ano), desc(feedbacks.mes))
      .limit(1);

    // Get goals from mentorado profile
    const goals = {
      metaFaturamento: mentorado.metaFaturamento,
      metaLeads: mentorado.metaLeads,
      metaProcedimentos: mentorado.metaProcedimentos,
      metaPosts: mentorado.metaPosts,
      metaStories: mentorado.metaStories,
    };

    return {
      mentorado: {
        id: mentorado.id,
        nomeCompleto: mentorado.nomeCompleto,
        turma: mentorado.turma,
        email: mentorado.email,
      },
      metrics,
      latestFeedback: latestFeedback || null,
      goals,
      currentPeriod: { year: currentYear, month: currentMonth },
    };
  }),

  /**
   * Request WhatsApp QR code for pairing
   */
  requestWhatsAppQR: mentoradoProcedure.mutation(async ({ ctx }) => {
    const result = await moltbotService.requestQRCode(ctx.user.id);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot",
        action: "requestWhatsAppQR",
        userId: ctx.user.id,
      })
    );

    return result;
  }),

  /**
   * Disconnect WhatsApp session
   */
  disconnectWhatsApp: mentoradoProcedure.mutation(async ({ ctx }) => {
    const success = await moltbotService.disconnectWhatsApp(ctx.user.id);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot",
        action: "disconnectWhatsApp",
        userId: ctx.user.id,
        success,
      })
    );

    return { success };
  }),

  /**
   * Get connection status for Moltbot gateway
   */
  getStatus: mentoradoProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Get active sessions for user
    const sessions = await db
      .select()
      .from(moltbotSessions)
      .where(
        and(
          eq(moltbotSessions.userId, ctx.user.id),
          eq(moltbotSessions.isActive, "sim")
        )
      );

    // Check for WhatsApp session
    const whatsappSession = sessions.find(
      (s) => s.channelType === "whatsapp"
    );

    return {
      isGatewayConnected: moltbotService.isConnected(),
      activeSessionCount: sessions.length,
      whatsappConnected: !!whatsappSession,
      webchatActive: sessions.some((s) => s.channelType === "webchat"),
    };
  }),
});
