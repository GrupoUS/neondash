/**
 * Brazilian Validators and Formatters for Patient Data
 * Includes CPF, Phone, CEP validation and ViaCEP integration
 */

/**
 * Validates a Brazilian CPF number using the official algorithm
 * @param cpf - CPF string with or without formatting
 * @returns true if valid, false otherwise
 */
export function validateCPF(cpf: string): boolean {
  // Remove any non-digit characters
  const cleanCPF = cpf.replace(/\D/g, "");

  // CPF must have exactly 11 digits
  if (cleanCPF.length !== 11) return false;

  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleanCPF[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number.parseInt(cleanCPF[9], 10)) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleanCPF[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number.parseInt(cleanCPF[10], 10)) return false;

  return true;
}

/**
 * Validates a Brazilian phone number (landline or mobile)
 * Accepts formats: (11) 99999-9999, 11999999999, +55 11 99999-9999
 * @param phone - Phone string with or without formatting
 * @returns true if valid, false otherwise
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "");

  // Remove country code if present
  const phoneWithoutCountry = cleanPhone.startsWith("55") ? cleanPhone.slice(2) : cleanPhone;

  // Must have 10 (landline) or 11 (mobile) digits
  if (phoneWithoutCountry.length !== 10 && phoneWithoutCountry.length !== 11) {
    return false;
  }

  // DDD must be between 11-99
  const ddd = Number.parseInt(phoneWithoutCountry.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;

  // Mobile numbers start with 9
  if (phoneWithoutCountry.length === 11 && phoneWithoutCountry[2] !== "9") {
    return false;
  }

  return true;
}

/**
 * Validates a Brazilian CEP (postal code)
 * @param cep - CEP string with or without formatting
 * @returns true if valid, false otherwise
 */
export function validateCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, "");
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);
}

/**
 * Validates an email address
 * @param email - Email string
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formats a CPF string to the standard format: 000.000.000-00
 * @param cpf - CPF string (digits only or formatted)
 * @returns Formatted CPF string
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return cpf;
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formats a phone number to Brazilian format: (00) 00000-0000 or (00) 0000-0000
 * @param phone - Phone string (digits only or formatted)
 * @returns Formatted phone string
 */
export function formatPhone(phone: string): string {
  let cleanPhone = phone.replace(/\D/g, "");

  // Remove country code if present
  if (cleanPhone.startsWith("55") && cleanPhone.length > 11) {
    cleanPhone = cleanPhone.slice(2);
  }

  if (cleanPhone.length === 11) {
    // Mobile: (00) 00000-0000
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (cleanPhone.length === 10) {
    // Landline: (00) 0000-0000
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone;
}

/**
 * Formats a CEP to the standard format: 00000-000
 * @param cep - CEP string (digits only or formatted)
 * @returns Formatted CEP string
 */
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, "");
  if (cleanCEP.length !== 8) return cep;
  return cleanCEP.replace(/(\d{5})(\d{3})/, "$1-$2");
}

/**
 * Masks input as CPF while typing
 * @param value - Current input value
 * @returns Masked value
 */
export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Masks input as phone while typing
 * @param value - Current input value
 * @returns Masked value
 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

/**
 * Masks input as CEP while typing
 * @param value - Current input value
 * @returns Masked value
 */
export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/**
 * ViaCEP response type
 */
export interface ViaCEPAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Fetches address information from ViaCEP API
 * @param cep - CEP string (with or without formatting)
 * @returns Address data or null if not found
 */
export async function fetchAddressByCEP(cep: string): Promise<ViaCEPAddress | null> {
  const cleanCEP = cep.replace(/\D/g, "");

  if (!validateCEP(cleanCEP)) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    if (!response.ok) return null;

    const data: ViaCEPAddress = await response.json();
    if (data.erro) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Formats a date to Brazilian format: DD/MM/YYYY
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export function formatDateBR(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formats a currency value to Brazilian Real format
 * @param value - Numeric value
 * @returns Formatted currency string
 */
export function formatCurrencyBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
