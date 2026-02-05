/**
 * Alert Service
 *
 * Statistical alert calculations with Z-score fallback logic
 * and AI-powered topic suggestions for mentor calls.
 */

import { generateText } from "ai";
import { and, desc, eq } from "drizzle-orm";
import { callNotes, mentorados, metricasMensais } from "../../drizzle/schema";
import { defaultModel, isAIConfigured } from "../_core/aiProvider";
import { createLogger } from "../_core/logger";
import { getDb } from "../db";
import type {
  Alert,
  AlertCalculationResult,
  AlertLevel,
  AlertMetric,
  MetricsData,
  TopicSuggestions,
} from "../types/mentor";

const logger = createLogger({ service: "alertService" });

// Minimum sample size for Z-score calculation (fallback to previous month if < this)
const MIN_SAMPLE_SIZE = 5;

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICAL CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate the arithmetic mean of a set of values
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate the standard deviation of a set of values
 * @param values - Array of numbers
 * @param mean - Pre-calculated mean (for efficiency)
 */
export function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((val) => (val - mean) ** 2);
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate Z-score: (value - μ) / σ
 * Returns null if standard deviation is 0 (prevents division by zero)
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number | null {
  if (stdDev === 0) return null;
  return (value - mean) / stdDev;
}

/**
 * Calculate percentage change between current and previous values
 * Returns null if previous is 0 (prevents division by zero)
 */
export function calculatePercentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Classify alert level based on Z-score and percent change thresholds
 *
 * - vermelho: Z-score < -1.5 OR percentChange < -30%
 * - amarelo: -1.5 ≤ Z-score < -0.5 OR percentChange between -30% and -15%
 * - verde: Z-score ≥ -0.5
 */
export function classifyAlert(zScore: number | null, percentChange: number | null): AlertLevel {
  // Check percent change thresholds first (more straightforward)
  if (percentChange !== null && percentChange < -30) {
    return "vermelho";
  }
  if (percentChange !== null && percentChange < -15) {
    return "amarelo";
  }

  // Check Z-score thresholds
  if (zScore !== null) {
    if (zScore < -1.5) return "vermelho";
    if (zScore < -0.5) return "amarelo";
  }

  return "verde";
}

/**
 * Generate a human-readable message for an alert
 */
