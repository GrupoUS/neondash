import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  mentorados,
  whatsappContacts,
  whatsappMessages,
  whatsappReactions,
} from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { contactSyncService } from "./services/contactSyncService";
import { safeDecrypt } from "./services/crypto";
import { sseService } from "./services/sseService";
import { zapiService } from "./services/zapiService";

async function getMentoradoWithZapi(userId: number) {
  const db = getDb();
  const [mentorado] = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.userId, userId))
    .limit(1);

  return mentorado ?? null;
}

function buildCredentials(mentorado: {
  zapiInstanceId: string | null;
  zapiToken: string | null;
  zapiClientToken?: string | null;
}) {
  if (!mentorado.zapiInstanceId || !mentorado.zapiToken) return null;
  const token = safeDecrypt(mentorado.zapiToken);
  if (!token) return null;
  return {
    instanceId: mentorado.zapiInstanceId,
    token,
    clientToken: mentorado.zapiClientToken
      ? (safeDecrypt(mentorado.zapiClientToken) ?? undefined)
      : undefined,
  };
}

export const whatsappRouter = router({
  addReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.number().int().positive(),
        phone: z.string().min(8),
        emoji: z.string().min(1).max(32),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.mentorado) throw new TRPCError({ code: "FORBIDDEN" });
      const db = getDb();

      const [message] = await db
        .select({ id: whatsappMessages.id, mentoradoId: whatsappMessages.mentoradoId })
        .from(whatsappMessages)
        .where(eq(whatsappMessages.id, input.messageId))
        .limit(1);

      if (!message || message.mentoradoId !== ctx.mentorado.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      }

      const [created] = await db
        .insert(whatsappReactions)
        .values({
          messageId: input.messageId,
          mentoradoId: ctx.mentorado.id,
          phone: zapiService.normalizePhoneNumber(input.phone),
          emoji: input.emoji,
        })
        .returning();

      sseService.broadcastToPhone(ctx.mentorado.id, created.phone, "reaction", {
        type: "reaction-added",
        reaction: created,
      });

      return { success: true, reaction: created };
    }),

  removeReaction: protectedProcedure
    .input(
      z.object({
        reactionId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.mentorado) throw new TRPCError({ code: "FORBIDDEN" });
      const db = getDb();

      const [reaction] = await db
        .select()
        .from(whatsappReactions)
        .where(eq(whatsappReactions.id, input.reactionId))
        .limit(1);

      if (!reaction || reaction.mentoradoId !== ctx.mentorado.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reaction not found" });
      }

      await db.delete(whatsappReactions).where(eq(whatsappReactions.id, reaction.id));

      sseService.broadcastToPhone(ctx.mentorado.id, reaction.phone, "reaction", {
        type: "reaction-removed",
        reactionId: reaction.id,
        messageId: reaction.messageId,
      });

      return { success: true };
    }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        messageId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.mentorado) throw new TRPCError({ code: "FORBIDDEN" });
      const db = getDb();

      const [message] = await db
        .update(whatsappMessages)
        .set({ status: "read", readAt: new Date() })
        .where(
          and(
            eq(whatsappMessages.id, input.messageId),
            eq(whatsappMessages.mentoradoId, ctx.mentorado.id)
          )
        )
        .returning();

      if (!message) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      }

      const mentorado = await getMentoradoWithZapi(ctx.user.id);
      const credentials = mentorado ? buildCredentials(mentorado) : null;
      if (credentials && message.zapiMessageId) {
        await zapiService.markMessageAsRead(credentials, message.zapiMessageId);
      }

      sseService.broadcastToPhone(ctx.mentorado.id, message.phone, "message-read", {
        messageId: message.id,
        phone: message.phone,
        readAt: message.readAt,
      });

      return { success: true, messageId: message.id };
    }),

  sendTyping: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(8),
        isTyping: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.mentorado) throw new TRPCError({ code: "FORBIDDEN" });

      const mentorado = await getMentoradoWithZapi(ctx.user.id);
      if (!mentorado) throw new TRPCError({ code: "NOT_FOUND", message: "Mentorado not found" });

      const credentials = buildCredentials(mentorado);
      if (!credentials) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Z-API not configured" });
      }

      const phone = zapiService.normalizePhoneNumber(input.phone);
      const sent = await zapiService.sendTyping(credentials, phone, input.isTyping);

      const eventName = input.isTyping ? "typing-start" : "typing-stop";
      sseService.broadcastToPhone(ctx.mentorado.id, phone, eventName, {
        phone,
        isTyping: input.isTyping,
      });

      return { success: sent };
    }),

  syncContacts: protectedProcedure
    .input(
      z
        .object({
          phone: z.string().min(8).optional(),
          includePhoto: z.boolean().default(true),
          includePresence: z.boolean().default(true),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.mentorado) throw new TRPCError({ code: "FORBIDDEN" });
      const options = input ?? { includePhoto: true, includePresence: true };

      const syncResult = await contactSyncService.syncAllContacts(ctx.mentorado.id);

      if (options.phone) {
        const phone = zapiService.normalizePhoneNumber(options.phone);
        if (options.includePhoto) {
          await contactSyncService.syncContactPhoto(ctx.mentorado.id, phone);
        }
        if (options.includePresence) {
          const presence = await contactSyncService.syncContactPresence(ctx.mentorado.id, phone);
          sseService.broadcastToPhone(
            ctx.mentorado.id,
            phone,
            presence.isOnline ? "contact-online" : "contact-offline",
            presence
          );
        }
      }

      return { success: true, ...syncResult };
    }),

  getContactInfo: protectedProcedure
    .input(z.object({ phone: z.string().min(8) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.mentorado) throw new TRPCError({ code: "FORBIDDEN" });
      const db = getDb();
      const phone = zapiService.normalizePhoneNumber(input.phone);

      const [contact] = await db
        .select()
        .from(whatsappContacts)
        .where(
          and(eq(whatsappContacts.mentoradoId, ctx.mentorado.id), eq(whatsappContacts.phone, phone))
        )
        .limit(1);

      const lastMessage = await db.query.whatsappMessages.findFirst({
        where: and(
          eq(whatsappMessages.mentoradoId, ctx.mentorado.id),
          eq(whatsappMessages.phone, phone)
        ),
        orderBy: (messages, { desc }) => [desc(messages.createdAt)],
      });

      const unreadCountRows = await db
        .select({ id: whatsappMessages.id })
        .from(whatsappMessages)
        .where(
          and(
            eq(whatsappMessages.mentoradoId, ctx.mentorado.id),
            eq(whatsappMessages.phone, phone),
            eq(whatsappMessages.direction, "inbound"),
            isNull(whatsappMessages.readAt)
          )
        );

      return {
        contact: contact ?? null,
        lastMessage: lastMessage ?? null,
        unreadCount: unreadCountRows.length,
      };
    }),

  uploadMediaPlaceholder: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        placeholder: true,
        message: "Media upload endpoint placeholder for Phase 2",
        fileName: input.fileName,
        mimeType: input.mimeType,
      };
    }),
});
