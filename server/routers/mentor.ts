/**
 * Mentor Router
 *
 * tRPC router for mentor-specific procedures:
 * - getUpcomingCalls: Fetch upcoming calls from Google Calendar with alert indicators
 * - getCallPreparation: Comprehensive call preparation data
 * - saveCallNotes: Save call notes after a mentoring session
 * - generateTopicSuggestions: Generate AI-powered topic suggestions
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { callNotes, googleTokens, mentorados, metricasMensais } from "../../drizzle/schema";
import { createLogger } from "../_core/logger";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  calculateAlerts,
  generateTopicSuggestions,
  getLastCallNotes,
} from "../services/alertService";
import { getEvents, refreshAccessToken } from "../services/googleCalendarService";
import type { Alert, CallPreparationPayload, UpcomingCall } from "../types/mentor";

const logger = createLogger({ service: "mentorRouter" });

// ═══════════════════════════════════════════════════════════════════════════
// INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const getUpcomingCallsInput = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const getCallPreparationInput = z.object({
  mentoradoId: z.number().positive(),
});

const saveCallNotesInput = z.object({
  mentoradoId: z.number().positive(),
  dataCall: z.date(),
  principaisInsights: z.string().min(10, "Insights devem ter pelo menos 10 caracteres"),
  acoesAcordadas: z.string().min(10, "Ações devem ter pelo menos 10 caracteres"),
  proximosPassos: z.string().min(10, "Próximos passos devem ter pelo menos 10 caracteres"),
  duracaoMinutos: z.number().positive().optional(),
});

const generateTopicSuggestionsInput = z.object({
  mentoradoId: z.number().positive(),
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract mentorado name from calendar event title or description
 * Pattern matching for common naming conventions
 */
