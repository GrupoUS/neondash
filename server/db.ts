import { eq } from "drizzle-orm";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";
import * as relations from "../drizzle/relations";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true; // Enable connection caching

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get database instance with lazy initialization
 * Uses HTTP driver (stateless, best for serverless)
 */
export function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.error("[Database] DATABASE_URL is not configured!");
      throw new Error("DATABASE_URL is required");
    }

    try {
      const sql = neon(connectionString);
      // @ts-expect-error Drizzle schema typing with relations can be strict, casting if needed
      _db = drizzle(sql, {
        schema: { ...schema, ...relations },
        logger: process.env.NODE_ENV === "development",
      });
      console.log("[Database] Connected to Neon PostgreSQL");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
    }
  }

  if (!_db) {
    throw new Error("Failed to initialize database connection");
  }

  return _db;
}

/**
 * Health check for database connection
 */
export async function checkDbHealth(): Promise<boolean> {
  try {
    const db = getDb();
    await db.execute("SELECT 1");
    return true;
  } catch (error) {
    console.error("[Database] Health check failed:", error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USER OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

const { users } = schema;

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkId: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Upsert user from Clerk webhook/session
 * Accepts the full Clerk User object to extract email, name, imageUrl, and login method
 */
export async function upsertUserFromClerk(
  clerkUserId: string,
  clerkUser?: {
    emailAddresses?: Array<{ emailAddress: string }>;
    fullName?: string | null;
    firstName?: string | null;
    imageUrl?: string | null;
    externalAccounts?: Array<{ provider: string }>;
  }
) {
  const db = getDb();

  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
  const name = clerkUser?.fullName ?? clerkUser?.firstName ?? null;
  const imageUrl = clerkUser?.imageUrl ?? null;
  const loginMethod = clerkUser?.externalAccounts?.[0]?.provider ?? "email";

  // Check if user should be admin
  const adminEmails = (process.env.ADMIN_EMAILS ?? "msm.jur@gmail.com").split(
    ","
  );
  const isAdmin = email && adminEmails.includes(email.trim());

  const values: schema.InsertUser = {
    clerkId: clerkUserId,
    email,
    name,
    imageUrl,
    loginMethod,
    role: isAdmin ? "admin" : "user",
    lastSignedIn: new Date(),
  };

  try {
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: values.email,
          name: values.name,
          imageUrl: values.imageUrl,
          loginMethod: values.loginMethod,
          lastSignedIn: values.lastSignedIn,
          // Don't override role on update (preserve admin status)
        },
      });

    return await getUserByClerkId(clerkUserId);
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Re-export schema types for convenience
export type { User, InsertUser } from "../drizzle/schema";
export { schema };
