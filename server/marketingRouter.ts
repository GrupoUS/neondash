/**
 * Marketing Router
 *
 * tRPC router for marketing automation:
 * - Campaign CRUD operations
 * - Post management
 * - AI content generation endpoints
 * - WhatsApp campaign management
 * - Usage analytics
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  type InsertMarketingCampaign,
  type InsertMarketingPost,
  marketingCampaigns,
  marketingPosts,
  marketingTemplates,
} from "../drizzle/schema-marketing";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  enhanceImagePrompt,
  enhanceUserPrompt,
  generateCampaignContent,
  generateCaption,
  generateImage,
  getMonthlyUsageStats,
  isGeminiConfigured,
} from "./services/aiMarketingService";

// ═══════════════════════════════════════════════════════════════════════════
// INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  platform: z.enum(["instagram", "whatsapp", "both"]),
  topic: z.string().optional(),
  targetAudience: z.string().optional(),
  toneOfVoice: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const createPostSchema = z.object({
  campaignId: z.number(),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  callToAction: z.string().optional(),
  imageUrl: z.string().optional(),
  imagePrompt: z.string().optional(),
  mediaType: z.enum(["image", "carousel", "reel", "story"]).default("image"),
  scheduledFor: z.string().optional(),
  order: z.number().optional(),
});

const generateCaptionSchema = z.object({
  topic: z.string().min(3),
  targetAudience: z.string().optional(),
  toneOfVoice: z.string().optional(),
  platform: z.enum(["instagram", "whatsapp"]).optional(),
  includeHashtags: z.boolean().optional(),
  includeCallToAction: z.boolean().optional(),
});

const generateImageSchema = z.object({
  prompt: z.string().min(5),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).optional(),
  quality: z.enum(["standard", "hd"]).optional(),
  numberOfImages: z.number().min(1).max(4).optional(),
  postId: z.number().optional(),
});

const generateCampaignContentSchema = z.object({
  topic: z.string().min(3),
  targetAudience: z.string().default("Mulheres 25-45 anos interessadas em estética"),
  toneOfVoice: z.string().default("profissional e acolhedor"),
  platform: z.enum(["instagram", "whatsapp", "both"]).default("instagram"),
  numberOfPosts: z.number().min(1).max(14).default(7),
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════

export const marketingRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // CAMPAIGNS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List all campaigns for the current mentorado.
   */
  listCampaigns: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["draft", "scheduled", "active", "completed", "paused", "cancelled"])
            .optional(),
          platform: z.enum(["instagram", "whatsapp", "both"]).optional(),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(marketingCampaigns.mentoradoId, ctx.mentorado!.id)];

      if (input?.status) {
        conditions.push(eq(marketingCampaigns.status, input.status));
      }
      if (input?.platform) {
        conditions.push(eq(marketingCampaigns.platform, input.platform));
      }

      const campaigns = await db
        .select()
        .from(marketingCampaigns)
        .where(and(...conditions))
        .orderBy(desc(marketingCampaigns.createdAt))
        .limit(input?.limit ?? 20);

      return campaigns;
    }),

  /**
   * Get a single campaign with its posts.
   */
  getCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const [campaign] = await db
        .select()
        .from(marketingCampaigns)
        .where(
          and(
            eq(marketingCampaigns.id, input.id),
            eq(marketingCampaigns.mentoradoId, ctx.mentorado!.id)
          )
        )
        .limit(1);

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campanha não encontrada",
        });
      }

      const posts = await db
        .select()
        .from(marketingPosts)
        .where(eq(marketingPosts.campaignId, campaign.id))
        .orderBy(marketingPosts.order);

      return { ...campaign, posts };
    }),

  /**
   * Create a new marketing campaign.
   */
  createCampaign: protectedProcedure
    .input(createCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const values: InsertMarketingCampaign = {
        mentoradoId: ctx.mentorado!.id,
        name: input.name,
        description: input.description,
        platform: input.platform,
        topic: input.topic,
        targetAudience: input.targetAudience,
        toneOfVoice: input.toneOfVoice,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        status: "draft",
      };

      const [campaign] = await db.insert(marketingCampaigns).values(values).returning();

      return campaign;
    }),

  /**
   * Update a campaign.
   */
  updateCampaign: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: createCampaignSchema.partial().extend({
          status: z
            .enum(["draft", "scheduled", "active", "completed", "paused", "cancelled"])
            .optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [campaign] = await db
        .update(marketingCampaigns)
        .set({
          ...input.data,
          startDate: input.data.startDate ? new Date(input.data.startDate) : undefined,
          endDate: input.data.endDate ? new Date(input.data.endDate) : undefined,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(marketingCampaigns.id, input.id),
            eq(marketingCampaigns.mentoradoId, ctx.mentorado!.id)
          )
        )
        .returning();

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campanha não encontrada",
        });
      }

      return campaign;
    }),

  /**
   * Delete a campaign and all its posts.
   */
  deleteCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .delete(marketingCampaigns)
        .where(
          and(
            eq(marketingCampaigns.id, input.id),
            eq(marketingCampaigns.mentoradoId, ctx.mentorado!.id)
          )
        );

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // POSTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a post within a campaign.
   */
  createPost: protectedProcedure.input(createPostSchema).mutation(async ({ ctx, input }) => {
    const db = getDb();

    // Verify campaign ownership
    const [campaign] = await db
      .select({ id: marketingCampaigns.id })
      .from(marketingCampaigns)
      .where(
        and(
          eq(marketingCampaigns.id, input.campaignId),
          eq(marketingCampaigns.mentoradoId, ctx.mentorado!.id)
        )
      )
      .limit(1);

    if (!campaign) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campanha não encontrada",
      });
    }

    const values: InsertMarketingPost = {
      campaignId: input.campaignId,
      mentoradoId: ctx.mentorado!.id,
      caption: input.caption,
      hashtags: input.hashtags,
      callToAction: input.callToAction,
      imageUrl: input.imageUrl,
      imagePrompt: input.imagePrompt,
      mediaType: input.mediaType,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
      order: input.order ?? 0,
      status: "draft",
    };

    const [post] = await db.insert(marketingPosts).values(values).returning();

    const [postCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(marketingPosts)
      .where(eq(marketingPosts.campaignId, input.campaignId));

    const totalPosts = Number(postCountRow?.count ?? 0);

    // Update campaign post count
    await db
      .update(marketingCampaigns)
      .set({
        totalPosts,
        updatedAt: new Date(),
      })
      .where(eq(marketingCampaigns.id, input.campaignId));

    return post;
  }),

  /**
   * Update a post.
   */
  updatePost: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: createPostSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [post] = await db
        .update(marketingPosts)
        .set({
          ...input.data,
          scheduledFor: input.data.scheduledFor ? new Date(input.data.scheduledFor) : undefined,
          updatedAt: new Date(),
        })
        .where(
          and(eq(marketingPosts.id, input.id), eq(marketingPosts.mentoradoId, ctx.mentorado!.id))
        )
        .returning();

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post não encontrado",
        });
      }

      return post;
    }),

  /**
   * Delete a post.
   */
  deletePost: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .delete(marketingPosts)
        .where(
          and(eq(marketingPosts.id, input.id), eq(marketingPosts.mentoradoId, ctx.mentorado!.id))
        );

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // AI CONTENT GENERATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check if AI services are available.
   */
  getAIStatus: protectedProcedure.query(async () => {
    return {
      textGeneration: true, // Gemini is configured
      imageGeneration: isGeminiConfigured(),
    };
  }),

  /**
   * Generate a caption for a post.
   */
  generateCaption: protectedProcedure
    .input(generateCaptionSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await generateCaption(input.topic, {
        targetAudience: input.targetAudience,
        toneOfVoice: input.toneOfVoice,
        platform: input.platform,
        includeHashtags: input.includeHashtags,
        includeCallToAction: input.includeCallToAction,
        mentoradoId: ctx.mentorado!.id,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Erro ao gerar legenda",
        });
      }

      return { caption: result.content };
    }),

  /**
   * Enhance a user prompt using the Marketing Agent.
   */
  enhancePrompt: protectedProcedure
    .input(z.object({ prompt: z.string().min(3) }))
    .mutation(async ({ input }) => {
      const result = await enhanceUserPrompt(input.prompt);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Erro ao melhorar prompt",
        });
      }

      return { enhancedPrompt: result.content };
    }),

  /**
   * Generate an image using DALL-E 3.
   */
  generateImage: protectedProcedure.input(generateImageSchema).mutation(async ({ ctx, input }) => {
    const result = await generateImage(input.prompt, {
      size: input.size,
      quality: input.quality,
      numberOfImages: input.numberOfImages,
      mentoradoId: ctx.mentorado!.id,
      postId: input.postId,
    });

    if (!result.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.error || "Erro ao gerar imagem",
      });
    }

    return {
      imageUrl: result.imageUrl,
      imageUrls: result.imageUrls ?? [result.imageUrl].filter(Boolean),
      revisedPrompt: result.revisedPrompt,
      costCents: result.costCents,
    };
  }),

  /**
   * Enhance an image prompt for better DALL-E results.
   */
  enhanceImagePrompt: protectedProcedure
    .input(
      z.object({
        basicDescription: z.string().min(3),
        postTopic: z.string().optional(),
        targetAudience: z.string().optional(),
        style: z.enum(["photography", "illustration", "minimal"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await enhanceImagePrompt(input.basicDescription, {
        postTopic: input.postTopic,
        targetAudience: input.targetAudience,
        style: input.style,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Erro ao melhorar prompt",
        });
      }

      return { enhancedPrompt: result.content };
    }),

  /**
   * Generate content for an entire campaign.
   */
  generateCampaignContent: protectedProcedure
    .input(generateCampaignContentSchema)
    .mutation(async ({ ctx, input }) => {
      // Use mentorado info from context for clinic name
      const clinicName = ctx.mentorado?.nomeCompleto || "Clínica";

      const result = await generateCampaignContent(
        {
          topic: input.topic,
          targetAudience: input.targetAudience,
          toneOfVoice: input.toneOfVoice,
          platform: input.platform,
          numberOfPosts: input.numberOfPosts,
          clinicName,
        },
        ctx.mentorado!.id
      );

      if (result.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return { posts: result.posts };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // USAGE & ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get AI usage stats for the current month.
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    return getMonthlyUsageStats(ctx.mentorado!.id);
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List available templates.
   */
  listTemplates: protectedProcedure
    .input(
      z
        .object({
          category: z
            .enum([
              "promocao",
              "educativo",
              "depoimento",
              "antes_depois",
              "dica",
              "lancamento",
              "institucional",
            ])
            .optional(),
          platform: z.enum(["instagram", "whatsapp", "both"]).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Get system templates (mentoradoId is null) and user's custom templates
      const templates = await db
        .select()
        .from(marketingTemplates)
        .orderBy(desc(marketingTemplates.usageCount));

      return templates.filter((t) => {
        // Filter by ownership (system or user)
        if (t.mentoradoId !== null && t.mentoradoId !== ctx.mentorado!.id) {
          return false;
        }
        // Filter by category
        if (input?.category && t.category !== input.category) {
          return false;
        }
        // Filter by platform
        if (input?.platform && t.platform !== input.platform) {
          return false;
        }
        return true;
      });
    }),
});
