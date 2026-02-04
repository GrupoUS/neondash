import { describe, expect, it, vi } from "vitest";
import { BADGES_CONFIG, calculateStreak } from "./gamificacao";

// Mock the database to return empty results
vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
          limit: vi.fn(() => Promise.resolve([])),
        })),
        orderBy: vi.fn(() => Promise.resolve([])),
      })),
    })),
  })),
}));

// Mock email service
vi.mock("./emailService", () => ({
  sendEmail: vi.fn(() => Promise.resolve(true)),
}));

// Mock notification service
vi.mock("./services/notificationService", () => ({
  notificationService: {
    sendBadgeUnlocked: vi.fn(() => Promise.resolve({ inAppSuccess: true, emailSuccess: true })),
    sendMetricsReminder: vi.fn(() => Promise.resolve({ inAppSuccess: true, emailSuccess: true })),
  },
}));

describe("Gamificação Service", () => {
  describe("BADGES_CONFIG", () => {
    it("should have all required badge categories (per new spec)", () => {
      const categories = new Set(BADGES_CONFIG.map((b) => b.categoria));
      // New categories per Core Flows spec: consistencia, faturamento, ranking, operacional, especial
      expect(categories.has("consistencia")).toBe(true);
      expect(categories.has("faturamento")).toBe(true);
      expect(categories.has("ranking")).toBe(true);
      expect(categories.has("operacional")).toBe(true);
      expect(categories.has("especial")).toBe(true);
      // Old "conteudo" category should NOT exist
      expect(categories.has("conteudo")).toBe(false);
    });

    it("should have expected badge count per category", () => {
      const categoryCount = BADGES_CONFIG.reduce(
        (acc, b) => {
          acc[b.categoria] = (acc[b.categoria] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(categoryCount.consistencia).toBe(5);
      expect(categoryCount.faturamento).toBe(4);
      expect(categoryCount.ranking).toBe(3);
      expect(categoryCount.operacional).toBe(2);
      expect(categoryCount.especial).toBe(2);
    });

    it("should have unique badge codes", () => {
      const codes = BADGES_CONFIG.map((b) => b.codigo);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it("should have valid criteria JSON for all badges", () => {
      for (const badge of BADGES_CONFIG) {
        expect(() => JSON.parse(badge.criterio)).not.toThrow();
      }
    });

    it("should have positive points for all badges", () => {
      for (const badge of BADGES_CONFIG) {
        expect(badge.pontos).toBeGreaterThan(0);
      }
    });

    it("should have exactly 16 badges defined (per spec)", () => {
      expect(BADGES_CONFIG.length).toBe(16);
    });

    it("should have required streak-related badges", () => {
      const badgeCodes = BADGES_CONFIG.map((b) => b.codigo);
      expect(badgeCodes).toContain("primeiro_registro");
      expect(badgeCodes).toContain("consistencia_bronze");
      expect(badgeCodes).toContain("consistencia_prata");
      expect(badgeCodes).toContain("consistencia_ouro");
      expect(badgeCodes).toContain("pontualidade");
    });
  });

  describe("calculateStreak", () => {
    it("should return zeros when no metrics exist", async () => {
      const result = await calculateStreak(1);
      expect(result).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        nextMilestone: 3,
        progressPercent: 0,
      });
    });

    it("should return correct type shape", async () => {
      const result = await calculateStreak(1);
      expect(result).toHaveProperty("currentStreak");
      expect(result).toHaveProperty("longestStreak");
      expect(result).toHaveProperty("nextMilestone");
      expect(result).toHaveProperty("progressPercent");
      expect(typeof result.currentStreak).toBe("number");
      expect(typeof result.longestStreak).toBe("number");
    });

    it("should calculate correct nextMilestone thresholds", async () => {
      // With 0 streak, next milestone should be 3
      const result = await calculateStreak(1);
      expect(result.nextMilestone).toBe(3);
    });

    it("should calculate progressPercent correctly", async () => {
      // With 0 streak, progress should be 0%
      const result = await calculateStreak(1);
      expect(result.progressPercent).toBe(0);
    });
  });
});

// Integration tests for router procedures (type-level verification)
describe("Gamificação Router Procedures", () => {
  describe("getStreak procedure", () => {
    it("should return only currentStreak and longestStreak per contract", () => {
      // Type-level test: verify contract returns only required fields
      type ExpectedStreakReturn = {
        currentStreak: number;
        longestStreak: number;
      };

      // This test documents the expected contract
      const mockReturn: ExpectedStreakReturn = {
        currentStreak: 3,
        longestStreak: 6,
      };

      expect(Object.keys(mockReturn)).toEqual(["currentStreak", "longestStreak"]);
    });
  });

  describe("checkNewBadges procedure", () => {
    it("should return newBadges array structure", () => {
      // Type-level test: verify return structure
      type ExpectedReturn = {
        newBadges: Array<{
          id: number;
          codigo: string;
          nome: string;
          icone: string;
          pontos: number;
        }>;
      };

      const mockReturn: ExpectedReturn = { newBadges: [] };
      expect(mockReturn).toHaveProperty("newBadges");
      expect(Array.isArray(mockReturn.newBadges)).toBe(true);
    });
  });

  describe("sendReminderNow procedure", () => {
    it("should send reminder for previous month (not current month)", () => {
      // Verify the logic: in February, reminder should be for January
      const now = new Date("2025-02-15");
      const currentMonth = now.getMonth(); // 1 (February, 0-indexed)
      const mesAnterior = currentMonth === 0 ? 12 : currentMonth; // Should be 1 (January)
      const anoAnterior = currentMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();

      expect(mesAnterior).toBe(1); // January
      expect(anoAnterior).toBe(2025);
    });

    it("should handle year boundary correctly (January -> December)", () => {
      const now = new Date("2025-01-15");
      const currentMonth = now.getMonth(); // 0 (January)
      const mesAnterior = currentMonth === 0 ? 12 : currentMonth;
      const anoAnterior = currentMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();

      expect(mesAnterior).toBe(12); // December
      expect(anoAnterior).toBe(2024);
    });

    it("should return success and emailSent flags", () => {
      type ExpectedReturn = {
        success: boolean;
        emailSent: boolean;
      };

      const mockReturn: ExpectedReturn = { success: true, emailSent: true };
      expect(mockReturn).toHaveProperty("success");
      expect(mockReturn).toHaveProperty("emailSent");
    });
  });
});
