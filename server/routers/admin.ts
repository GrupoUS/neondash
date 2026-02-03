import { eq } from "drizzle-orm";
import { z } from "zod";
import { systemSettings } from "../../drizzle/schema";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const adminRouter = router({
  getSetting: adminProcedure.input(z.object({ key: z.string() })).query(async ({ ctx, input }) => {
    const db = getDb();
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, input.key),
    });
    return setting;
  }),

  updateSetting: adminProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, input.key),
      });

      if (existing) {
        return await db
          .update(systemSettings)
          .set({
            value: input.value,
            description: input.description,
            updatedAt: new Date(),
          })
          .where(eq(systemSettings.key, input.key))
          .returning();
      } else {
        return await db
          .insert(systemSettings)
          .values({
            key: input.key,
            value: input.value,
            description: input.description,
          })
          .returning();
      }
    }),
});
