import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { interacoes } from "../drizzle/schema";
import { mentoradoProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const interacoesRouter = router({
  // Get notes for the current mentorado (where leadId is null)
  getNotes: mentoradoProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return await db
        .select()
        .from(interacoes)
        .where(
          and(
            eq(interacoes.mentoradoId, ctx.mentorado.id),
            eq(interacoes.tipo, "nota"),
            isNull(interacoes.leadId) // General notes only
          )
        )
        .orderBy(desc(interacoes.createdAt))
        .limit(input.limit);
    }),

  // Create a new general note
  createNote: mentoradoProcedure
    .input(
      z.object({
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [note] = await db
        .insert(interacoes)
        .values({
          mentoradoId: ctx.mentorado.id,
          tipo: "nota",
          notas: input.content,
          // leadId is undefined/null
        })
        .returning();

      return note;
    }),

  // Get recent meetings
  getMeetings: mentoradoProcedure
    .input(z.object({ limit: z.number().default(3) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return await db
        .select()
        .from(interacoes)
        .where(and(eq(interacoes.mentoradoId, ctx.mentorado.id), eq(interacoes.tipo, "reuniao")))
        .orderBy(desc(interacoes.createdAt))
        .limit(input.limit);
    }),
});
