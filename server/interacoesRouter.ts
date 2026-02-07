import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { interacoes } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const interacoesRouter = router({
  // Get notes for a mentorado (where leadId is null)
  // Admin can view any mentorado's notes by passing mentoradoId
  getNotes: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(5),
        mentoradoId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Determine target mentorado
      let targetMentoradoId = ctx.mentorado?.id;

      if (input.mentoradoId) {
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

      return await db
        .select()
        .from(interacoes)
        .where(
          and(
            eq(interacoes.mentoradoId, targetMentoradoId),
            eq(interacoes.tipo, "nota"),
            isNull(interacoes.leadId) // General notes only
          )
        )
        .orderBy(desc(interacoes.createdAt))
        .limit(input.limit);
    }),

  // Create a new general note
  // Admin can create notes for any mentorado by passing mentoradoId
  createNote: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        mentoradoId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Determine target mentorado
      let targetMentoradoId = ctx.mentorado?.id;

      if (input.mentoradoId) {
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

      const [note] = await db
        .insert(interacoes)
        .values({
          mentoradoId: targetMentoradoId,
          tipo: "nota",
          notas: input.content,
          // leadId is undefined/null
        })
        .returning();

      return note;
    }),

  // Get recent meetings
  // Admin can view any mentorado's meetings by passing mentoradoId
  getMeetings: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(3),
        mentoradoId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Determine target mentorado
      let targetMentoradoId = ctx.mentorado?.id;

      if (input.mentoradoId) {
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

      return await db
        .select()
        .from(interacoes)
        .where(and(eq(interacoes.mentoradoId, targetMentoradoId), eq(interacoes.tipo, "reuniao")))
        .orderBy(desc(interacoes.createdAt))
        .limit(input.limit);
    }),
});
