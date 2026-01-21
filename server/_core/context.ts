import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { createClerkClient, getAuth } from "@clerk/express";
import { upsertUserFromClerk } from "../db";

// Initialize Clerk client for backend API calls
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const auth = getAuth(opts.req);

  if (!auth.userId) {
    return { req: opts.req, res: opts.res, user: null };
  }

  // Fetch full user data from Clerk to sync email, name, etc.
  let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>> | null =
    null;
  try {
    clerkUser = await clerkClient.users.getUser(auth.userId);
  } catch (error) {
    console.warn("[Context] Failed to fetch Clerk user:", error);
  }

  // Sync user from Clerk to local DB with full user data
  const user = await upsertUserFromClerk(auth.userId, clerkUser ?? undefined);

  return {
    req: opts.req,
    res: opts.res,
    user: user ?? null,
  };
}
