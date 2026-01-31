import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import {
  playbookModules,
  playbookItems,
  playbookProgress,
} from "../../drizzle/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

export const playbookRouter = router({
  getModules: protectedProcedure
    .input(z.object({ turma: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      // Fetch modules, optionally filtered by turma or global (null)
      // For now, let's fetch all modules and sort by order
      const modules = await db
        .select()
        .from(playbookModules)
        .orderBy(asc(playbookModules.order));

      // Fetch all items for these modules
      const items = await db
        .select()
        .from(playbookItems)
        .orderBy(asc(playbookItems.order));

      // Fetch progress for current user
      let progress: any[] = [];
      const mentoradoId = ctx.mentorado?.id;

      if (mentoradoId) {
        progress = await db
          .select()
          .from(playbookProgress)
          .where(eq(playbookProgress.mentoradoId, mentoradoId));
      }

      // Structure the response
      return modules.map(module => {
        const moduleItems = items.filter(i => i.moduleId === module.id);
        const moduleItemsWithProgress = moduleItems.map(item => {
          const prog = progress.find(p => p.itemId === item.id);
          return {
            ...item,
            isCompleted: !!prog,
            completedAt: prog?.completedAt || null,
            notes: prog?.notes || null,
          };
        });

        return {
          ...module,
          items: moduleItemsWithProgress,
        };
      });
    }),

  toggleItem: protectedProcedure
    .input(z.object({ itemId: z.number(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado?.id;

      if (!mentoradoId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Mentorado profile required",
        });
      }

      if (input.completed) {
        // Mark as complete
        await db
          .insert(playbookProgress)
          .values({
            mentoradoId,
            itemId: input.itemId,
            status: "completed",
            completedAt: new Date(),
          })
          .onConflictDoNothing(); // If already exists, do nothing
      } else {
        // Mark as incomplete (delete progress record)
        await db
          .delete(playbookProgress)
          .where(
            and(
              eq(playbookProgress.mentoradoId, mentoradoId),
              eq(playbookProgress.itemId, input.itemId)
            )
          );
      }

      return { success: true };
    }),

  // Admin only: Seed or Manage
  createModule: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = getDb();
      return await db.insert(playbookModules).values(input).returning();
    }),

  createItem: protectedProcedure
    .input(
      z.object({
        moduleId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(["task", "video", "link"]).default("task"),
        contentUrl: z.string().optional(),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = getDb();
      return await db.insert(playbookItems).values(input).returning();
    }),
});
