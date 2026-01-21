import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock email service
vi.mock("./emailService", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

import {
  BADGES_CONFIG,
  initializeBadges,
  checkAndAwardBadges,
  calculateMonthlyRanking,
  updateProgressiveGoals,
  sendMetricsReminders,
  checkUnmetGoalsAlerts,
  getMentoradoBadges,
  getRanking,
  getNotificacoes,
  markNotificationRead,
  getAllBadges,
  getProgressiveGoals,
} from "./gamificacao";

describe("Gamificação Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BADGES_CONFIG", () => {
    it("should have all required badge categories", () => {
      const categories = new Set(BADGES_CONFIG.map(b => b.categoria));
      expect(categories.has("faturamento")).toBe(true);
      expect(categories.has("conteudo")).toBe(true);
      expect(categories.has("operacional")).toBe(true);
      expect(categories.has("consistencia")).toBe(true);
      expect(categories.has("especial")).toBe(true);
    });

    it("should have unique badge codes", () => {
      const codes = BADGES_CONFIG.map(b => b.codigo);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it("should have valid criteria JSON for all badges", () => {
      BADGES_CONFIG.forEach(badge => {
        expect(() => JSON.parse(badge.criterio)).not.toThrow();
      });
    });

    it("should have positive points for all badges", () => {
      BADGES_CONFIG.forEach(badge => {
        expect(badge.pontos).toBeGreaterThan(0);
      });
    });

    it("should have at least 10 badges defined", () => {
      expect(BADGES_CONFIG.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("initializeBadges", () => {
    it("should return without error when database is not available", async () => {
      await expect(initializeBadges()).resolves.not.toThrow();
    });
  });

  describe("checkAndAwardBadges", () => {
    it("should return empty array when database is not available", async () => {
      const result = await checkAndAwardBadges(1, 2025, 12);
      expect(result).toEqual([]);
    });
  });

  describe("calculateMonthlyRanking", () => {
    it("should return without error when database is not available", async () => {
      await expect(calculateMonthlyRanking(2025, 12)).resolves.not.toThrow();
    });
  });

  describe("updateProgressiveGoals", () => {
    it("should return without error when database is not available", async () => {
      await expect(updateProgressiveGoals(1, 2025, 12)).resolves.not.toThrow();
    });
  });

  describe("sendMetricsReminders", () => {
    it("should return without error when database is not available", async () => {
      await expect(sendMetricsReminders()).resolves.not.toThrow();
    });
  });

  describe("checkUnmetGoalsAlerts", () => {
    it("should return without error when database is not available", async () => {
      await expect(checkUnmetGoalsAlerts(2025, 12)).resolves.not.toThrow();
    });
  });

  describe("getMentoradoBadges", () => {
    it("should return empty array when database is not available", async () => {
      const result = await getMentoradoBadges(1);
      expect(result).toEqual([]);
    });
  });

  describe("getRanking", () => {
    it("should return empty array when database is not available", async () => {
      const result = await getRanking(2025, 12);
      expect(result).toEqual([]);
    });

    it("should accept optional turma parameter", async () => {
      const result = await getRanking(2025, 12, "neon_estrutura");
      expect(result).toEqual([]);
    });
  });

  describe("getNotificacoes", () => {
    it("should return empty array when database is not available", async () => {
      const result = await getNotificacoes(1);
      expect(result).toEqual([]);
    });

    it("should accept apenasNaoLidas parameter", async () => {
      const result = await getNotificacoes(1, true);
      expect(result).toEqual([]);
    });
  });

  describe("markNotificationRead", () => {
    it("should return without error when database is not available", async () => {
      await expect(markNotificationRead(1)).resolves.not.toThrow();
    });
  });

  describe("getAllBadges", () => {
    it("should return empty array when database is not available", async () => {
      const result = await getAllBadges();
      expect(result).toEqual([]);
    });
  });

  describe("getProgressiveGoals", () => {
    it("should return empty array when database is not available", async () => {
      const result = await getProgressiveGoals(1);
      expect(result).toEqual([]);
    });
  });
});
