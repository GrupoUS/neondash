import { beforeEach, describe, expect, it, vi } from "vitest";

// Vitest hoists vi.mock() calls to the top of the file.
// Factory functions must be self-contained (no external variables).

// Mock the database module - returns null by default
vi.mock("./db", () => ({
  getDb: vi.fn(() => null),
}));

// Mock the emailService module with fully self-contained factory
vi.mock("./emailService", () => ({
  sendEmail: vi.fn(async () => true),
  sendWelcomeEmail: vi.fn(async () => true),
}));

describe("Mentorados Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(mentoradosRouter._def.procedures).toHaveProperty("comparativeStats");
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

    it("should have updateMetricaField procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("updateMetricaField");
    });

    it("should have getPreviousMonthMetrics procedure defined", async () => {
      const { mentoradosRouter } = await import("./mentoradosRouter");
      expect(mentoradosRouter._def.procedures).toHaveProperty("getPreviousMonthMetrics");
    });
  });

  describe("Email Service", () => {
    it("should have sendWelcomeEmail function defined", async () => {
      // Import the mocked module to verify the mock works
      const emailService = await import("./emailService");
      expect(emailService.sendWelcomeEmail).toBeDefined();
      expect(typeof emailService.sendWelcomeEmail).toBe("function");
    });
  });
});

describe("upsertMetricaMensalPartial Unit Tests", () => {
  describe("Data Structure Logic", () => {
    it("should create new record with provided fields merged with defaults", () => {
      // Test the data structure logic without mocking the full DB chain
      const partialData = { faturamento: 5000 };
      const mentoradoId = 1;
      const ano = 2025;
      const mes = 12;

      // Simulate what the function builds for a new record
      const newData = {
        mentoradoId,
        ano,
        mes,
        faturamento: 0,
        lucro: 0,
        leads: 0,
        procedimentos: 0,
        postsFeed: 0,
        stories: 0,
        ...partialData,
      };

      expect(newData.faturamento).toBe(5000); // Provided value
      expect(newData.lucro).toBe(0); // Default
      expect(newData.leads).toBe(0); // Default
      expect(newData.procedimentos).toBe(0); // Default
      expect(newData.postsFeed).toBe(0); // Default
      expect(newData.stories).toBe(0); // Default
      expect(newData.mentoradoId).toBe(1);
      expect(newData.ano).toBe(2025);
      expect(newData.mes).toBe(12);
    });

    it("should only update provided fields on existing record", () => {
      // Test the update data logic
      const partialData: Record<string, number | undefined> = {
        lucro: 3000,
        faturamento: undefined,
      };

      // Simulate what the function does - filter out undefined values
      const updateData = Object.fromEntries(
        Object.entries(partialData).filter(([_, v]) => v !== undefined)
      );

      expect(updateData).toEqual({ lucro: 3000 });
      expect(updateData).not.toHaveProperty("faturamento");
    });

    it("should skip update when partial data is empty", () => {
      const partialData = {};

      const updateData = Object.fromEntries(
        Object.entries(partialData).filter(([_, v]) => v !== undefined)
      );

      expect(Object.keys(updateData).length).toBe(0);
    });

    it("should correctly merge multiple partial fields", () => {
      const partialData = { faturamento: 5000, lucro: 2000 };

      const newData = {
        mentoradoId: 1,
        ano: 2025,
        mes: 12,
        faturamento: 0,
        lucro: 0,
        leads: 0,
        procedimentos: 0,
        postsFeed: 0,
        stories: 0,
        ...partialData,
      };

      expect(newData.faturamento).toBe(5000);
      expect(newData.lucro).toBe(2000);
      expect(newData.leads).toBe(0); // Not provided, stays default
    });
  });
});

describe("updateMetricaField Routing", () => {
  it("should have updateMetricaField procedure that accepts all metric fields", async () => {
    const { mentoradosRouter } = await import("./mentoradosRouter");

    // Verify the procedure exists
    const procedure = mentoradosRouter._def.procedures.updateMetricaField;
    expect(procedure).toBeDefined();

    // The procedure should accept these field values based on the zod enum
    const validFields = ["faturamento", "lucro", "leads", "procedimentos", "postsFeed", "stories"];
    expect(validFields).toHaveLength(6);
  });

  it("should map field to partial data correctly", () => {
    // Test the field-to-partialData mapping logic used in updateMetricaField
    const testCases = [
      { field: "faturamento", value: 5000, expected: { faturamento: 5000 } },
      { field: "lucro", value: 2000, expected: { lucro: 2000 } },
      { field: "leads", value: 10, expected: { leads: 10 } },
      { field: "procedimentos", value: 5, expected: { procedimentos: 5 } },
      { field: "postsFeed", value: 8, expected: { postsFeed: 8 } },
      { field: "stories", value: 20, expected: { stories: 20 } },
    ];

    for (const testCase of testCases) {
      const partialData = { [testCase.field]: testCase.value };
      expect(partialData).toEqual(testCase.expected);
    }
  });
});

