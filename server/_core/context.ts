import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { eq } from "drizzle-orm";
import { type Mentorado, type User, mentorados } from "../../drizzle/schema";
import { createClerkClient, getAuth } from "@clerk/express";
import { getDb, upsertUserFromClerk } from "../db";

// Initialize Clerk client for backend API calls
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  mentorado: Mentorado | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const auth = getAuth(opts.req);

  if (!auth.userId) {
    return { req: opts.req, res: opts.res, user: null, mentorado: null };
  }

  // Fetch full user data from Clerk to sync email, name, etc.
  let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>> | null =
    null;
  try {
    clerkUser = await clerkClient.users.getUser(auth.userId);
  } catch (error) {
    console.warn("[Context] Failed to fetch Clerk user:", error);
  }

  const db = getDb();
  // Sync user from Clerk to local DB with full user data
  const user = await upsertUserFromClerk(auth.userId, clerkUser ?? undefined);

  let mentorado: Mentorado | null = null;
  if (user) {
    const existingMentorado = await db
      .select()
      .from(mentorados)
      .where(eq(mentorados.userId, user.id))
      .limit(1);
    
    mentorado = existingMentorado[0] ?? null;

    // Auto-link: If no mentorado found by userId but user has email, try to find by email
    if (!mentorado && user.email) {
      const mentoradoByEmail = await db
        .select()
        .from(mentorados)
        .where(eq(mentorados.email, user.email))
        .limit(1);

      if (mentoradoByEmail[0]) {
        console.log(`[Context] Auto-linking mentorado ${mentoradoByEmail[0].id} to user ${user.id}`);
        // Link the user to the mentorado
        await db
          .update(mentorados)
          .set({ userId: user.id })
          .where(eq(mentorados.id, mentoradoByEmail[0].id));
        
        mentorado = { ...mentoradoByEmail[0], userId: user.id };
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user: user ?? null,
    mentorado: mentorado,
  };
}