function generateAlertMessage(
  metrica: AlertMetric,
  level: AlertLevel,
  zScore: number | null,
  percentChange: number | null,
  usedFallback: boolean
): string {
  const metricaLabel = {
    faturamento: "Faturamento",
    leads: "Leads",
    procedimentos: "Procedimentos",
  }[metrica];

  const levelLabel = {
    vermelho: "crítico",
    amarelo: "atenção",
    verde: "normal",
  }[level];

  const parts = [`${metricaLabel} em nível ${levelLabel}`];

  if (percentChange !== null) {
    const direction = percentChange < 0 ? "queda" : "aumento";
    parts.push(`(${direction} de ${Math.abs(percentChange).toFixed(1)}%)`);
  }

  if (zScore !== null) {
    parts.push(`Z-score: ${zScore.toFixed(2)}`);
  }

  if (usedFallback) {
    parts.push("(comparado com mês anterior devido a amostra pequena)");
  }

  return parts.join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ALERT CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate alerts for a mentorado based on their metrics compared to turma
 *
 * Algorithm:
 * 1. Fetch mentorado's metrics for the specified month
 * 2. Fetch all turma metrics for the same month
 * 3. If turma metrics < 5, fallback to previous month
 * 4. Calculate Z-scores and classify alerts for each metric
 * 5. Add special alerts (sem registro, registro atrasado, etc.)
 */
export async function calculateAlerts(
  mentoradoId: number,
  ano: number,
  mes: number
): Promise<AlertCalculationResult> {
  const db = getDb();
  const alerts: Alert[] = [];
  let usedFallback = false;
  let fallbackMonth: { ano: number; mes: number } | undefined;

  try {
    // 1. Get mentorado info (for turma)
    const [mentorado] = await db
      .select({
        id: mentorados.id,
        turma: mentorados.turma,
        metaFaturamento: mentorados.metaFaturamento,
      })
      .from(mentorados)
      .where(eq(mentorados.id, mentoradoId))
      .limit(1);

    if (!mentorado) {
      logger.warn("Mentorado not found for alerts", { mentoradoId });
      return { alerts: [], usedFallback: false };
    }

    // 2. Get mentorado's metrics for the month
    const [userMetrics] = await db
      .select()
      .from(metricasMensais)
      .where(
        and(
          eq(metricasMensais.mentoradoId, mentoradoId),
          eq(metricasMensais.ano, ano),
          eq(metricasMensais.mes, mes)
        )
      )
      .limit(1);

    // Special alert: Sem Registro
    if (!userMetrics) {
      alerts.push({
        tipo: "sem_registro",
        level: "vermelho",
        message: "Nenhuma métrica registrada para este mês",
      });
      return { alerts, usedFallback: false };
    }

    // Special alert: Registro Atrasado (after day 5)
    if (userMetrics.createdAt) {
      const createdDay = userMetrics.createdAt.getDate();
      if (createdDay > 5) {
        alerts.push({
          tipo: "registro_atrasado",
          level: "amarelo",
          message: `Métricas registradas com atraso (dia ${createdDay})`,
        });
      }
    }

    // 3. Get turma metrics for the same month
    let turmaMetrics = await db
      .select({
        mentoradoId: metricasMensais.mentoradoId,
        faturamento: metricasMensais.faturamento,
        leads: metricasMensais.leads,
        procedimentos: metricasMensais.procedimentos,
      })
      .from(metricasMensais)
      .innerJoin(mentorados, eq(mentorados.id, metricasMensais.mentoradoId))
      .where(
        and(
          eq(mentorados.turma, mentorado.turma),
          eq(metricasMensais.ano, ano),
          eq(metricasMensais.mes, mes)
        )
      );

    // Fallback: If sample size < MIN_SAMPLE_SIZE, use previous month
    if (turmaMetrics.length < MIN_SAMPLE_SIZE) {
      let prevMes = mes - 1;
      let prevAno = ano;
      if (prevMes === 0) {
        prevMes = 12;
        prevAno = ano - 1;
      }

      turmaMetrics = await db
        .select({
          mentoradoId: metricasMensais.mentoradoId,
          faturamento: metricasMensais.faturamento,
          leads: metricasMensais.leads,
          procedimentos: metricasMensais.procedimentos,
        })
        .from(metricasMensais)
        .innerJoin(mentorados, eq(mentorados.id, metricasMensais.mentoradoId))
        .where(
          and(
            eq(mentorados.turma, mentorado.turma),
            eq(metricasMensais.ano, prevAno),
            eq(metricasMensais.mes, prevMes)
          )
        );

      if (turmaMetrics.length >= MIN_SAMPLE_SIZE) {
        usedFallback = true;
        fallbackMonth = { ano: prevAno, mes: prevMes };
        logger.info("Using fallback month for Z-score calculation", {
          mentoradoId,
          originalMonth: { ano, mes },
          fallbackMonth,
        });
      }
    }

    // 4. Get previous month metrics for percent change calculation
    let prevMes = mes - 1;
    let prevAno = ano;
    if (prevMes === 0) {
      prevMes = 12;
      prevAno = ano - 1;
    }

    const [prevMetrics] = await db
      .select()
      .from(metricasMensais)
      .where(
        and(
          eq(metricasMensais.mentoradoId, mentoradoId),
          eq(metricasMensais.ano, prevAno),
          eq(metricasMensais.mes, prevMes)
        )
      )
      .limit(1);

    // 5. Calculate Z-scores and classify alerts for each metric
    const metricsToCheck: AlertMetric[] = ["faturamento", "leads", "procedimentos"];

    for (const metrica of metricsToCheck) {
      const userValue = userMetrics[metrica];
      const prevValue = prevMetrics?.[metrica] ?? null;
      const turmaValues = turmaMetrics.map((m) => m[metrica]);

      // Calculate statistics
      const mean = calculateMean(turmaValues);
      const stdDev = calculateStandardDeviation(turmaValues, mean);
      const zScore = calculateZScore(userValue, mean, stdDev);
      const percentChange =
        prevValue !== null ? calculatePercentChange(userValue, prevValue) : null;

      // Classify alert level
      const level = classifyAlert(zScore, percentChange);

      // Only add non-verde alerts
      if (level !== "verde") {
        alerts.push({
          tipo: "zscore",
          metrica,
          level,
          zScore: zScore ?? undefined,
          percentChange: percentChange ?? undefined,
          message: generateAlertMessage(metrica, level, zScore, percentChange, usedFallback),
          usedFallback,
        });
      }

      // Special: Queda Abrupta (> 50% drop)
      if (percentChange !== null && percentChange < -50) {
        alerts.push({
          tipo: "queda_abrupta",
          metrica,
          level: "vermelho",
          percentChange,
          message: `Queda abrupta de ${Math.abs(percentChange).toFixed(1)}% em ${metrica}`,
        });
      }
    }

    // 6. Special alert: Meta Não Atingida 2+ meses consecutivos
    if (mentorado.metaFaturamento) {
      // Check current and previous month
      const currentMet = userMetrics.faturamento >= mentorado.metaFaturamento;
      const previousMet = prevMetrics ? prevMetrics.faturamento >= mentorado.metaFaturamento : true;

      if (!currentMet && !previousMet) {
        alerts.push({
          tipo: "meta_nao_atingida",
          metrica: "faturamento",
          level: "vermelho",
          message: "Meta de faturamento não atingida por 2 meses consecutivos",
        });
      }
    }

    return { alerts, usedFallback, fallbackMonth };
  } catch (error) {
    logger.error("Error calculating alerts", { error, mentoradoId, ano, mes });
    return { alerts: [], usedFallback: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AI TOPIC SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate topic suggestions for a mentor call using AI
 *
 * Falls back to rule-based suggestions if AI fails
 */
export async function generateTopicSuggestions(
  mentoradoNome: string,
  alerts: Alert[],
  currentMetrics: MetricsData | null,
  metaFaturamento: number,
  mes: number,
  ano: number
): Promise<TopicSuggestions> {
  // Build AI prompt
  const alertsText =
    alerts.length > 0
      ? alerts.map((a) => `- [${a.level.toUpperCase()}] ${a.message}`).join("\n")
      : "Nenhum alerta ativo";

  const metricsText = currentMetrics
    ? `
- Faturamento: R$ ${currentMetrics.faturamento.toLocaleString("pt-BR")} (Meta: R$ ${metaFaturamento.toLocaleString("pt-BR")})
- Leads: ${currentMetrics.leads}
- Procedimentos: ${currentMetrics.procedimentos}
`
    : "Métricas não disponíveis";

  const prompt = `Você é um mentor de negócios especializado em estética. Analise os dados abaixo e sugira 3-5 tópicos específicos para discutir na próxima call de mentoria:

Mentorado: ${mentoradoNome}
Métricas Atuais (${mes}/${ano}):
${metricsText}

Alertas Ativos:
${alertsText}

Retorne apenas uma lista numerada de tópicos acionáveis e específicos. Cada tópico deve ser uma frase curta e direta.`;

  // Try AI generation
  if (isAIConfigured()) {
    try {
      const result = await generateText({
        model: defaultModel,
        prompt,
        maxTokens: 500,
      });

      // Parse numbered list from response
      const lines = result.text.split("\n").filter((line) => line.trim());
      const suggestions = lines
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, 5);

      if (suggestions.length > 0) {
        return { suggestions, source: "ai" };
      }
    } catch (error) {
      logger.error("AI topic generation failed, using fallback", { error });
    }
  }

  // Fallback: Rule-based suggestions
  const suggestions: string[] = [];

  // Add suggestions based on alerts
  for (const alert of alerts) {
    if (alert.metrica === "faturamento") {
      suggestions.push("Revisar estratégia de precificação e mix de serviços");
    }
    if (alert.metrica === "leads") {
      suggestions.push("Otimizar funil de captação e fontes de tráfego");
    }
    if (alert.metrica === "procedimentos") {
      suggestions.push("Analisar taxa de conversão lead-procedimento");
    }
    if (alert.tipo === "meta_nao_atingida") {
      suggestions.push("Definir plano de ação emergencial para atingir meta");
    }
    if (alert.tipo === "queda_abrupta") {
      suggestions.push("Investigar causas da queda abrupta de performance");
    }
  }

  // Add generic suggestions if none from alerts
  if (suggestions.length === 0) {
    suggestions.push(
      "Revisar metas e KPIs para o próximo mês",
      "Analisar evolução comparada à turma",
      "Identificar oportunidades de crescimento"
    );
  }

  // Dedupe and limit
  const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

  return { suggestions: uniqueSuggestions, source: "fallback" };
}

/**
 * Get the last call notes for a mentorado
 */
export async function getLastCallNotes(mentoradoId: number) {
  const db = getDb();

  const [lastNote] = await db
    .select()
    .from(callNotes)
    .where(eq(callNotes.mentoradoId, mentoradoId))
    .orderBy(desc(callNotes.dataCall))
    .limit(1);

  return lastNote ?? null;
}
