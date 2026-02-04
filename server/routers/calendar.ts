/**
 * Calendar Router - Google Calendar integration
 */

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { googleTokens } from "../../drizzle/schema";
import { createLogger } from "../_core/logger";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  createEvent,
  deleteEvent,
  exchangeCodeForTokens,
  getAuthUrl,
  getEvents,
  isGoogleConfigured,
  refreshAccessToken,
  revokeToken,
  updateEvent,
} from "../services/googleCalendarService";
import { clearICalCache, getNeonCalendarEvents, type ICalEvent } from "../services/icalService";

const logger = createLogger({ service: "calendarRouter" });

export const calendarRouter = router({
  /**
   * Check if Google Calendar is configured and user's connection status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const configured = isGoogleConfigured();

    if (!ctx.user) {
      return { configured, connected: false };
    }

    const [token] = await db
      .select()
      .from(googleTokens)
      .where(eq(googleTokens.userId, ctx.user.id))
      .limit(1);

    return {
      configured,
      connected: Boolean(token),
      expiresAt: token?.expiresAt,
    };
  }),

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl: protectedProcedure.query(({ ctx }) => {
    if (!isGoogleConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Google Calendar não está configurado.",
      });
    }

    // Use user ID as state for validation on callback
    const state = ctx.user?.id.toString() || "";
    return { url: getAuthUrl(state) };
  }),

  /**
   * Handle OAuth callback and store tokens
   */
  handleCallback: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Validate state matches user ID
      if (input.state && input.state !== ctx.user.id.toString()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "State parameter inválido.",
        });
      }

      try {
        const tokenResponse = await exchangeCodeForTokens(input.code);

        // Calculate expiration timestamp
        const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

        // Upsert tokens (delete existing, insert new)
        await db.delete(googleTokens).where(eq(googleTokens.userId, ctx.user.id));

        await db.insert(googleTokens).values({
          userId: ctx.user.id,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt,
          scope: tokenResponse.scope,
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Falha ao conectar Google Calendar.",
        });
      }
    }),

  /**
   * Get calendar events for a date range
   */
  getEvents: protectedProcedure
    .input(
      z
        .object({
          timeMin: z.string().datetime().optional(),
          timeMax: z.string().datetime().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [token] = await db
        .select()
        .from(googleTokens)
        .where(eq(googleTokens.userId, ctx.user.id))
        .limit(1);

      if (!token) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Google Calendar não conectado.",
        });
      }

      // Check if token is expired and refresh if needed
      let accessToken = token.accessToken;
      if (new Date() >= token.expiresAt) {
        if (!token.refreshToken) {
          // Token expired and no refresh token - user needs to reconnect
          await db.delete(googleTokens).where(eq(googleTokens.userId, ctx.user.id));
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Sessão expirada. Por favor, reconecte o Google Calendar.",
          });
        }

        try {
          const refreshed = await refreshAccessToken(token.refreshToken);
          accessToken = refreshed.access_token;
          const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

          await db
            .update(googleTokens)
            .set({
              accessToken: refreshed.access_token,
              expiresAt,
              updatedAt: new Date(),
            })
            .where(eq(googleTokens.userId, ctx.user.id));
        } catch {
          // Refresh failed - user needs to reconnect
          await db.delete(googleTokens).where(eq(googleTokens.userId, ctx.user.id));
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Falha ao atualizar sessão. Por favor, reconecte o Google Calendar.",
          });
        }
      }

      // Default to current month if no range specified
      const now = new Date();
      const timeMin = input?.timeMin
        ? new Date(input.timeMin)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const timeMax = input?.timeMax
        ? new Date(input.timeMax)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      try {
        const events = await getEvents(accessToken, timeMin, timeMax);
        return { events };
      } catch (error) {
        // Check if it's a 401 error (token revoked by user)
        if (error instanceof Error && error.message.includes("401")) {
          await db.delete(googleTokens).where(eq(googleTokens.userId, ctx.user.id));
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Acesso revogado. Por favor, reconecte o Google Calendar.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Falha ao buscar eventos.",
        });
      }
    }),

  /**
   * Disconnect Google Calendar
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const [token] = await db
      .select()
      .from(googleTokens)
      .where(eq(googleTokens.userId, ctx.user.id))
      .limit(1);

    if (token) {
      // Try to revoke the token
      try {
        await revokeToken(token.accessToken);
      } catch {
        // Ignore revocation errors - token might already be revoked
      }

      // Delete from database
      await db.delete(googleTokens).where(eq(googleTokens.userId, ctx.user.id));
    }

    return { success: true };
  }),

  /**
   * Create a new event
   */
  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        start: z.string().datetime(), // ISO string
        end: z.string().datetime(), // ISO string
        allDay: z.boolean().default(false),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [token] = await db
        .select()
        .from(googleTokens)
        .where(eq(googleTokens.userId, ctx.user.id))
        .limit(1);

      if (!token) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Google Calendar não conectado.",
        });
      }

      // TODO: Refactor token refresh logic into reusable function
      // For now assuming token is valid or client handles error

      try {
        const event = await createEvent(token.accessToken, {
          title: input.title,
          description: input.description,
          start: new Date(input.start),
          end: new Date(input.end),
          allDay: input.allDay,
          location: input.location,
        });
        return { success: true, event };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Falha ao criar evento.",
        });
      }
    }),

  /**
   * Update an event
   */
  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        start: z.string().datetime().optional(),
        end: z.string().datetime().optional(),
        allDay: z.boolean().optional(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      logger.debug("updateEvent called", {
        userId: ctx.user?.id,
        eventId: input.id,
        hasStart: Boolean(input.start),
        hasEnd: Boolean(input.end),
        allDay: input.allDay,
      });

      const db = getDb();

      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [token] = await db
        .select()
        .from(googleTokens)
        .where(eq(googleTokens.userId, ctx.user.id))
        .limit(1);

      if (!token) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Google Calendar não conectado.",
        });
      }

      // Check if token has write permission (calendar.events scope)
      if (token.scope && !token.scope.includes("calendar.events")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Permissão insuficiente. Desconecte e reconecte o Google Calendar para atualizar permissões.",
        });
      }

      // Refresh token if expired
      let accessToken = token.accessToken;
      if (new Date() >= token.expiresAt) {
        if (!token.refreshToken) {
          await db.delete(googleTokens).where(eq(googleTokens.userId, ctx.user.id));
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Sessão expirada. Por favor, reconecte o Google Calendar.",
          });
        }

        try {
          const refreshed = await refreshAccessToken(token.refreshToken);
          accessToken = refreshed.access_token;
          const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

          await db
            .update(googleTokens)
            .set({
              accessToken: refreshed.access_token,
              expiresAt,
              updatedAt: new Date(),
            })
            .where(eq(googleTokens.userId, ctx.user.id));
        } catch {
          await db.delete(googleTokens).where(eq(googleTokens.userId, ctx.user.id));
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Falha ao atualizar sessão. Por favor, reconecte o Google Calendar.",
          });
        }
      }

      // Parse and validate dates
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (input.start) {
        startDate = new Date(input.start);
        if (Number.isNaN(startDate.getTime())) {
          logger.error("Invalid start date received", { start: input.start });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Data de início inválida: ${input.start}`,
          });
        }
      }

      if (input.end) {
        endDate = new Date(input.end);
        if (Number.isNaN(endDate.getTime())) {
          logger.error("Invalid end date received", { end: input.end });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Data de término inválida: ${input.end}`,
          });
        }
      }

      // Validate that start < end if both are provided
      if (startDate && endDate && startDate >= endDate) {
        logger.error("Start date is after end date", { start: input.start, end: input.end });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de início deve ser anterior à data de término.",
        });
      }

      try {
        const event = await updateEvent(accessToken, input.id, {
          title: input.title,
          description: input.description,
          start: startDate,
          end: endDate,
          allDay: input.allDay,
          location: input.location,
        });
        logger.debug("Event updated successfully", { eventId: event.id, title: event.title });
        return { success: true, event };
      } catch (error) {
        // Check for scope/permission errors from Google API
        const errorMsg = error instanceof Error ? error.message : "";
        logger.error("Failed to update event", {
          error: errorMsg,
          eventId: input.id,
          userId: ctx.user.id,
        });

        if (
          errorMsg.includes("403") ||
          errorMsg.includes("PERMISSION") ||
          errorMsg.includes("SCOPE")
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Permissão negada pelo Google. Desconecte e reconecte sua conta para atualizar permissões.",
          });
        }

        // Check for invalid date/time errors
        if (errorMsg.includes("Invalid start time") || errorMsg.includes("Invalid end time")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Formato de data inválido para o Google Calendar. Detalhes: ${errorMsg}`,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Falha ao atualizar evento.",
        });
      }
    }),

  /**
   * Delete an event
   */
  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [token] = await db
        .select()
        .from(googleTokens)
        .where(eq(googleTokens.userId, ctx.user.id))
        .limit(1);

      if (!token) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Google Calendar não conectado.",
        });
      }

      try {
        await deleteEvent(token.accessToken, input.id);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Falha ao excluir evento.",
        });
      }
    }),

  /**
   * Get public Neon calendar events (no auth required)
   * Fetches from public iCal feed and caches for 5 minutes
   */
  getNeonCalendarEvents: publicProcedure.query(async (): Promise<{ events: ICalEvent[] }> => {
    try {
      const events = await getNeonCalendarEvents();
      return { events };
    } catch {
      // Return empty array instead of throwing - graceful degradation
      return { events: [] };
    }
  }),

  /**
   * Force refresh Neon calendar cache
   */
  refreshNeonCalendar: protectedProcedure.mutation(async (): Promise<{ success: boolean }> => {
    clearICalCache();
    try {
      await getNeonCalendarEvents();
      return { success: true };
    } catch {
      return { success: false };
    }
  }),
});