function extractMentoradoName(title: string, description?: string): string | null {
  // Common patterns: "Call - Dr. João", "Mentoria Dr. Maria", "1:1 Ana Paula"
  const patterns = [
    /(?:call|mentoria|1:1|reunião)\s*[-:]\s*(?:dra?\.?\s*)?([A-Za-zÀ-ÿ\s]+)/i,
    /(?:dra?\.?\s*)([A-Za-zÀ-ÿ\s]+?)(?:\s*[-:]\s*(?:call|mentoria))/i,
    /^([A-Za-zÀ-ÿ\s]+?)\s*[-:]/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  // Also check description
  if (description) {
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
  }

  return null;
}

/**
 * Get valid access token, refreshing if expired
 */
async function getValidAccessToken(userId: number): Promise<string | null> {
  const db = getDb();

  const [token] = await db
    .select()
    .from(googleTokens)
    .where(eq(googleTokens.userId, userId))
    .limit(1);

  if (!token) {
    return null;
  }

  // Check if token is expired
  if (token.expiresAt && new Date() > token.expiresAt) {
    if (!token.refreshToken) {
      return null;
    }

    try {
      const newTokens = await refreshAccessToken(token.refreshToken);
      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

      await db
        .update(googleTokens)
        .set({
          accessToken: newTokens.access_token,
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(googleTokens.userId, userId));

      return newTokens.access_token;
    } catch (error) {
      logger.error("Failed to refresh access token", { error, userId });
      return null;
    }
  }

  return token.accessToken;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════

export const mentorRouter = router({
  /**
   * Fetch upcoming calls from Google Calendar with alert indicators
   *
   * @input startDate - Optional start date (defaults to today)
   * @input endDate - Optional end date (defaults to 30 days from start)
   * @returns Array of calls with mentorado info and alerts
   */
  getUpcomingCalls: adminProcedure.input(getUpcomingCallsInput).query(async ({ ctx, input }) => {
    const db = getDb();
    const now = new Date();

    // Default date range
    const startDate = input.startDate ?? now;
    const endDate = input.endDate ?? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get admin user's Google token
    const accessToken = await getValidAccessToken(ctx.user.id);

    if (!accessToken) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Google Calendar não conectado. Por favor, conecte sua conta Google.",
      });
    }

    try {
      // Fetch events from Google Calendar
      const events = await getEvents(accessToken, startDate, endDate, 50);

      // Filter for call/mentoria events
      const callEvents = events.filter(
        (event) =>
          event.title.toLowerCase().includes("call") ||
          event.title.toLowerCase().includes("mentoria") ||
          event.title.toLowerCase().includes("1:1")
      );

      // Get all mentorados for name matching
      const allMentorados = await db.select().from(mentorados).where(eq(mentorados.ativo, "sim"));

      // Build result with alerts
      const result: UpcomingCall[] = [];

      for (const event of callEvents) {
        // Try to match mentorado from event
        const extractedName = extractMentoradoName(event.title, event.description);
        let matchedMentorado: (typeof allMentorados)[0] | undefined;

        if (extractedName) {
          // Find mentorado by partial name match
          matchedMentorado = allMentorados.find((m) =>
            m.nomeCompleto.toLowerCase().includes(extractedName.toLowerCase())
          );
        }

        // Calculate alerts if mentorado matched - use event date for context
        let alerts: Alert[] = [];
        if (matchedMentorado) {
          // Derive ano and mes from event's start date (Comment 2 fix)
          const eventDate = new Date(event.start);
          const eventYear = eventDate.getFullYear();
          const eventMonth = eventDate.getMonth() + 1;
          const alertResult = await calculateAlerts(matchedMentorado.id, eventYear, eventMonth);
          alerts = alertResult.alerts;
        }

        result.push({
          eventId: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          mentoradoId: matchedMentorado?.id ?? null,
          mentoradoNome: matchedMentorado?.nomeCompleto ?? extractedName,
          alerts,
        });
      }

      return result;
    } catch (error) {
      logger.error("Failed to fetch upcoming calls", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar eventos do calendário",
      });
    }
  }),

  /**
   * Get comprehensive call preparation data for a mentorado
   *
   * @input mentoradoId - ID of the mentorado
   * @returns Complete preparation payload with metrics, alerts, suggestions
   */
  getCallPreparation: adminProcedure
    .input(getCallPreparationInput)
    .query(async ({ input }): Promise<CallPreparationPayload> => {
      const db = getDb();
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // 1. Parallel data fetching
      const [mentorado, currentMetricsResult, evolutionMetrics, lastNotes] = await Promise.all([
        // Mentorado details
        db
          .select()
          .from(mentorados)
          .where(eq(mentorados.id, input.mentoradoId))
          .limit(1)
          .then((res) => res[0]),

        // Current month metrics
        db
          .select()
          .from(metricasMensais)
          .where(
            and(
              eq(metricasMensais.mentoradoId, input.mentoradoId),
              eq(metricasMensais.ano, currentYear),
              eq(metricasMensais.mes, currentMonth)
            )
          )
          .limit(1),

        // Last 6 months metrics for evolution
        db
          .select()
          .from(metricasMensais)
          .where(eq(metricasMensais.mentoradoId, input.mentoradoId))
          .orderBy(desc(metricasMensais.ano), desc(metricasMensais.mes))
          .limit(6),

        // Last call notes
        getLastCallNotes(input.mentoradoId),
      ]);

      if (!mentorado) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mentorado não encontrado",
        });
      }

      // Now fetch turma metrics filtered by mentorado's turma and excluding current mentorado
      const turmaMetricsResult = await db
        .select({
          mentoradoId: metricasMensais.mentoradoId,
          faturamento: metricasMensais.faturamento,
          leads: metricasMensais.leads,
          procedimentos: metricasMensais.procedimentos,
          lucro: metricasMensais.lucro,
          postsFeed: metricasMensais.postsFeed,
          stories: metricasMensais.stories,
        })
        .from(metricasMensais)
        .innerJoin(mentorados, eq(mentorados.id, metricasMensais.mentoradoId))
        .where(
          and(
            eq(metricasMensais.ano, currentYear),
            eq(metricasMensais.mes, currentMonth),
            eq(mentorados.turma, mentorado.turma)
          )
        );

      // Filter out current mentorado from comparison
      const turmaMetrics = turmaMetricsResult.filter((m) => m.mentoradoId !== input.mentoradoId);

      // 2. Calculate alerts
      const alertResult = await calculateAlerts(input.mentoradoId, currentYear, currentMonth);

      // 3. Calculate comparative stats
      const currentMetrics = currentMetricsResult[0] ?? null;
      let comparison: CallPreparationPayload["comparison"] = null;

      if (turmaMetrics.length > 0 && currentMetrics) {
        const avgFaturamento =
          turmaMetrics.reduce((acc, m) => acc + m.faturamento, 0) / turmaMetrics.length;
        const avgLeads = turmaMetrics.reduce((acc, m) => acc + m.leads, 0) / turmaMetrics.length;
        const avgProcedimentos =
          turmaMetrics.reduce((acc, m) => acc + m.procedimentos, 0) / turmaMetrics.length;
        const avgLucro = turmaMetrics.reduce((acc, m) => acc + m.lucro, 0) / turmaMetrics.length;
        const avgPostsFeed =
          turmaMetrics.reduce((acc, m) => acc + m.postsFeed, 0) / turmaMetrics.length;
        const avgStories =
          turmaMetrics.reduce((acc, m) => acc + m.stories, 0) / turmaMetrics.length;

        comparison = {
          userMetrics: {
            faturamento: currentMetrics.faturamento,
            leads: currentMetrics.leads,
            procedimentos: currentMetrics.procedimentos,
            lucro: currentMetrics.lucro,
            postsFeed: currentMetrics.postsFeed,
            stories: currentMetrics.stories,
          },
          turmaAverage: {
            faturamento: Math.round(avgFaturamento),
            leads: Math.round(avgLeads),
            procedimentos: Math.round(avgProcedimentos),
            lucro: Math.round(avgLucro),
            postsFeed: Math.round(avgPostsFeed),
            stories: Math.round(avgStories),
          },
          percentiles: null, // Could add percentile calculation here
        };
      }

      // 4. Generate topic suggestions
      const suggestions = await generateTopicSuggestions(
        mentorado.nomeCompleto,
        alertResult.alerts,
        currentMetrics
          ? {
              faturamento: currentMetrics.faturamento,
              leads: currentMetrics.leads,
              procedimentos: currentMetrics.procedimentos,
            }
          : null,
        mentorado.metaFaturamento,
        currentMonth,
        currentYear
      );

      // 5. Build and return payload
      return {
        mentorado: {
          id: mentorado.id,
          nomeCompleto: mentorado.nomeCompleto,
          fotoUrl: mentorado.fotoUrl,
          email: mentorado.email,
          turma: mentorado.turma,
          metaFaturamento: mentorado.metaFaturamento,
        },
        currentMetrics: currentMetrics
          ? {
              faturamento: currentMetrics.faturamento,
              leads: currentMetrics.leads,
              procedimentos: currentMetrics.procedimentos,
              lucro: currentMetrics.lucro,
              postsFeed: currentMetrics.postsFeed,
              stories: currentMetrics.stories,
            }
          : null,
        alerts: alertResult.alerts,
        evolution: evolutionMetrics
          .map((m) => ({
            ano: m.ano,
            mes: m.mes,
            faturamento: m.faturamento,
            leads: m.leads,
            procedimentos: m.procedimentos,
          }))
          .reverse(), // Oldest first for charts
        comparison,
        lastCallNotes: lastNotes
          ? {
              id: lastNotes.id,
              dataCall: lastNotes.dataCall,
              principaisInsights: lastNotes.principaisInsights,
              acoesAcordadas: lastNotes.acoesAcordadas,
              proximosPassos: lastNotes.proximosPassos,
              duracaoMinutos: lastNotes.duracaoMinutos,
            }
          : null,
        suggestions,
      };
    }),

  /**
   * Save call notes after a mentoring session
   *
   * @input mentoradoId - ID of the mentorado
   * @input dataCall - Date of the call
   * @input principaisInsights - Main insights from the call
   * @input acoesAcordadas - Actions agreed upon
   * @input proximosPassos - Next steps
   * @input duracaoMinutos - Optional duration in minutes
   * @returns Success status and note ID
   */
  saveCallNotes: adminProcedure.input(saveCallNotesInput).mutation(async ({ input }) => {
    const db = getDb();

    // Validate mentorado exists
    const [mentorado] = await db
      .select({ id: mentorados.id })
      .from(mentorados)
      .where(eq(mentorados.id, input.mentoradoId))
      .limit(1);

    if (!mentorado) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Mentorado não encontrado",
      });
    }

    // Insert call note
    const now = new Date();

    const [result] = await db
      .insert(callNotes)
      .values({
        mentoradoId: input.mentoradoId,
        dataCall: input.dataCall,
        principaisInsights: input.principaisInsights,
        acoesAcordadas: input.acoesAcordadas,
        proximosPassos: input.proximosPassos,
        duracaoMinutos: input.duracaoMinutos ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: callNotes.id });

    logger.info("Call notes saved", {
      noteId: result.id,
      mentoradoId: input.mentoradoId,
    });

    return { success: true, noteId: result.id };
  }),

  /**
   * Generate topic suggestions for a mentorado
   *
   * @input mentoradoId - ID of the mentorado
   * @returns Array of topic suggestions with source (ai/fallback)
   */
  generateTopicSuggestions: adminProcedure
    .input(generateTopicSuggestionsInput)
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Fetch mentorado and current metrics
      const [mentorado] = await db
        .select()
        .from(mentorados)
        .where(eq(mentorados.id, input.mentoradoId))
        .limit(1);

      if (!mentorado) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mentorado não encontrado",
        });
      }

      const [currentMetrics] = await db
        .select()
        .from(metricasMensais)
        .where(
          and(
            eq(metricasMensais.mentoradoId, input.mentoradoId),
            eq(metricasMensais.ano, currentYear),
            eq(metricasMensais.mes, currentMonth)
          )
        )
        .limit(1);

      // Calculate alerts
      const alertResult = await calculateAlerts(input.mentoradoId, currentYear, currentMonth);

      // Generate suggestions
      const suggestions = await generateTopicSuggestions(
        mentorado.nomeCompleto,
        alertResult.alerts,
        currentMetrics
          ? {
              faturamento: currentMetrics.faturamento,
              leads: currentMetrics.leads,
              procedimentos: currentMetrics.procedimentos,
            }
          : null,
        mentorado.metaFaturamento,
        currentMonth,
        currentYear
      );

      return suggestions;
    }),
});
