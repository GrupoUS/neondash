import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock the database module
mock.module("./db", () => ({
  getDb: mock(() => null),
}));

describe("Mentorados Router", () => {
  beforeEach(() => {
    // Clear mocks if needed in the future
  });

  describe("CRUD Operations", () => {
    it("should have createNew procedure defined", async () => {
      // Import the router to verify it compiles and exports correctly
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter).toBeDefined();
      expect(mentoradosRouter._def.procedures).toHaveProperty("createNew");
    });

    it("should have update procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("update");
    });

    it("should have delete procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("delete");
    });

    it("should have comparativeStats procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty(
        "comparativeStats"
      );
    });

    it("should have linkEmail procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("linkEmail");
    });

    it("should have list procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("list");
    });

    it("should have me procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("me");
    });

    it("should have metricas procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("metricas");
    });

    it("should have submitMetricas procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("submitMetricas");
    });

    it("should have feedback procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("feedback");
    });

    it("should have submitFeedback procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("submitFeedback");
    });
  });

  describe("Email Service", () => {
    it("should have sendWelcomeEmail function defined", async () => {
      const { sendWelcomeEmail } = await import("./emailService");
      expect(sendWelcomeEmail).toBeDefined();
      expect(typeof sendWelcomeEmail).toBe("function");
    });
  });
});
