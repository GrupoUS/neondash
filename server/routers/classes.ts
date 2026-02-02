import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { classes, classProgress } from "../../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const classesRouter = router({
  list: protectedProcedure
    .input(z.object({ mentoradoId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();

      let targetMentoradoId = ctx.mentorado?.id;

      if (input?.mentoradoId) {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
        }
        targetMentoradoId = input.mentoradoId;
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Mentorado profile required",
        });
      }

      // Fetch classes and join with progress for the current mentorado
      // Note: Drizzle's query builder for joins can be verbose, so we might fetch classes and progress separately
      // or use a raw query if needed. For now, let's fetch separately and merge in JS for simplicity unless performance is critical.

      const allClasses = await db.select().from(classes).orderBy(desc(classes.date));

      const progress = await db
        .select()
        .from(classProgress)
        .where(eq(classProgress.mentoradoId, targetMentoradoId));

      const progressMap = new Map(progress.map((p) => [p.classId, p]));

      return allClasses.map((c) => ({
        ...c,
        watched: progressMap.has(c.id),
        completedAt: progressMap.get(c.id)?.completedAt || null,
      }));
    }),

  markWatched: protectedProcedure
    .input(
      z.object({
        classId: z.number(),
        mentoradoId: z.number().optional(), // Admin override
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      let targetMentoradoId = ctx.mentorado?.id;
      if (input.mentoradoId) {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        targetMentoradoId = input.mentoradoId;
      }
      if (!targetMentoradoId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check if already watched
      const existing = await db
        .select()
        .from(classProgress)
        .where(
          and(
            eq(classProgress.mentoradoId, targetMentoradoId),
            eq(classProgress.classId, input.classId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const [newProgress] = await db
        .insert(classProgress)
        .values({
          mentoradoId: targetMentoradoId,
          classId: input.classId,
          status: "watched",
          completedAt: new Date(),
        })
        .returning();

      return newProgress;
    }),

  getNextLive: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    // Get future live classes
    const futureClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.type, "live"))
      .orderBy(desc(classes.date))
      .limit(20);

    // In memory sort/find is safer for small datasets to handle "Live Now" window
    const now = Date.now();
    const upcoming = futureClasses
      .filter((c) => c.date && new Date(c.date).getTime() > now - 1000 * 60 * 60 * 2) // Within last 2 hours or future
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    return upcoming[0] || null;
  }),

  upsertNextLive: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        url: z.string().url(),
        date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (input.id) {
        const [updated] = await db
          .update(classes)
          .set({
            title: input.title,
            description: input.description,
            url: input.url,
            date: new Date(input.date),
            type: "live",
          })
          .where(eq(classes.id, input.id))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(classes)
        .values({
          title: input.title,
          description: input.description || "",
          url: input.url,
          date: new Date(input.date),
          type: "live",
        })
        .returning();
      return created;
    }),
});