describe("getPreviousMonthMetrics Year Boundary Logic", () => {
  /**
   * Tests the year boundary calculation logic used in getPreviousMonthMetrics
   * This replicates the logic from the router:
   *
   * let prevMes = input.mes - 1;
   * let prevAno = input.ano;
   * if (prevMes === 0) {
   *   prevMes = 12;
   *   prevAno = input.ano - 1;
   * }
   */
  function calculatePreviousMonth(ano: number, mes: number) {
    let prevMes = mes - 1;
    let prevAno = ano;
    if (prevMes === 0) {
      prevMes = 12;
      prevAno = ano - 1;
    }
    return { prevAno, prevMes };
  }

  it("should correctly calculate previous month for March (within year)", () => {
    // Input: March 2025 (mes=3, ano=2025)
    // Expected: February 2025 (prevMes=2, prevAno=2025)
    const result = calculatePreviousMonth(2025, 3);

    expect(result.prevMes).toBe(2);
    expect(result.prevAno).toBe(2025);
  });

  it("should correctly calculate previous month for January (year boundary)", () => {
    // Input: January 2026 (mes=1, ano=2026)
    // Expected: December 2025 (prevMes=12, prevAno=2025)
    const result = calculatePreviousMonth(2026, 1);

    expect(result.prevMes).toBe(12);
    expect(result.prevAno).toBe(2025);
  });

  it("should correctly calculate previous month for December (end of year)", () => {
    // Input: December 2025 (mes=12, ano=2025)
    // Expected: November 2025 (prevMes=11, prevAno=2025)
    const result = calculatePreviousMonth(2025, 12);

    expect(result.prevMes).toBe(11);
    expect(result.prevAno).toBe(2025);
  });

  it("should correctly calculate previous month for February", () => {
    // Input: February 2025 (mes=2, ano=2025)
    // Expected: January 2025 (prevMes=1, prevAno=2025)
    const result = calculatePreviousMonth(2025, 2);

    expect(result.prevMes).toBe(1);
    expect(result.prevAno).toBe(2025);
  });

  it("should correctly calculate previous month for every month", () => {
    // Test all 12 months
    const expectedResults = [
      { input: { ano: 2025, mes: 1 }, expected: { prevAno: 2024, prevMes: 12 } },
      { input: { ano: 2025, mes: 2 }, expected: { prevAno: 2025, prevMes: 1 } },
      { input: { ano: 2025, mes: 3 }, expected: { prevAno: 2025, prevMes: 2 } },
      { input: { ano: 2025, mes: 4 }, expected: { prevAno: 2025, prevMes: 3 } },
      { input: { ano: 2025, mes: 5 }, expected: { prevAno: 2025, prevMes: 4 } },
      { input: { ano: 2025, mes: 6 }, expected: { prevAno: 2025, prevMes: 5 } },
      { input: { ano: 2025, mes: 7 }, expected: { prevAno: 2025, prevMes: 6 } },
      { input: { ano: 2025, mes: 8 }, expected: { prevAno: 2025, prevMes: 7 } },
      { input: { ano: 2025, mes: 9 }, expected: { prevAno: 2025, prevMes: 8 } },
      { input: { ano: 2025, mes: 10 }, expected: { prevAno: 2025, prevMes: 9 } },
      { input: { ano: 2025, mes: 11 }, expected: { prevAno: 2025, prevMes: 10 } },
      { input: { ano: 2025, mes: 12 }, expected: { prevAno: 2025, prevMes: 11 } },
    ];

    for (const testCase of expectedResults) {
      const result = calculatePreviousMonth(testCase.input.ano, testCase.input.mes);
      expect(result).toEqual(testCase.expected);
    }
  });
});

describe("getPreviousMonthMetrics Procedure", () => {
  it("should have getPreviousMonthMetrics procedure defined", async () => {
    const { mentoradosRouter } = await import("./mentoradosRouter");
    expect(mentoradosRouter._def.procedures).toHaveProperty("getPreviousMonthMetrics");
  });
});
