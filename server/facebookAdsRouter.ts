/**
 * Facebook Ads tRPC Router
 * Handles Facebook Ads OAuth flow and advertising metrics endpoints.
 *
 * @module facebookAdsRouter
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createLogger } from "./_core/logger";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { facebookAdsService } from "./services/facebookAdsService";

const logger = createLogger({ service: "facebook-ads-router" });

export const facebookAdsRouter = router({
  /**
   * Check if Facebook Ads OAuth is configured
   */
  isConfigured: publicProcedure.query(() => {
    return {
      configured: facebookAdsService.isFacebookAdsConfigured(),
    };
  }),

  /**
   * Get OAuth authorization URL for a mentorado
   */
  getAuthUrl: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .mutation(({ input }) => {
      if (!facebookAdsService.isFacebookAdsConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Facebook Ads OAuth não está configurado. Contate o administrador.",
        });
      }

      const authUrl = facebookAdsService.getAuthUrl(input.mentoradoId);
      return { authUrl };
    }),

  /**
   * Check connection status for a mentorado
   */
  getConnectionStatus: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ input }) => {
      const token = await facebookAdsService.getFacebookAdsToken(input.mentoradoId);

      if (!token) {
        return {
          isConnected: false,
          adAccountId: null,
          adAccountName: null,
          lastSyncAt: null,
        };
      }

      return {
        isConnected: true,
        adAccountId: token.adAccountId,
        adAccountName: token.adAccountName,
        lastSyncAt: token.updatedAt,
        expiresAt: token.expiresAt,
      };
    }),

  /**
   * Save Facebook Ads token and select ad account
   */
  saveToken: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
        accessToken: z.string(),
        adAccountId: z.string(),
        adAccountName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      logger.info("save_token", {
        mentoradoId: input.mentoradoId,
        adAccountId: input.adAccountId,
      });

      try {
        // Exchange short-lived token for long-lived token (60 days)
        const longLivedResponse = await facebookAdsService.exchangeForLongLivedToken(
          input.accessToken
        );

        const expiresAt = new Date(Date.now() + longLivedResponse.expires_in * 1000);

        await facebookAdsService.upsertFacebookAdsToken({
          mentoradoId: input.mentoradoId,
          accessToken: longLivedResponse.access_token,
          expiresAt,
          scope: "ads_read,business_management,pages_show_list",
          adAccountId: input.adAccountId,
          adAccountName: input.adAccountName,
        });

        return { success: true };
      } catch (error) {
        logger.error("save_token_failed", error, { mentoradoId: input.mentoradoId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao salvar token do Facebook Ads.",
        });
      }
    }),

  /**
   * Get available ad accounts for selection
   */
  getAdAccounts: protectedProcedure
    .input(z.object({ accessToken: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const accounts = await facebookAdsService.getAdAccounts(input.accessToken);

        // Filter to only active accounts
        const activeAccounts = accounts.filter((a) => a.account_status === 1);

        return {
          accounts: activeAccounts.map((a) => ({
            id: a.id,
            name: a.name,
            currency: a.currency,
            timezone: a.timezone_name,
          })),
        };
      } catch (error) {
        logger.error("get_ad_accounts_failed", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar contas de anúncios.",
        });
      }
    }),

  /**
   * Disconnect Facebook Ads
   */
  disconnect: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await facebookAdsService.revokeAccess(input.mentoradoId, logger);
        return {
          success: true,
          message: "Facebook Ads desconectado com sucesso.",
        };
      } catch (error) {
        logger.error("disconnect_failed", error, { mentoradoId: input.mentoradoId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao desconectar Facebook Ads.",
        });
      }
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
      logger.info("sync_metrics", {
        mentoradoId: input.mentoradoId,
        ano: input.ano,
        mes: input.mes,
      });

      const result = await facebookAdsService.syncMentoradoAdsMetrics(
        input.mentoradoId,
        input.ano,
        input.mes
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.errorMessage ?? "Erro ao sincronizar métricas de ads.",
        });
      }

      return {
        success: true,
        campaignsCount: result.campaignsCount,
      };
    }),

  /**
   * Get insights history for the last N months
   */
  getInsightsHistory: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
        months: z.number().min(1).max(24).default(6),
      })
    )
    .query(async ({ input }) => {
      const history = await facebookAdsService.getInsightsHistory(input.mentoradoId, input.months);

      // Format with month labels
      const monthLabels = [
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
        label: `${monthLabels[h.mes - 1]}/${h.ano.toString().slice(-2)}`,
        impressions: h.impressions,
        clicks: h.clicks,
        spend: h.spend, // In centavos
        reach: h.reach,
        cpm: h.cpm,
        cpc: h.cpc,
        ctr: h.ctr,
        conversions: h.conversions,
      }));
    }),

  /**
   * Get current month summary for dashboard
   */
  getCurrentMonthSummary: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ input }) => {
      const now = new Date();
      const history = await facebookAdsService.getInsightsHistory(input.mentoradoId, 2);

      const currentMonth = history.find(
        (h) => h.ano === now.getFullYear() && h.mes === now.getMonth() + 1
      );

      const previousMonth = history.find(
        (h) =>
          (h.ano === now.getFullYear() && h.mes === now.getMonth()) ||
          (h.ano === now.getFullYear() - 1 && h.mes === 12 && now.getMonth() === 0)
      );

      if (!currentMonth) {
        return {
          hasData: false,
          impressions: 0,
          clicks: 0,
          spend: 0,
          reach: 0,
          ctr: 0,
          conversions: 0,
          trends: null,
        };
      }

      // Calculate trends (percentage change from previous month)
      let trends = null;
      if (previousMonth) {
        trends = {
          impressions: calculateTrend(currentMonth.impressions, previousMonth.impressions),
          clicks: calculateTrend(currentMonth.clicks, previousMonth.clicks),
          spend: calculateTrend(currentMonth.spend, previousMonth.spend),
          conversions: calculateTrend(
            currentMonth.conversions ?? 0,
            previousMonth.conversions ?? 0
          ),
        };
      }

      return {
        hasData: true,
        impressions: currentMonth.impressions,
        clicks: currentMonth.clicks,
        spend: currentMonth.spend,
        reach: currentMonth.reach,
        ctr: currentMonth.ctr,
        conversions: currentMonth.conversions ?? 0,
        trends,
      };
    }),

  /**
   * Delete all Facebook Ads data for the current user
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
      await facebookAdsService.revokeAccess(mentoradoId, logger);

      logger.info("delete_data_success", { mentoradoId });

      return {
        success: true,
        message: "Todos os dados do Facebook Ads foram removidos com sucesso.",
      };
    } catch (error) {
      logger.error("delete_data_failed", error, { mentoradoId });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao processar solicitação de exclusão de dados.",
      });
    }
  }),
});

// Helper function to calculate percentage trend
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
