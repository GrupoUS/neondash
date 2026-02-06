/**
 * Unit Tests for Brazilian Patient Validators
 */

import { describe, expect, it } from "vitest";
import {
  formatCEP,
  formatCPF,
  formatCurrencyBR,
  formatDateBR,
  formatPhone,
  maskCEP,
  maskCPF,
  maskPhone,
  validateCEP,
  validateCPF,
  validateEmail,
  validatePhone,
} from "../patient-validators";

describe("validateCPF", () => {
  it("should validate correct CPFs", () => {
    expect(validateCPF("529.982.247-25")).toBe(true);
    expect(validateCPF("52998224725")).toBe(true);
    expect(validateCPF("111.444.777-35")).toBe(true);
  });

  it("should reject invalid CPFs", () => {
    expect(validateCPF("000.000.000-00")).toBe(false);
    expect(validateCPF("111.111.111-11")).toBe(false);
    expect(validateCPF("123.456.789-00")).toBe(false);
    expect(validateCPF("529.982.247-26")).toBe(false); // Wrong check digit
    expect(validateCPF("1234567890")).toBe(false); // Wrong length
    expect(validateCPF("")).toBe(false);
  });

  it("should handle CPF with special characters", () => {
    expect(validateCPF("529-982-247.25")).toBe(true);
  });
});

describe("validatePhone", () => {
  it("should validate correct mobile numbers", () => {
    expect(validatePhone("(11) 99999-9999")).toBe(true);
    expect(validatePhone("11999999999")).toBe(true);
    expect(validatePhone("5511999999999")).toBe(true);
  });

  it("should validate correct landline numbers", () => {
    expect(validatePhone("(11) 3333-4444")).toBe(true);
    expect(validatePhone("1133334444")).toBe(true);
  });

  it("should reject invalid phone numbers", () => {
    expect(validatePhone("123")).toBe(false);
    expect(validatePhone("(00) 99999-9999")).toBe(false); // Invalid DDD
    expect(validatePhone("(11) 29999-9999")).toBe(false); // Mobile must start with 9
    expect(validatePhone("")).toBe(false);
  });
});

describe("validateCEP", () => {
  it("should validate correct CEPs", () => {
    expect(validateCEP("01310-100")).toBe(true);
    expect(validateCEP("01310100")).toBe(true);
  });

  it("should reject invalid CEPs", () => {
    expect(validateCEP("0131")).toBe(false);
    expect(validateCEP("01310-10")).toBe(false);
    expect(validateCEP("")).toBe(false);
    expect(validateCEP("abcdefgh")).toBe(false);
  });
});

describe("validateEmail", () => {
  it("should validate correct emails", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.co")).toBe(true);
    expect(validateEmail("user+tag@gmail.com")).toBe(true);
  });

  it("should reject invalid emails", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("formatCPF", () => {
  it("should format CPF correctly", () => {
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
  });

  it("should return original if invalid length", () => {
    expect(formatCPF("1234")).toBe("1234");
  });
});

describe("formatPhone", () => {
  it("should format mobile phone correctly", () => {
    expect(formatPhone("11999999999")).toBe("(11) 99999-9999");
  });

  it("should format landline correctly", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("should handle country code", () => {
    expect(formatPhone("5511999999999")).toBe("(11) 99999-9999");
  });
});

describe("formatCEP", () => {
  it("should format CEP correctly", () => {
    expect(formatCEP("01310100")).toBe("01310-100");
  });

  it("should return original if invalid length", () => {
    expect(formatCEP("0131")).toBe("0131");
  });
});

describe("maskCPF", () => {
  it("should mask CPF progressively", () => {
    expect(maskCPF("529")).toBe("529");
    expect(maskCPF("5299")).toBe("529.9");
    expect(maskCPF("52998224725")).toBe("529.982.247-25");
  });

  it("should limit to 11 digits", () => {
    expect(maskCPF("529982247251234")).toBe("529.982.247-25");
  });
});

describe("maskPhone", () => {
  it("should mask phone progressively", () => {
    expect(maskPhone("11")).toBe("11"); // Only starts formatting when more digits are added
    expect(maskPhone("119")).toBe("(11) 9");
    expect(maskPhone("11999999999")).toBe("(11) 99999-9999");
  });
});

describe("maskCEP", () => {
  it("should mask CEP progressively", () => {
    expect(maskCEP("01310")).toBe("01310");
    expect(maskCEP("01310100")).toBe("01310-100");
  });
});

describe("formatDateBR", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-01-15");
    expect(formatDateBR(date)).toBe("15/01/2024");
  });

  it("should handle ISO string", () => {
    expect(formatDateBR("2024-01-15")).toMatch(/15\/01\/2024/);
  });

  it("should return dash for null", () => {
    expect(formatDateBR(null)).toBe("-");
  });
});

describe("formatCurrencyBR", () => {
  it("should format currency correctly", () => {
    expect(formatCurrencyBR(1234.56)).toBe("R$\u00A01.234,56");
  });

  it("should handle zero", () => {
    expect(formatCurrencyBR(0)).toBe("R$\u00A00,00");
  });
});
