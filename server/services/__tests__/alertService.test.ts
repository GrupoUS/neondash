/**
 * Alert Service Unit Tests
 *
 * Tests for statistical calculation functions and alert classification.
 */

import { describe, expect, it } from "bun:test";
import {
  calculateAlerts,
  calculateMean,
  calculatePercentChange,
  calculateStandardDeviation,
  calculateZScore,
  classifyAlert,
} from "../alertService";

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICAL FUNCTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("calculateMean", () => {
  it("calculates mean correctly for positive numbers", () => {
    expect(calculateMean([10, 20, 30])).toBe(20);
  });

  it("returns 0 for empty array", () => {
    expect(calculateMean([])).toBe(0);
  });

  it("handles single value", () => {
    expect(calculateMean([42])).toBe(42);
  });

  it("handles decimal values", () => {
    expect(calculateMean([1.5, 2.5, 3.0])).toBeCloseTo(2.333, 2);
  });
});

describe("calculateStandardDeviation", () => {
  it("calculates standard deviation correctly", () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const mean = calculateMean(values);
    expect(calculateStandardDeviation(values, mean)).toBeCloseTo(2, 0);
  });

  it("returns 0 for empty array", () => {
    expect(calculateStandardDeviation([], 0)).toBe(0);
  });

  it("returns 0 for single value", () => {
    expect(calculateStandardDeviation([5], 5)).toBe(0);
  });

  it("returns 0 when all values are identical", () => {
    const values = [10, 10, 10, 10];
    const mean = calculateMean(values);
    expect(calculateStandardDeviation(values, mean)).toBe(0);
  });
});

describe("calculateZScore", () => {
  it("calculates z-score correctly", () => {
    // value=70, mean=60, stdDev=10 → z-score = 1.0
    expect(calculateZScore(70, 60, 10)).toBe(1.0);
  });

  it("returns null when stdDev is 0", () => {
    expect(calculateZScore(50, 50, 0)).toBeNull();
  });

  it("returns negative z-score for values below mean", () => {
    // value=50, mean=60, stdDev=10 → z-score = -1.0
    expect(calculateZScore(50, 60, 10)).toBe(-1.0);
  });

  it("returns 0 when value equals mean", () => {
    expect(calculateZScore(50, 50, 10)).toBe(0);
  });
});

describe("calculatePercentChange", () => {
  it("calculates positive percent change", () => {
    expect(calculatePercentChange(120, 100)).toBe(20);
  });

  it("calculates negative percent change", () => {
    expect(calculatePercentChange(80, 100)).toBe(-20);
  });

  it("returns 100 when previous was 0 and current is positive", () => {
    expect(calculatePercentChange(50, 0)).toBe(100);
  });

  it("returns null when previous was 0 and current is 0", () => {
    expect(calculatePercentChange(0, 0)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ALERT CLASSIFICATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("classifyAlert", () => {
  describe("Z-score thresholds", () => {
    it("returns vermelho for z-score < -1.5", () => {
      expect(classifyAlert(-1.6, null)).toBe("vermelho");
      expect(classifyAlert(-2.0, null)).toBe("vermelho");
    });

    it("returns amarelo for -1.5 <= z-score < -0.5", () => {
      expect(classifyAlert(-1.5, null)).toBe("amarelo");
      expect(classifyAlert(-1.0, null)).toBe("amarelo");
      expect(classifyAlert(-0.6, null)).toBe("amarelo");
    });

    it("returns verde for z-score >= -0.5", () => {
      expect(classifyAlert(-0.5, null)).toBe("verde");
      expect(classifyAlert(0, null)).toBe("verde");
      expect(classifyAlert(1.0, null)).toBe("verde");
    });
  });

  describe("Percent change thresholds", () => {
    it("returns vermelho for percentChange < -30%", () => {
      expect(classifyAlert(null, -35)).toBe("vermelho");
      expect(classifyAlert(null, -50)).toBe("vermelho");
    });

    it("returns amarelo for -30% <= percentChange < -15%", () => {
      expect(classifyAlert(null, -30)).toBe("amarelo");
      expect(classifyAlert(null, -20)).toBe("amarelo");
    });

    it("returns verde for percentChange >= -15%", () => {
      expect(classifyAlert(null, -15)).toBe("verde");
      expect(classifyAlert(null, 0)).toBe("verde");
      expect(classifyAlert(null, 20)).toBe("verde");
    });
  });

  describe("Combined thresholds", () => {
    it("percentChange takes precedence for vermelho", () => {
      // Z-score would be amarelo, but percentChange is vermelho
      expect(classifyAlert(-1.0, -35)).toBe("vermelho");
    });

    it("percentChange takes precedence for amarelo", () => {
      // Z-score would be verde, but percentChange is amarelo
      expect(classifyAlert(0, -20)).toBe("amarelo");
    });

    it("returns verde when both are green", () => {
      expect(classifyAlert(0, 5)).toBe("verde");
    });
  });

  describe("Null handling", () => {
    it("returns verde when both are null", () => {
      expect(classifyAlert(null, null)).toBe("verde");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK MONTH SELECTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("calculateAlerts - fallback logic", () => {
  // Note: These tests require database mocking, which is handled in integration tests.
  // Here we test the exported functions' behavior boundaries.

  it("should export calculateAlerts function", () => {
    expect(typeof calculateAlerts).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL ALERTS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Special Alert Types", () => {
  describe("Alert classification matrix", () => {
    it("classifies extreme negative z-scores as vermelho", () => {
      expect(classifyAlert(-3.0, null)).toBe("vermelho");
    });

    it("classifies moderate negative z-scores as amarelo", () => {
      expect(classifyAlert(-1.2, null)).toBe("amarelo");
    });

    it("classifies positive z-scores as verde", () => {
      expect(classifyAlert(2.0, null)).toBe("verde");
    });
  });
});
