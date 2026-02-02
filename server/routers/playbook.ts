import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  diagnosticos,
  playbookItems,
  playbookModules,
  playbookProgress,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const playbookRouter = router({
  getModules: protectedProcedure
    .input(z.object({ turma: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      // Fetch modules, optionally filtered by turma or global (null)
      // For now, let's fetch all modules and sort by order
      const modules = await db.select().from(playbookModules).orderBy(asc(playbookModules.order));

      // Fetch all items for these modules
      const items = await db.select().from(playbookItems).orderBy(asc(playbookItems.order));

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
      return modules.map((module) => {
        const moduleItems = items.filter((i) => i.moduleId === module.id);
        const moduleItemsWithProgress = moduleItems.map((item) => {
          const prog = progress.find((p) => p.itemId === item.id);
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
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
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
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = getDb();
      return await db.insert(playbookItems).values(input).returning();
    }),

  getRoadmap: protectedProcedure
    .input(z.object({ mentoradoId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      let mentoradoId = input.mentoradoId;

      if (!mentoradoId) {
        if (ctx.user?.role === "admin") {
          // If admin and no ID, return null or empty
          return null;
        }
        mentoradoId = ctx.mentorado?.id;
      }

      if (!mentoradoId) return null;

      const modules = await db.select().from(playbookModules).orderBy(asc(playbookModules.order));

      const items = await db.select().from(playbookItems).orderBy(asc(playbookItems.order));

      const progress = await db
        .select()
        .from(playbookProgress)
        .where(eq(playbookProgress.mentoradoId, mentoradoId));

      const [diagnostic] = await db
        .select()
        .from(diagnosticos)
        .where(eq(diagnosticos.mentoradoId, mentoradoId));

      const isDiagnosticDone = !!(diagnostic?.atuacaoSaude && diagnostic?.rendaMensal);

      const roadmap = modules.map((mod) => {
        const modItems = items.filter((item) => item.moduleId === mod.id);
        const modProgress = modItems.map((item) => {
          const prog = progress.find((p) => p.itemId === item.id);
          return {
            ...item,
            isCompleted: !!prog,
            completedAt: prog?.completedAt,
          };
        });

        const total = modItems.length;
        const completed = modProgress.filter((i) => i.isCompleted).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...mod,
          items: modProgress,
          progress: percent,
          isLocked: false,
          status: percent === 100 ? "completed" : percent > 0 ? "in_progress" : "locked",
        };
      });

      for (let i = 0; i < roadmap.length; i++) {
        if (i === 0) {
          roadmap[i].isLocked = false;
          // Force status to in_progress if 0% but unlocked, so it glows? No, let's keep logic.
        } else {
          const prev = roadmap[i - 1];
          if (prev.status === "completed" || roadmap[i].progress > 0) {
            roadmap[i].isLocked = false;
          } else {
            roadmap[i].isLocked = true;
            roadmap[i].status = "locked";
          }
        }
      }

      return {
        modules: roadmap,
        diagnostic: {
          isCompleted: isDiagnosticDone,
        },
      };
    }),
});
