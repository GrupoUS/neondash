import Papa from "papaparse";

/**
 * Parsed transaction ready for import
 */
export interface ParsedTransaction {
  data: string; // YYYY-MM-DD format
  descricao: string;
  valor: number; // in centavos
  tipo: "receita" | "despesa";
  suggestedCategory: string; // Categoria sugerida baseada em keywords
}

/**
 * Detected period from CSV dates
 */
export interface DetectedPeriod {
  ano: number;
  mes: number;
}

/**
 * Result from parsing a CSV file
 */
export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  totalRows: number;
  detectedPeriod: DetectedPeriod | null;
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
 * Category suggestion keywords mapping
 * @description Maps description patterns to category names
 */
const CATEGORY_KEYWORDS: Array<{
  keywords: string[];
  category: string;
  tipo: "receita" | "despesa" | "both";
}> = [
  // Receitas (income)
  { keywords: ["pix recebido", "pix recebida"], category: "PIX Recebido", tipo: "receita" },
  {
    keywords: ["ted recebida", "doc recebida"],
    category: "Transferência Recebida",
    tipo: "receita",
  },
  { keywords: ["rendimento", "juros", "cdb"], category: "Rendimentos", tipo: "receita" },
  { keywords: ["cashback"], category: "Cashback", tipo: "receita" },
  { keywords: ["estorno", "devolução"], category: "Estornos", tipo: "receita" },

  // Despesas (expenses)
  { keywords: ["pix enviado", "pix enviada"], category: "PIX Enviado", tipo: "despesa" },
  {
    keywords: ["ted enviada", "doc enviada", "transferência"],
    category: "Transferência Enviada",
    tipo: "despesa",
  },
  { keywords: ["tarifa", "taxa", "anuidade", "iof"], category: "Taxas Bancárias", tipo: "despesa" },
  {
    keywords: ["energia", "luz", "cemig", "cpfl", "enel", "celpe"],
    category: "Energia Elétrica",
    tipo: "despesa",
  },
  {
    keywords: ["internet", "claro", "vivo", "tim", "oi", "net", "telefon"],
    category: "Internet/Telefone",
    tipo: "despesa",
  },
  {
    keywords: ["aluguel", "condomínio", "condominio", "iptu"],
    category: "Aluguel/Moradia",
    tipo: "despesa",
  },
  {
    keywords: ["água", "agua", "saneamento", "copasa", "sabesp"],
    category: "Água/Saneamento",
    tipo: "despesa",
  },
  { keywords: ["gás", "gas", "comgas", "ultragaz"], category: "Gás", tipo: "despesa" },
  {
    keywords: ["mercado", "supermercado", "carrefour", "atacadão", "atacadao", "assaí", "assai"],
    category: "Supermercado",
    tipo: "despesa",
  },
  {
    keywords: ["ifood", "rappi", "uber eats", "delivery", "restaurante"],
    category: "Alimentação",
    tipo: "despesa",
  },
  { keywords: ["uber", "99", "cabify", "taxi", "táxi"], category: "Transporte", tipo: "despesa" },
  {
    keywords: [
      "combustível",
      "combustivel",
      "posto",
      "gasolina",
      "etanol",
      "shell",
      "ipiranga",
      "br petrobras",
    ],
    category: "Combustível",
    tipo: "despesa",
  },
  {
    keywords: ["farmácia", "farmacia", "drogaria", "droga raia", "drogasil", "pacheco"],
    category: "Farmácia/Saúde",
    tipo: "despesa",
  },
  {
    keywords: ["netflix", "spotify", "disney", "amazon prime", "hbo", "globoplay", "youtube"],
    category: "Streaming/Assinaturas",
    tipo: "despesa",
  },
  {
    keywords: ["google", "meta", "facebook", "instagram", "tiktok", "linkedin"],
    category: "Marketing Digital",
    tipo: "despesa",
  },
  {
    keywords: ["insumo", "material", "fornecedor"],
    category: "Insumos/Materiais",
    tipo: "despesa",
  },
  {
    keywords: ["funcionário", "funcionario", "salário", "salario", "fgts", "inss"],
    category: "Folha de Pagamento",
    tipo: "despesa",
  },
  { keywords: ["contador", "contabil", "contábil"], category: "Contabilidade", tipo: "despesa" },
  {
    keywords: ["simples nacional", "das", "darf", "imposto"],
    category: "Impostos",
    tipo: "despesa",
  },
  { keywords: ["saque"], category: "Saque", tipo: "despesa" },
  { keywords: ["boleto"], category: "Boletos", tipo: "despesa" },
  {
    keywords: ["debito automatico", "débito automático"],
    category: "Débito Automático",
    tipo: "despesa",
  },
];

/**
 * Suggest category based on description keywords
 */
function suggestCategory(description: string, tipo: "receita" | "despesa"): string {
  const descLower = description.toLowerCase();

  for (const rule of CATEGORY_KEYWORDS) {
    // Skip if tipo doesn't match (unless rule is "both")
    if (rule.tipo !== "both" && rule.tipo !== tipo) continue;

    for (const keyword of rule.keywords) {
      if (descLower.includes(keyword)) {
        return rule.category;
      }
    }
  }

  // Fallback: generate generic category from description
  // Extract first meaningful word
  const words = description.split(/[\s\-/]+/);
  const firstWord = words.find((w) => w.length > 3 && !/^\d+$/.test(w));

  if (firstWord) {
    const capitalized = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    return tipo === "receita" ? `${capitalized} (Receita)` : `${capitalized} (Despesa)`;
  }

  return tipo === "receita" ? "Outras Receitas" : "Outras Despesas";
}

/**
 * Detect period (year/month) from parsed dates
 */
function detectPeriod(dates: string[]): DetectedPeriod | null {
  if (dates.length === 0) return null;

  // Count occurrences of each year-month
  const counts = new Map<string, number>();

  for (const date of dates) {
    const [year, month] = date.split("-");
    const key = `${year}-${month}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // Find most frequent period
  let maxCount = 0;
  let mostFrequent = "";

  for (const [key, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = key;
    }
  }

  if (!mostFrequent) return null;

  const [year, month] = mostFrequent.split("-");
  return { ano: Number.parseInt(year, 10), mes: Number.parseInt(month, 10) };
}

/**
 * Main function: Parse CSV content into transactions
 */
export function parseTransactions(content: string): ParseResult {
  const result: ParseResult = {
    transactions: [],
    errors: [],
    totalRows: 0,
    detectedPeriod: null,
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
      const suggestedCategory = suggestCategory(description, tipo);

      result.transactions.push({
        data: date,
        descricao: description,
        valor: valorCentavos,
        tipo,
        suggestedCategory,
      });
    } catch {
      // Skip malformed row
    }
  }

  // Detect period from all parsed dates
  const allDates = result.transactions.map((t) => t.data);
  result.detectedPeriod = detectPeriod(allDates);

  return result;
}
