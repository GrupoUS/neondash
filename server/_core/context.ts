import { createClerkClient, getAuth } from "@clerk/express";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { eq } from "drizzle-orm";
import { type Mentorado, mentorados, type User, users } from "../../drizzle/schema";
import { getDb, upsertUserFromClerk } from "../db";
import { createLogger, generateRequestId } from "./logger";
import { getCachedSession, invalidateSession, setCachedSession } from "./sessionCache";

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

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const auth = getAuth(opts.req);
  const requestId = generateRequestId();
  const logger = createLogger({
    userId: auth.userId,
    requestId,
    service: "context",
  });

  if (!auth.userId) {
    return { req: opts.req, res: opts.res, user: null, mentorado: null };
  }

  const db = getDb();
  let cacheHit = false;

  // Check session cache first
  const cachedSession = await getCachedSession(auth.userId);

  let user: User | null = null;
  let mentorado: Mentorado | null = null;

  if (cachedSession) {
    cacheHit = true;
    // Cache hit: fetch user+mentorado with a single join query
    const result = await db
      .select({
        user: users,
        mentorado: mentorados,
      })
      .from(users)
      .leftJoin(mentorados, eq(users.id, mentorados.userId))
      .where(eq(users.clerkId, auth.userId))
      .limit(1);

    if (result[0]) {
      user = result[0].user;
      mentorado = result[0].mentorado;
    }

    // AT-002: Verify mentorado exists even on cache hit
    if (user && !mentorado) {
      logger.info("cache_hit_no_mentorado", {
        userId: user.id,
        clerkId: auth.userId,
      });

      // Try to auto-create mentorado for cache hit with missing mentorado
      try {
        const [newMentorado] = await db
          .insert(mentorados)
          .values({
            userId: user.id,
            nomeCompleto: user.name || "Novo Usuário",
            email: user.email,
            fotoUrl: user.imageUrl,
            turma: "neon",
            ativo: "sim",
            metaFaturamento: 16000,
            metaLeads: 50,
            metaProcedimentos: 10,
            metaPosts: 12,
            metaStories: 60,
          })
          .returning();

        mentorado = newMentorado;
        logger.info("mentorado_created_cache_hit", {
          mentoradoId: newMentorado?.id,
          userId: user.id,
        });

        // AT-001: Invalidate cache after creating mentorado
        await invalidateSession(auth.userId);
        logger.info("session_cache_invalidated", {
          clerkId: auth.userId,
          reason: "mentorado_created",
        });
      } catch (error) {
        logger.error("mentorado_creation_failed_cache_hit", error, {
          userId: user.id,
          email: user.email,
        });
      }
    }
  } else {
    // Cache miss: fetch from Clerk and sync
    let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>> | null = null;
    try {
      clerkUser = await clerkClient.users.getUser(auth.userId);
    } catch (error) {
      logger.warn("clerk_fetch_failed", error);
    }

    // Sync user from Clerk to local DB with full user data
    user = await upsertUserFromClerk(auth.userId, clerkUser ?? undefined);

    if (user) {
      // Cache the session for future requests
      await setCachedSession(auth.userId, {
        clerkId: auth.userId,
        email: user.email ?? null,
        name: user.name ?? null,
        role: user.role,
        imageUrl: user.imageUrl ?? null,
      });

      // Fetch mentorado with optimized query
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
          logger.info("auto_link_mentorado", {
            mentoradoId: mentoradoByEmail[0].id,
            userId: user.id,
          });

          // Link the user to the mentorado and mark onboarding as complete
          await db
            .update(mentorados)
            .set({ userId: user.id, onboardingCompleted: "sim" })
            .where(eq(mentorados.id, mentoradoByEmail[0].id));

          mentorado = { ...mentoradoByEmail[0], userId: user.id, onboardingCompleted: "sim" };
        } else {
          // Auto-create mentorado if not found
          logger.info("auto_create_mentorado", {
            userId: user.id,
            email: user.email,
          });

          try {
            const [newMentorado] = await db
              .insert(mentorados)
              .values({
                userId: user.id,
                nomeCompleto: user.name || "Novo Usuário",
                email: user.email,
                fotoUrl: user.imageUrl,
                turma: "neon", // Default value
                ativo: "sim",
                metaFaturamento: 16000,
                metaLeads: 50,
                metaProcedimentos: 10,
                metaPosts: 12,
                metaStories: 60,
              })
              .returning();

            mentorado = newMentorado;
            logger.info("mentorado_created", {
              mentoradoId: newMentorado?.id,
              userId: user.id,
            });

            // AT-001: Invalidate cache after creating mentorado
            await invalidateSession(auth.userId);
            logger.info("session_cache_invalidated", {
              clerkId: auth.userId,
              reason: "mentorado_created",
            });
          } catch (error) {
            logger.error("mentorado_creation_failed", error, {
              userId: user.id,
              email: user.email,
            });
          }
        }
      }
    }
  }

  logger.info("context_created", {
    cacheHit,
    hasUser: !!user,
    hasMentorado: !!mentorado,
    userId: user?.id,
    userRole: user?.role,
    mentoradoId: mentorado?.id,
  });

  return {
    req: opts.req,
    res: opts.res,
    user: user ?? null,
    mentorado: mentorado,
  };
}
