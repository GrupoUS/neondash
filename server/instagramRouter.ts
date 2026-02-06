/**
 * Instagram tRPC Router
 * Handles Instagram OAuth flow and data management endpoints.
 *
 * @module instagramRouter
 */

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { mentorados } from "../drizzle/schema";
import { createLogger } from "./_core/logger";
import { mentoradoProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as instagramPublishService from "./services/instagramPublishService";
import { instagramService } from "./services/instagramService";

const logger = createLogger({ service: "instagram-router" });

export const instagramRouter = router({
  /**
   * Check if Instagram OAuth is configured
   */
  isConfigured: publicProcedure.query(() => {
    return {
      configured: instagramService.isInstagramConfigured(),
    };
  }),

  /**
   * Get OAuth authorization URL for a mentorado
   */
  getAuthUrl: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .mutation(({ input }) => {
      if (!instagramService.isInstagramConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Instagram OAuth não está configurado. Contate o administrador.",
        });
      }

      const authUrl = instagramService.getAuthUrl(input.mentoradoId);
      return { authUrl };
    }),

  /**
   * Check connection status for a mentorado
   */
  getConnectionStatus: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ input }) => {
      const token = await instagramService.getInstagramToken(input.mentoradoId);

      if (!token) {
        return {
          isConnected: false,
          instagramAccountId: null,
          instagramUsername: null,
          lastSyncAt: null,
        };
      }

      return {
        isConnected: true,
        instagramAccountId: token.instagramBusinessAccountId,
        instagramUsername: token.instagramUsername,
        lastSyncAt: token.updatedAt,
        expiresAt: token.expiresAt,
      };
    }),

  /**
   * Delete all Instagram data for the current user
   * Used for Meta data deletion compliance
   */
  deleteMyData: protectedProcedure.mutation(async ({ ctx }) => {
    const mentoradoId = ctx.mentorado?.id;
    const userId = ctx.user?.id;

    if (!mentoradoId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Nenhum perfil de mentorado encontrado para este usuário.",
      });
    }

    logger.info("delete_data_request", { mentoradoId, userId });

    try {
      // Revoke access and delete all Instagram data
      const success = await instagramService.revokeAccess(mentoradoId, logger);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao remover dados do Instagram. Tente novamente.",
        });
      }

      logger.info("delete_data_success", { mentoradoId });

      return {
        success: true,
        message: "Todos os dados do Instagram foram removidos com sucesso.",
      };
    } catch (error) {
      logger.error("delete_data_failed", error, { mentoradoId });

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao processar solicitação de exclusão de dados.",
      });
    }
  }),

  /**
   * Save Instagram token from Facebook SDK login
   */
  saveToken: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
        accessToken: z.string(),
        instagramAccountId: z.string(),
        instagramUsername: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      logger.info("save_token", {
        mentoradoId: input.mentoradoId,
        instagramAccountId: input.instagramAccountId,
      });

      try {
        // Exchange short-lived token from FB SDK for long-lived token (60 days)
        const longLivedResponse = await instagramService.exchangeForLongLivedToken(
          input.accessToken
        );

        const expiresAt = new Date(Date.now() + longLivedResponse.expires_in * 1000);

        await instagramService.upsertInstagramToken({
          mentoradoId: input.mentoradoId,
          accessToken: longLivedResponse.access_token,
          expiresAt,
          scope: "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement",
          instagramBusinessAccountId: input.instagramAccountId,
          instagramUsername: input.instagramUsername,
        });

        // Update connection status in mentorados table
        const db = getDb();
        await db
          .update(mentorados)
          .set({
            instagramConnected: "sim",
            instagramBusinessAccountId: input.instagramAccountId,
            updatedAt: new Date(),
          })
          .where(eq(mentorados.id, input.mentoradoId));

        return { success: true };
      } catch (error) {
        logger.error("save_token_failed", error, { mentoradoId: input.mentoradoId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao salvar token do Instagram.",
        });
      }
    }),

  /**
   * Disconnect Instagram
   */
  disconnect: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await instagramService.revokeAccess(input.mentoradoId, logger);

      return {
        success,
        message: success ? "Instagram desconectado com sucesso." : "Erro ao desconectar Instagram.",
      };
    }),

  /**
   * Manually trigger sync for a mentorado
   */
  syncMetrics: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
        ano: z.number().min(2020).max(2100),
        mes: z.number().min(1).max(12),
      })
    )
    .mutation(async ({ input }) => {
      const result = await instagramService.syncMentoradoMetrics(
        input.mentoradoId,
        input.ano,
        input.mes
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.errorMessage ?? "Erro ao sincronizar métricas.",
        });
      }

      return {
        success: true,
        posts: result.postsCount,
        stories: result.storiesCount,
      };
    }),

  /**
   * Get metrics history for the last 6 months
   */
  getMetricsHistory: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ input }) => {
      const history = await instagramService.getMetricsHistory(input.mentoradoId, 6);

      // Format with month labels
      const months = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];

      return history.map((h) => ({
        ano: h.ano,
        mes: h.mes,
        label: `${months[h.mes - 1]}/${h.ano.toString().slice(-2)}`,
        postsFeed: h.postsFeed,
        stories: h.stories,
        followers: h.followers,
        engagement: h.engagement,
      }));
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLISHING PROCEDURES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Publish a marketing post to Instagram
   */
  publishMarketingPost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      logger.info("publish_marketing_post", { postId: input.postId });

      const result = await instagramPublishService.publishMarketingPost(input.postId);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Erro ao publicar post.",
        });
      }

      return {
        success: true,
        mediaId: result.mediaId,
      };
    }),

  /**
   * Publish a post directly with image URL and caption
   */
  publishPost: mentoradoProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        caption: z.string().max(2200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      logger.info("publish_post", { mentoradoId: ctx.mentorado.id, userId: ctx.user.id });

      const result = await instagramPublishService.publishPost(
        ctx.mentorado.id,
        input.imageUrl,
        input.caption
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Erro ao publicar post.",
        });
      }

      return {
        success: true,
        mediaId: result.mediaId,
      };
    }),

  /**
   * Get publishing rate limits for a mentorado
   */
  getPublishingLimits: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ input }) => {
      const limits = await instagramPublishService.getPublishingLimits(input.mentoradoId);

      if (!limits) {
        return {
          available: false,
          quotaUsage: 0,
          quotaTotal: 25,
          quotaRemaining: 0,
        };
      }

      return {
        available: true,
        ...limits,
      };
    }),

  /**
   * Check if mentorado can publish more content today
   */
  canPublish: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ input }) => {
      const canPublish = await instagramPublishService.canPublish(input.mentoradoId);
      return { canPublish };
    }),
});
