/**
 * Unit Tests for Brazilian Phone Utilities
 */

import { describe, expect, it } from "vitest";
import {
  formatPhoneWithCountryCode,
  maskPhoneInput,
  normalizeBrazilianPhone,
  validateBrazilianPhone,
} from "../phone-utils";

describe("validateBrazilianPhone", () => {
  it("should accept empty phone (optional field)", () => {
    expect(validateBrazilianPhone("")).toEqual({ valid: true });
    expect(validateBrazilianPhone("   ")).toEqual({ valid: true });
  });

  it("should validate correct mobile numbers", () => {
    const result = validateBrazilianPhone("11999999999");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("5511999999999");
  });

  it("should validate with country code", () => {
    const result = validateBrazilianPhone("5511999999999");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("5511999999999");
  });

  it("should validate formatted phones", () => {
    const result = validateBrazilianPhone("(11) 99999-9999");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("5511999999999");
  });

  it("should validate landline numbers (10 digits)", () => {
    const result = validateBrazilianPhone("1133334444");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("551133334444");
  });

  it("should reject invalid DDD (00)", () => {
    const result = validateBrazilianPhone("00999999999");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("DDD");
  });

  it("should reject invalid DDD (10)", () => {
    const result = validateBrazilianPhone("10999999999");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("DDD");
  });

  it("should reject 11 digit number not starting with 9", () => {
    const result = validateBrazilianPhone("11299999999");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("começar com 9");
  });

  it("should reject too short number", () => {
    const result = validateBrazilianPhone("11999");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10 ou 11");
  });

  it("should reject too long number", () => {
    const result = validateBrazilianPhone("119999999999999");
    expect(result.valid).toBe(false);
  });
});

describe("normalizeBrazilianPhone", () => {
  it("should return empty for empty input", () => {
    expect(normalizeBrazilianPhone("")).toBe("");
  });

  it("should normalize formatted phone", () => {
    expect(normalizeBrazilianPhone("(11) 99999-9999")).toBe("5511999999999");
  });

  it("should normalize with country code", () => {
    expect(normalizeBrazilianPhone("+55 11 99999-9999")).toBe("5511999999999");
  });

  it("should handle raw digits", () => {
    expect(normalizeBrazilianPhone("11999999999")).toBe("5511999999999");
  });
});

describe("formatPhoneWithCountryCode", () => {
  it("should return empty for empty input", () => {
    expect(formatPhoneWithCountryCode("")).toBe("");
  });

  it("should format mobile phone", () => {
    expect(formatPhoneWithCountryCode("5511999999999")).toBe("+55 (11) 99999-9999");
  });

  it("should format landline", () => {
    expect(formatPhoneWithCountryCode("551133334444")).toBe("+55 (11) 3333-4444");
  });

  it("should format without country code", () => {
    expect(formatPhoneWithCountryCode("11999999999")).toBe("+55 (11) 99999-9999");
  });
});

describe("maskPhoneInput", () => {
  it("should mask progressively", () => {
    expect(maskPhoneInput("11")).toBe("11");
    expect(maskPhoneInput("119")).toBe("(11) 9");
    expect(maskPhoneInput("119999")).toBe("(11) 9999");
    expect(maskPhoneInput("11999999999")).toBe("(11) 99999-9999");
  });

  it("should mask landline", () => {
    expect(maskPhoneInput("1133334444")).toBe("(11) 3333-4444");
  });

  it("should limit to 11 digits", () => {
    expect(maskPhoneInput("119999999999999")).toBe("(11) 99999-9999");
  });
});
