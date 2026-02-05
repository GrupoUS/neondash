import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

// Mock email service (must be before appRouter import)
vi.mock("./emailService", () => ({
  sendEmail: vi.fn(() => Promise.resolve(true)),
  getEmailTemplate: vi.fn(() => "<html>mock email</html>"),
  sendWelcomeEmail: vi.fn(() => Promise.resolve(true)),
}));

// Mock notification service
vi.mock("./services/notificationService", () => ({
  notificationService: {
    sendBadgeUnlocked: vi.fn(() => Promise.resolve({ inAppSuccess: true, emailSuccess: true })),
    sendMetricsReminder: vi.fn(() => Promise.resolve({ inAppSuccess: true, emailSuccess: true })),
  },
}));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    clerkId: "clerk_sample_user",
    email: "sample@example.com",
    name: "Sample User",
    imageUrl: "https://example.com/avatar.png",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    mentorado: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.me", () => {
  it("returns the authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.clerkId).toBe("clerk_sample_user");
  });
});
