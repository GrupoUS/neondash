import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { mentorados, whatsappMessages } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { baileysService } from "./services/baileysService";

export const baileysRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.mentorado) throw new Error("Mentorado not found");
    // Check in-memory status first
    const status = await baileysService.getSessionStatus(ctx.mentorado.id);

    // Also check DB for persisted status (though BaileysService is source of truth for connection)
    // We update DB on connection events usually
    return {
      connected: status.connected,
      configured: true, // Always configured if we are using Baileys
      qr: status.qr,
      status: status.status,
    };
  }),

  connect: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.mentorado) throw new Error("Mentorado not found");
    await baileysService.connect(ctx.mentorado.id);
    return { success: true };
  }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.mentorado) throw new Error("Mentorado not found");
    await baileysService.logout(ctx.mentorado.id);

    const db = getDb();
    await db
      .update(mentorados)
      .set({
        baileysConnected: "nao",
        updatedAt: new Date(),
      })
      .where(eq(mentorados.id, ctx.mentorado.id));

    return { success: true };
  }),

  getQRCode: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.mentorado) throw new Error("Mentorado not found");
    // Trigger connection if not active
    await baileysService.connect(ctx.mentorado.id);

    // Wait a bit for QR? The service emits it.
    // But query expects immediate return.
    // The frontend usually polls or uses subscription?
    // For now return current state.
    const status = await baileysService.getSessionStatus(ctx.mentorado.id);
    return {
      qr: status.qr,
      connected: status.connected,
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
      if (!ctx.mentorado) throw new Error("Mentorado not found");
      await baileysService.sendMessage(ctx.mentorado.id, input.phone, input.message);

      const db = getDb();
      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          mentoradoId: ctx.mentorado.id,
          leadId: input.leadId,
          phone: input.phone,
          direction: "outbound",
          content: input.message,
          status: "sent",
          isFromAi: "nao",
          createdAt: new Date(),
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
      if (!ctx.mentorado) throw new Error("Mentorado not found");
      const db = getDb();
      const conditions = [eq(whatsappMessages.mentoradoId, ctx.mentorado.id)];

      if (input.leadId) {
        conditions.push(eq(whatsappMessages.leadId, input.leadId));
      } else if (input.phone) {
        conditions.push(eq(whatsappMessages.phone, input.phone));
      }

      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(and(...conditions))
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(input.limit);

      return messages.reverse();
    }),
});
