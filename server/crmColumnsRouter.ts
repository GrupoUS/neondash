import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { crmColumnConfig } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const crmColumnsRouter = router({
  list: protectedProcedure
    .input(z.object({ mentoradoId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Determine target mentorado
      let targetMentoradoId = ctx.mentorado?.id;

      if (input?.mentoradoId) {
        // Admin override: can view any mentorado's columns
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        targetMentoradoId = input.mentoradoId;
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Perfil de mentorado necessário",
        });
      }

      const columns = await db
        .select()
        .from(crmColumnConfig)
        .where(eq(crmColumnConfig.mentoradoId, targetMentoradoId))
        .orderBy(asc(crmColumnConfig.order));
      return columns;
    }),

  save: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number().optional(),
        columns: z.array(
          z.object({
            originalId: z.string(),
            label: z.string(),
            color: z.string(),
            visible: z.enum(["sim", "nao"]),
            order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Determine target mentorado
      let targetMentoradoId = ctx.mentorado?.id;

      if (input.mentoradoId) {
        // Admin override: can edit any mentorado's columns
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        targetMentoradoId = input.mentoradoId;
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Perfil de mentorado necessário",
        });
      }

      // Transaction to upsert all
      await db.transaction(async (tx) => {
        for (const col of input.columns) {
          await tx
            .insert(crmColumnConfig)
            .values({
              mentoradoId: targetMentoradoId,
              originalId: col.originalId,
              label: col.label,
              color: col.color,
              visible: col.visible,
              order: col.order,
            })
            .onConflictDoUpdate({
              target: [crmColumnConfig.mentoradoId, crmColumnConfig.originalId],
              set: {
                label: col.label,
                color: col.color,
                visible: col.visible,
                order: col.order,
                updatedAt: new Date(),
              },
            });
        }
      });

      return { success: true };
    }),
});
