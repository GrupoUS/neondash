import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { leads, mentorados, whatsappContacts, whatsappMessages } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { baileysService } from "./services/baileysService";
import { baileysSessionManager } from "./services/baileysSessionManager";

function getMentoradoOrThrow(
  mentorado: {
    id: number;
  } | null
): { id: number } {
  if (!mentorado) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Mentorado not found" });
  }

  return mentorado;
}

async function linkOrphanMessages(mentoradoId: number): Promise<number> {
  const db = getDb();

  const orphanMessages = await db
    .select()
    .from(whatsappMessages)
    .where(and(eq(whatsappMessages.mentoradoId, mentoradoId), isNull(whatsappMessages.leadId)));

  if (orphanMessages.length === 0) {
    return 0;
  }

  const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentoradoId));
  if (allLeads.length === 0) {
    return 0;
  }

  let linkedCount = 0;

  for (const msg of orphanMessages) {
    const matchedLead = allLeads.find((lead) => {
      if (!lead.telefone) return false;
      return (
        baileysService.normalizePhone(lead.telefone) === baileysService.normalizePhone(msg.phone)
      );
    });

    if (!matchedLead) continue;

    await db
      .update(whatsappMessages)
      .set({ leadId: matchedLead.id })
      .where(eq(whatsappMessages.id, msg.id));

    linkedCount += 1;
  }

  return linkedCount;
}

export const baileysRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = getMentoradoOrThrow(ctx.mentorado);
    const status = await baileysSessionManager.getSessionStatus(mentorado.id);

    return {
      connected: status.connected,
      configured: true,
      qr: status.qr,
      status: status.status,
      phone: status.phone,
    };
  }),

  connect: protectedProcedure.mutation(async ({ ctx }) => {
    const mentorado = getMentoradoOrThrow(ctx.mentorado);
    await baileysSessionManager.connect(mentorado.id);
    return { success: true };
  }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const mentorado = getMentoradoOrThrow(ctx.mentorado);
    await baileysSessionManager.logout(mentorado.id);

    const db = getDb();
    await db
      .update(mentorados)
      .set({
        baileysConnected: "nao",
        baileysPhone: null,
        baileysConnectedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(mentorados.id, mentorado.id));

    return { success: true };
  }),

  getQRCode: protectedProcedure.query(async ({ ctx }) => {
    const mentorado = getMentoradoOrThrow(ctx.mentorado);
    await baileysSessionManager.connect(mentorado.id);

    const status = await baileysSessionManager.getSessionStatus(mentorado.id);
    return {
      qr: status.qr,
      connected: status.connected,
      status: status.status,
    };
  }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        message: z.string(),
        leadId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mentorado = getMentoradoOrThrow(ctx.mentorado);
      const normalizedPhone = baileysService.normalizePhone(input.phone);
      await baileysService.sendMessage(mentorado.id, normalizedPhone, input.message);

      const db = getDb();
      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId: mentorado.id,
          leadId: input.leadId ?? null,
          phone: normalizedPhone,
          direction: "outbound",
          content: input.message,
          status: "sent",
          isFromAi: "nao",
        })
        .returning();

      return { success: true, messageId: savedMessage.id };
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        leadId: z.number().optional(),
        phone: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const mentorado = getMentoradoOrThrow(ctx.mentorado);
      const db = getDb();
      const conditions = [eq(whatsappMessages.mentoradoId, mentorado.id)];

      if (input.leadId) {
        conditions.push(eq(whatsappMessages.leadId, input.leadId));
      } else if (input.phone) {
        const normalizedPhone = baileysService.normalizePhone(input.phone);
        conditions.push(eq(whatsappMessages.phone, normalizedPhone));
      }

      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(and(...conditions))
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(input.limit);

      return messages.reverse();
    }),

  // Alias for getMessages to maintain API consistency with Meta and Z-API routers
  getMessagesByPhone: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const mentorado = getMentoradoOrThrow(ctx.mentorado);
      const db = getDb();
      const normalizedPhone = baileysService.normalizePhone(input.phone);

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

      const messageIds = messages.map((m) => m.id);

      const reactions =
        messageIds.length > 0
          ? await db
              .select()
              .from(whatsappReactions)
              .where(inArray(whatsappReactions.messageId, messageIds))
          : [];

      const messagesWithReactions = messages.map((msg) => ({
        ...msg,
        reactions: reactions.filter((r) => r.messageId === msg.id),
      }));

      return messagesWithReactions.reverse();
    }),

  getAllConversations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.mentorado) {
      return [];
    }

    const db = getDb();
    const mentoradoId = ctx.mentorado.id;

    await linkOrphanMessages(mentoradoId);

    const [savedContacts, allLeads, allMessages] = await Promise.all([
      db.select().from(whatsappContacts).where(eq(whatsappContacts.mentoradoId, mentoradoId)),
      db.select().from(leads).where(eq(leads.mentoradoId, mentoradoId)),
      db
        .select()
        .from(whatsappMessages)
        .where(eq(whatsappMessages.mentoradoId, mentoradoId))
        .orderBy(desc(whatsappMessages.createdAt)),
    ]);

    const conversationMap = new Map<
      string,
      {
        phone: string;
        name: string | null;
        leadId: number | null;
        lastMessage: string | null;
        lastMessageAt: Date | null;
        unreadCount: number;
        profileThumbnail: string | null;
      }
    >();

    for (const msg of allMessages) {
      const normalizedPhone = baileysService.normalizePhone(msg.phone);
      if (!conversationMap.has(normalizedPhone)) {
        conversationMap.set(normalizedPhone, {
          phone: normalizedPhone,
          name: null,
          leadId: msg.leadId,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
          profileThumbnail: null,
        });
      }

      const conv = conversationMap.get(normalizedPhone);
      if (!conv) continue;

      if (msg.direction === "inbound") {
        conv.unreadCount += 1;
      }

      if (!conv.leadId && msg.leadId) {
        conv.leadId = msg.leadId;
      }
    }

    for (const [normalizedPhone, conv] of conversationMap.entries()) {
      const savedContact = savedContacts.find(
        (contact) => baileysService.normalizePhone(contact.phone) === normalizedPhone
      );
      if (savedContact?.name) {
        conv.name = savedContact.name;
        continue;
      }

      const matchedLead = allLeads.find(
        (lead) => lead.telefone && baileysService.normalizePhone(lead.telefone) === normalizedPhone
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
});
