import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  atividadeProgress,
  playbookItems,
  playbookModules,
  playbookProgress,
} from "../../drizzle/schema";
import { ATIVIDADES, FASES } from "../../shared/atividades-data";
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
          return null;
        }
        mentoradoId = ctx.mentorado?.id;
      }

      if (!mentoradoId) return null;

      // 1. Fetch Activity Progress (Steps)
      const successStatus = "sim" as const; // Matches simNaoEnum
      const progressRecords = await db
        .select()
        .from(atividadeProgress)
        .where(
          and(
            eq(atividadeProgress.mentoradoId, mentoradoId),
            eq(atividadeProgress.completed, successStatus)
          )
        );

      // Create a set of completed steps: "atividadeCode:stepCode"
      const completedStepsSet = new Set(
        progressRecords.map((p) => `${p.atividadeCodigo}:${p.stepCodigo}`)
      );

      // 2. Define Phases (The 6 Phases)
      // We import this from shared dynamically or define it here if import fails.
      // Ideally we import { ATIVIDADES, FASES } from "../../shared/atividades-data";
      // Since I can't easily add an import at the top with this tool without overwriting the whole file or being very precise,
      // I will re-implement the iteration logic here for safety, or assume the user wants me to fix the import at the top separately.
      // OPTION: I will add the import at the top in a separate step or try to use a full file replace if it's cleaner.
      // Given the complexity, let's use the MultiReplace or just replace the procedure and I will add the import in a subsequent step if needed.
      // Wait, I can't use ATIVIDADES if I don't import it.
      // I will assume I can import it. I'll add the import line in this same tool call if possible? No, it's a replace valid for a contiguous block.
      // I'll stick to a hardcoded phase map here for robustness in this single step,
      // OR I can use the existing 'playbookModules' but I agreed to skip them.

      // Let's rely on importing. I'll add a separate step to add the import at the top.
      // For now, I will write code that USES 'ATIVIDADES'.

      const roadmap = FASES.map((phase) => {
        // Find activities for this phase
        const phaseActivities = ATIVIDADES.filter((a) => a.etapa === phase.etapaKey);

        let totalSteps = 0;
        let completedSteps = 0;

        phaseActivities.forEach((activity) => {
          activity.steps.forEach((step) => {
            totalSteps++;
            if (completedStepsSet.has(`${activity.codigo}:${step.codigo}`)) {
              completedSteps++;
            }
          });
        });

        const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        const status = percent === 100 ? "completed" : percent > 0 ? "in_progress" : "locked";

        return {
          id: phase.id,
          title: phase.title,
          description: phase.description,
          progress: percent,
          order: phase.id,
          isLocked: false, // Calculated below
          status: status,
          items: [],
        };
      });

      // Sequential Unlocking Logic
      for (let i = 0; i < roadmap.length; i++) {
        if (i === 0) {
          roadmap[i].isLocked = false;
          roadmap[i].status =
            roadmap[i].progress > 0 || roadmap[i].status === "completed"
              ? roadmap[i].status
              : "in_progress";
          // Always active if not completed
        } else {
          const prev = roadmap[i - 1];
          // Unlock if previous is completed OR if current is started
          if (prev.progress === 100 || roadmap[i].progress > 0) {
            roadmap[i].isLocked = false;
            if (roadmap[i].status === "locked") roadmap[i].status = "in_progress";
          } else {
            roadmap[i].isLocked = true;
            roadmap[i].status = "locked";
            roadmap[i].progress = 0; // Force 0 visual if locked
          }
        }
      }

      return {
        modules: roadmap,
        diagnostic: { isCompleted: true }, // Legacy/Stub
      };
    }),
});
