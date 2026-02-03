import { beforeEach, describe, expect, it, vi } from "vitest";

// Vitest hoists vi.mock() calls to the top of the file.
// Factory functions must be self-contained (no external variables).

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(() => null),
}));

// Mock the emailService module
vi.mock("./emailService", () => ({
  sendEmail: vi.fn(async () => true),
  sendWelcomeEmail: vi.fn(async () => true),
}));

// Mock the instagramService module
vi.mock("./services/instagramService", () => ({
  instagramService: {
    isInstagramConfigured: vi.fn(() => true),
    getAuthUrl: vi.fn((mentoradoId: number) => `https://instagram.com/oauth?state=${mentoradoId}`),
    exchangeCodeForTokens: vi.fn(async () => ({
      access_token: "short_lived_token",
      token_type: "bearer",
    })),
    exchangeForLongLivedToken: vi.fn(async () => ({
      access_token: "long_lived_token",
      token_type: "bearer",
      expires_in: 5184000, // 60 days
    })),
    validateBusinessAccount: vi.fn(async () => ({
      isValid: true,
      accountId: "123456789",
      accountType: "business",
    })),
    upsertInstagramToken: vi.fn(async () => ({})),
    revokeAccess: vi.fn(async () => true),
    getInstagramToken: vi.fn(async () => null),
    deleteInstagramToken: vi.fn(async () => true),
    syncMentoradoMetrics: vi.fn(async () => ({
      success: true,
      status: "success",
      postsCount: 10,
      storiesCount: 20,
    })),
    syncAllMentorados: vi.fn(async () => ({
      totalMentorados: 1,
      successful: 1,
      failed: 0,
      partial: 0,
      errors: [],
    })),
  },
}));

describe("Instagram Integration Router", () => {
  beforeEach(() => {
    // Clear mocks between tests
    vi.clearAllMocks();
  });

  describe("Procedure Definitions", () => {
    it("should have connectInstagram procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter).toBeDefined();
      expect(mentoradosRouter._def.procedures).toHaveProperty("connectInstagram");
    });

    it("should have instagramCallback procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("instagramCallback");
    });

    it("should have getInstagramMetrics procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("getInstagramMetrics");
    });

    it("should have disconnectInstagram procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("disconnectInstagram");
    });
  });

  describe("Procedure Types", () => {
    it("connectInstagram should be a mutation", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      const procedure = mentoradosRouter._def.procedures.connectInstagram;
      expect(procedure).toBeDefined();
      expect(procedure._def.type).toBe("mutation");
    });

    it("instagramCallback should be a mutation", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      const procedure = mentoradosRouter._def.procedures.instagramCallback;
      expect(procedure).toBeDefined();
      expect(procedure._def.type).toBe("mutation");
    });

    it("getInstagramMetrics should be a query", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      const procedure = mentoradosRouter._def.procedures.getInstagramMetrics;
      expect(procedure).toBeDefined();
      expect(procedure._def.type).toBe("query");
    });

    it("disconnectInstagram should be a mutation", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      const procedure = mentoradosRouter._def.procedures.disconnectInstagram;
      expect(procedure).toBeDefined();
      expect(procedure._def.type).toBe("mutation");
    });
  });

  describe("Instagram Service Mock Verification", () => {
    it("should have instagramService mocked correctly", async () => {
      const { instagramService } = await import("./services/instagramService");
      expect(instagramService).toBeDefined();
      expect(typeof instagramService.isInstagramConfigured).toBe("function");
      expect(typeof instagramService.getAuthUrl).toBe("function");
      expect(typeof instagramService.exchangeCodeForTokens).toBe("function");
      expect(typeof instagramService.exchangeForLongLivedToken).toBe("function");
      expect(typeof instagramService.validateBusinessAccount).toBe("function");
      expect(typeof instagramService.upsertInstagramToken).toBe("function");
      expect(typeof instagramService.revokeAccess).toBe("function");
    });
  });
});

describe("Instagram Client Router (instagramRouter)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have saveToken procedure defined", async () => {
    const { instagramRouter } = await import("./instagramRouter");
    expect(instagramRouter._def.procedures).toHaveProperty("saveToken");
  });

  it("saveToken should be a mutation", async () => {
    const { instagramRouter } = await import("./instagramRouter");
    const procedure = instagramRouter._def.procedures.saveToken;
    expect(procedure._def.type).toBe("mutation");
  });

  // We can't easily test the internal implementation (calls to service) without calling the procedure,
  // which requires a full tRPC context mock. For now, we verify structure.
  // The integration verification will happen via 'bun test' on the full suite if possible,
  // but here we are checking definitions.
});
