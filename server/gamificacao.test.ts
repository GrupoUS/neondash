import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock the database
mock.module("./db", () => ({
  getDb: mock(() => Promise.resolve(null)),
}));

// Mock email service
mock.module("./emailService", () => ({
  sendEmail: mock(() => Promise.resolve(true)),
}));

describe("Gamificação Service", () => {
  let Gamificacao: typeof import("./gamificacao");

  beforeEach(async () => {
    // Dynamic import to ensure mocks are applied
    Gamificacao = await import("./gamificacao");
  });

  describe("BADGES_CONFIG", () => {
    it("should have all required badge categories", () => {
      const categories = new Set(
        Gamificacao.BADGES_CONFIG.map(b => b.categoria)
      );
      expect(categories.has("faturamento")).toBe(true);
      expect(categories.has("conteudo")).toBe(true);
      expect(categories.has("operacional")).toBe(true);
      expect(categories.has("consistencia")).toBe(true);
      expect(categories.has("especial")).toBe(true);
    });

    it("should have unique badge codes", () => {
      const codes = Gamificacao.BADGES_CONFIG.map(b => b.codigo);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it("should have valid criteria JSON for all badges", () => {
      Gamificacao.BADGES_CONFIG.forEach(badge => {
        expect(() => JSON.parse(badge.criterio)).not.toThrow();
      });
    });

    it("should have positive points for all badges", () => {
      Gamificacao.BADGES_CONFIG.forEach(badge => {
        expect(badge.pontos).toBeGreaterThan(0);
      });
    });

    it("should have at least 10 badges defined", () => {
      expect(Gamificacao.BADGES_CONFIG.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("initializeBadges", () => {
    it.skip("should return without error when database is not available", async () => {
      await expect(Gamificacao.initializeBadges()).resolves.not.toThrow();
    });
  });

  describe("checkAndAwardBadges", () => {
    it.skip("should return empty array when database is not available", async () => {
      const result = await Gamificacao.checkAndAwardBadges(1, 2025, 12);
      expect(result).toEqual([]);
    });
  });

  describe("calculateMonthlyRanking", () => {
    it.skip("should return without error when database is not available", async () => {
      await expect(
        Gamificacao.calculateMonthlyRanking(2025, 12)
      ).resolves.not.toThrow();
    });
  });

  describe("updateProgressiveGoals", () => {
    it.skip("should return without error when database is not available", async () => {
      await expect(
        Gamificacao.updateProgressiveGoals(1, 2025, 12)
      ).resolves.not.toThrow();
    });
  });

  describe("sendMetricsReminders", () => {
    it.skip("should return without error when database is not available", async () => {
      await expect(Gamificacao.sendMetricsReminders()).resolves.not.toThrow();
    });
  });

  describe("checkUnmetGoalsAlerts", () => {
    it.skip("should return without error when database is not available", async () => {
      await expect(
        Gamificacao.checkUnmetGoalsAlerts(2025, 12)
      ).resolves.not.toThrow();
    });
  });

  describe("getMentoradoBadges", () => {
    it.skip("should return empty array when database is not available", async () => {
      const result = await Gamificacao.getMentoradoBadges(1);
      expect(result).toEqual([]);
    });
  });

  describe("getRanking", () => {
    it.skip("should return empty array when database is not available", async () => {
      const result = await Gamificacao.getRanking(2025, 12);
      expect(result).toEqual([]);
    });

    it("should accept optional turma parameter", async () => {
      const result = await Gamificacao.getRanking(2025, 12, "neon_estrutura");
      expect(result).toEqual([]);
    });
  });

  describe("getNotificacoes", () => {
    it.skip("should return empty array when database is not available", async () => {
      const result = await Gamificacao.getNotificacoes(1);
      expect(result).toEqual([]);
    });

    it("should accept apenasNaoLidas parameter", async () => {
      const result = await Gamificacao.getNotificacoes(1, true);
      expect(result).toEqual([]);
    });
  });

  describe("markNotificationRead", () => {
    it.skip("should return without error when database is not available", async () => {
      await expect(Gamificacao.markNotificationRead(1)).resolves.not.toThrow();
    });
  });

  describe("getAllBadges", () => {
    it.skip("should return empty array when database is not available", async () => {
      const result = await Gamificacao.getAllBadges();
      expect(result).toEqual([]);
    });
  });

  describe("getProgressiveGoals", () => {
    it.skip("should return empty array when database is not available", async () => {
      const result = await Gamificacao.getProgressiveGoals(1);
      expect(result).toEqual([]);
    });
  });
});
