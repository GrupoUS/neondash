import Papa from "papaparse";

/**
 * Parsed transaction ready for import
 */
export interface ParsedTransaction {
  data: string; // YYYY-MM-DD format
  descricao: string;
  valor: number; // in centavos
  tipo: "receita" | "despesa";
}

/**
 * Result from parsing a CSV file
 */
export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  totalRows: number;
}

/**
 * Column mapping aliases for different bank formats
 */
const COLUMN_ALIASES = {
  date: ["data", "date", "dt_lancamento", "data_lancamento", "data lançamento", "dt"],
  description: [
    "descricao",
    "descrição",
    "description",
    "historico",
    "histórico",
    "memo",
    "lancamento",
  ],
  value: ["valor", "value", "amount", "quantia", "vlr", "vl"],
  debit: ["debito", "débito", "debit", "saida", "saída"],
  credit: ["credito", "crédito", "credit", "entrada"],
} as const;

/**
 * Detect column mapping from headers
 */
function detectColumnMapping(headers: string[]): {
  dateCol: string | null;
  descriptionCol: string | null;
  valueCol: string | null;
  debitCol: string | null;
  creditCol: string | null;
} {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  const findColumn = (aliases: readonly string[]): string | null => {
    for (const alias of aliases) {
      const idx = normalizedHeaders.findIndex((h) => h === alias || h.includes(alias));
      if (idx !== -1) return headers[idx];
    }
    return null;
  };

  return {
    dateCol: findColumn(COLUMN_ALIASES.date),
    descriptionCol: findColumn(COLUMN_ALIASES.description),
    valueCol: findColumn(COLUMN_ALIASES.value),
    debitCol: findColumn(COLUMN_ALIASES.debit),
    creditCol: findColumn(COLUMN_ALIASES.credit),
  };
}

/**
 * Parse Brazilian number format to float
 * "1.234,56" -> 1234.56
 * "-791,96" -> -791.96
 * "1,234.56" -> 1234.56 (US format passthrough)
 */
function parseValue(value: string): number | null {
  if (!value || typeof value !== "string") return null;

  const cleaned = value.trim().replace(/\s/g, "");
  if (!cleaned) return null;

  // Detect format by checking position of . and ,
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let normalized: string;

  if (lastComma > lastDot) {
    // Brazilian format: 1.234,56 -> dot is thousand sep, comma is decimal
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // US format: 1,234.56 -> comma is thousand sep, dot is decimal
    normalized = cleaned.replace(/,/g, "");
  } else if (lastComma !== -1) {
    // Only comma: 123,45 -> comma is decimal
    normalized = cleaned.replace(",", ".");
  } else {
    // No separators or only dots
    normalized = cleaned;
  }

  const num = Number.parseFloat(normalized);
  return Number.isNaN(num) ? null : num;
}

/**
 * Parse various date formats to YYYY-MM-DD
 */
function parseDate(value: string): string | null {
  if (!value || typeof value !== "string") return null;

  const cleaned = value.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // YYYY-MM-DD (already correct format)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return cleaned;
  }

  // MM/DD/YYYY (US format)
  const usMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (usMatch) {
    // Ambiguous - assume Brazilian DD/MM/YYYY
    const [, day, month, year] = usMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

/**
 * Detect transaction type from value and description
 */
function detectTransactionType(value: number, description: string): "receita" | "despesa" {
  // Negative value = expense
  if (value < 0) return "despesa";

  // Check description keywords
  const descLower = description.toLowerCase();
  const expenseKeywords = [
    "enviado",
    "débito",
    "debito",
    "pagamento",
    "transferência enviada",
    "saque",
    "tarifa",
    "taxa",
    "anuidade",
  ];
  const incomeKeywords = [
    "recebido",
    "crédito",
    "credito",
    "depósito",
    "deposito",
    "entrada",
    "rendimento",
  ];

  for (const kw of expenseKeywords) {
    if (descLower.includes(kw)) return "despesa";
  }

  for (const kw of incomeKeywords) {
    if (descLower.includes(kw)) return "receita";
  }

  // Default: positive = income
  return value >= 0 ? "receita" : "despesa";
}

/**
 * Main function: Parse CSV content into transactions
 */
export function parseTransactions(content: string): ParseResult {
  const result: ParseResult = {
    transactions: [],
    errors: [],
    totalRows: 0,
  };

  // Parse with PapaParse
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  result.totalRows = parsed.data.length;

  // Handle parse errors
  if (parsed.errors.length > 0) {
    result.errors = parsed.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`);
  }

  // Get column mapping
  const headers = parsed.meta.fields || [];
  const mapping = detectColumnMapping(headers);

  if (!mapping.dateCol || !mapping.descriptionCol) {
    result.errors.push(`Colunas não detectadas. Headers encontrados: ${headers.join(", ")}`);
    return result;
  }

  // Need either value column or debit/credit columns
  if (!mapping.valueCol && !mapping.debitCol && !mapping.creditCol) {
    result.errors.push(`Coluna de valor não encontrada. Headers: ${headers.join(", ")}`);
    return result;
  }

  // Process each row
  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];

    try {
      const dateRaw = row[mapping.dateCol];
      const descriptionRaw = row[mapping.descriptionCol];

      // Get value from single column or debit/credit
      let rawValue: number | null = null;

      if (mapping.valueCol) {
        rawValue = parseValue(row[mapping.valueCol]);
      } else {
        // Use debit/credit columns
        const debit = mapping.debitCol ? parseValue(row[mapping.debitCol]) : null;
        const credit = mapping.creditCol ? parseValue(row[mapping.creditCol]) : null;

        if (debit && debit !== 0) {
          rawValue = -Math.abs(debit);
        } else if (credit && credit !== 0) {
          rawValue = Math.abs(credit);
        }
      }

      // Skip if missing required fields
      if (!dateRaw || !descriptionRaw || rawValue === null) {
        continue;
      }

      const date = parseDate(dateRaw);
      if (!date) continue;

      const description = descriptionRaw.trim();
      if (!description) continue;

      // Convert to centavos
      const valorCentavos = Math.round(Math.abs(rawValue) * 100);
      if (valorCentavos === 0) continue;

      const tipo = detectTransactionType(rawValue, description);

      result.transactions.push({
        data: date,
        descricao: description,
        valor: valorCentavos,
        tipo,
      });
    } catch {
      // Skip malformed row
    }
  }

  return result;
}
