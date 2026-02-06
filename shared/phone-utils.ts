/**
 * Brazilian Phone Utilities
 * Shared validation, normalization, and formatting for phone numbers
 * Compatible with WhatsApp API (digits-only with +55 prefix)
 */

/**
 * Valid DDD (area code) list for Brazil
 * DDDs range from 11 to 99, with some gaps
 */
const VALID_DDDS = new Set([
  // São Paulo
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  // Rio de Janeiro / Espírito Santo
  21, 22, 24, 27, 28,
  // Minas Gerais
  31, 32, 33, 34, 35, 37, 38,
  // Paraná / Santa Catarina
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  // Rio Grande do Sul
  51, 53, 54, 55,
  // Centro-Oeste (DF, GO, MT, MS)
  61, 62, 63, 64, 65, 66, 67,
  // Nordeste
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89,
  // Norte
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Validates a Brazilian phone number
 * @param phone - Phone string with or without formatting
 * @returns Validation result with normalized value or error message
 */
export function validateBrazilianPhone(phone: string): PhoneValidationResult {
  if (!phone || phone.trim() === "") {
    return { valid: true }; // Empty is valid (optional field)
  }

  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Remove country code if present
  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  // Check length: 10 (landline) or 11 (mobile) digits
  if (digits.length !== 10 && digits.length !== 11) {
    return {
      valid: false,
      error: "Telefone deve ter 10 ou 11 dígitos",
    };
  }

  // Extract DDD
  const ddd = Number.parseInt(digits.slice(0, 2), 10);

  // Validate DDD
  if (!VALID_DDDS.has(ddd)) {
    return {
      valid: false,
      error: `DDD ${ddd} inválido`,
    };
  }

  // Mobile numbers (11 digits) must start with 9 after DDD
  if (digits.length === 11 && digits[2] !== "9") {
    return {
      valid: false,
      error: "Celular deve começar com 9",
    };
  }

  // Normalize to 55 + digits
  const normalized = `55${digits}`;

  return {
    valid: true,
    normalized,
  };
}

/**
 * Normalizes a Brazilian phone number to WhatsApp-compatible format
 * Returns digits only with country code: 5511999999999
 * @param phone - Phone string with or without formatting
 * @returns Normalized phone string or original if invalid
 */
export function normalizeBrazilianPhone(phone: string): string {
  if (!phone || phone.trim() === "") {
    return "";
  }

  const result = validateBrazilianPhone(phone);
  return result.normalized ?? phone.replace(/\D/g, "");
}

/**
 * Formats a phone number for display with country code
 * @param phone - Phone string (digits or formatted)
 * @returns Formatted string: +55 (11) 99999-9999
 */
export function formatPhoneWithCountryCode(phone: string): string {
  if (!phone) return "";

  let digits = phone.replace(/\D/g, "");

  // Remove country code if present
  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    // Mobile: +55 (00) 00000-0000
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    // Landline: +55 (00) 0000-0000
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // Return original if can't format
  return phone;
}

/**
 * Masks phone input while typing (without country code)
 * @param value - Current input value
 * @returns Masked value: (11) 99999-9999
 */
export function maskPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // 11 digits - mobile
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
