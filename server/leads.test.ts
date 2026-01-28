import { describe, it, expect, mock } from "bun:test";

// Mock the database module
mock.module("./db", () => ({
  getDb: mock(() => null),
}));

describe("Leads Router", () => {
    it("should have CRUD procedures defined", async () => {
        const { leadsRouter } = await import("./leadsRouter");
        expect(leadsRouter._def.procedures).toHaveProperty("list");
        expect(leadsRouter._def.procedures).toHaveProperty("getById");
        expect(leadsRouter._def.procedures).toHaveProperty("create");
        expect(leadsRouter._def.procedures).toHaveProperty("update");
        expect(leadsRouter._def.procedures).toHaveProperty("delete");
    });

    it("should have specialized procedures defined", async () => {
        const { leadsRouter } = await import("./leadsRouter");
        expect(leadsRouter._def.procedures).toHaveProperty("updateStatus");
        expect(leadsRouter._def.procedures).toHaveProperty("addInteraction");
        expect(leadsRouter._def.procedures).toHaveProperty("stats");
    });
});
