import { createClerkClient, getAuth } from "@clerk/express";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { eq } from "drizzle-orm";
import { type Mentorado, mentorados, type User, users } from "../../drizzle/schema";
import { getDb, upsertUserFromClerk } from "../db";
import { createLogger, generateRequestId, type Logger } from "./logger";
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

// Default values for new mentorados
const DEFAULT_MENTORADO_VALUES = {
  turma: "neon" as const,
  ativo: "sim" as const,
  metaFaturamento: 16000,
  metaLeads: 50,
  metaProcedimentos: 10,
  metaPosts: 12,
  metaStories: 60,
};

/**
 * Creates a new mentorado for a user
 */
async function createMentoradoForUser(
  user: User,
  clerkId: string,
  logger: Logger
): Promise<Mentorado | null> {
  const db = getDb();

  try {
    const [newMentorado] = await db
      .insert(mentorados)
      .values({
        userId: user.id,
        nomeCompleto: user.name || "Novo Usuário",
        email: user.email,
        fotoUrl: user.imageUrl,
        ...DEFAULT_MENTORADO_VALUES,
      })
      .returning();

    logger.info("mentorado_created", {
      mentoradoId: newMentorado?.id,
      userId: user.id,
    });

    // Invalidate cache after creating mentorado
    await invalidateSession(clerkId);
    logger.info("session_cache_invalidated", {
      clerkId,
      reason: "mentorado_created",
    });

    return newMentorado;
  } catch (error) {
    logger.error("mentorado_creation_failed", error, {
      userId: user.id,
      email: user.email,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : "Unknown",
    });
    return null;
  }
}

/**
 * Tries to auto-link a mentorado by email
 */
async function tryAutoLinkByEmail(user: User, logger: Logger): Promise<Mentorado | null> {
  if (!user.email) return null;

  const db = getDb();
  const mentoradoByEmail = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.email, user.email))
    .limit(1);

  if (!mentoradoByEmail[0]) return null;

  logger.info("auto_link_mentorado", {
    mentoradoId: mentoradoByEmail[0].id,
    userId: user.id,
  });

  // Link the user to the mentorado and mark onboarding as complete
  await db
    .update(mentorados)
    .set({ userId: user.id, onboardingCompleted: "sim" })
    .where(eq(mentorados.id, mentoradoByEmail[0].id));

  return { ...mentoradoByEmail[0], userId: user.id, onboardingCompleted: "sim" };
}

/**
 * Handles cache hit scenario - fetches user and mentorado from DB
 */
async function handleCacheHit(
  clerkId: string,
  logger: Logger
): Promise<{ user: User | null; mentorado: Mentorado | null }> {
  const db = getDb();

  const result = await db
    .select({
      user: users,
      mentorado: mentorados,
    })
    .from(users)
    .leftJoin(mentorados, eq(users.id, mentorados.userId))
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  const user = result[0]?.user ?? null;
  let mentorado = result[0]?.mentorado ?? null;

  // Verify mentorado exists even on cache hit
  if (user && !mentorado) {
    logger.info("cache_hit_no_mentorado", {
      userId: user.id,
      clerkId,
    });

    mentorado = await createMentoradoForUser(user, clerkId, logger);
  }

  return { user, mentorado };
}

/**
 * Handles cache miss scenario - syncs from Clerk and creates mentorado if needed
 */
async function handleCacheMiss(
  clerkId: string,
  logger: Logger
): Promise<{ user: User | null; mentorado: Mentorado | null }> {
  const db = getDb();

  // Fetch from Clerk
  let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>> | null = null;
  try {
    clerkUser = await clerkClient.users.getUser(clerkId);
  } catch (error) {
    logger.warn("clerk_fetch_failed", error);
  }

  // Sync user from Clerk to local DB
  const user = await upsertUserFromClerk(clerkId, clerkUser ?? undefined);
  if (!user) return { user: null, mentorado: null };

  // Cache the session for future requests
  await setCachedSession(clerkId, {
    clerkId,
    email: user.email ?? null,
    name: user.name ?? null,
    role: user.role,
    imageUrl: user.imageUrl ?? null,
  });

  // Fetch existing mentorado
  const existingMentorado = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.userId, user.id))
    .limit(1);

  let mentorado: Mentorado | null = existingMentorado[0] ?? null;

  logger.info("mentorado_fetch_result", {
    userId: user.id,
    hasMentorado: !!mentorado,
    hasEmail: !!user.email,
    userEmail: user.email,
  });

  // Auto-create mentorado if not found
  if (!mentorado) {
    // Try to auto-link by email first
    mentorado = await tryAutoLinkByEmail(user, logger);

    // Create new mentorado if still not found
    if (!mentorado) {
      logger.info("auto_create_mentorado", {
        userId: user.id,
        hasEmail: !!user.email,
        userEmail: user.email,
      });

      mentorado = await createMentoradoForUser(user, clerkId, logger);
    }
  }

  return { user, mentorado };
}

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

  // Check session cache first
  const cachedSession = await getCachedSession(auth.userId);
  const cacheHit = !!cachedSession;

  const { user, mentorado } = cachedSession
    ? await handleCacheHit(auth.userId, logger)
    : await handleCacheMiss(auth.userId, logger);

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
