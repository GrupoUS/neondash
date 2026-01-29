import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { mentorados, users } from "../../drizzle/schema";
import { eq, isNull, and } from "drizzle-orm";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  /**
   * Syncs the logged-in user with the mentorados table using email.
   * Note: The 'createContext' middleware already handles auto-linking and auto-creation.
   * This mutation serves as a manual trigger/verification and can handle edge cases if needed.
   */
  syncUser: protectedProcedure.mutation(async ({ ctx }) => {
    // User is guaranteed to exist due to protectedProcedure
    const user = ctx.user!;
    const db = getDb();

    // If already linked in context, return success
    if (ctx.mentorado) {
      return { 
        success: true, 
        linked: true, 
        user, 
        mentoradoId: ctx.mentorado.id,
        message: "Already linked"
      };
    }

    // Attempt manual link if context missed it (e.g. race condition or email mismatch handled elsewhere)
    console.log(`[Auth] Manual sync requested for user ${user.id} (${user.email})`);

    let linked = false;
    let mentoradoId = null;

    if (user.email) {
      // Find unlinked mentorado with same email
      const existingMentorado = await db.query.mentorados.findFirst({
        where: and(
            eq(mentorados.email, user.email),
            isNull(mentorados.userId)
        )
      });

      if (existingMentorado) {
        await db.update(mentorados)
            .set({ userId: user.id })
            .where(eq(mentorados.id, existingMentorado.id));
        
        linked = true;
        mentoradoId = existingMentorado.id;
      }
    }

    return { 
        success: true, 
        linked, 
        user,
        mentoradoId,
        message: linked ? "Linked successfully" : "No matching unlinked mentorado found"
    };
  }),
});
