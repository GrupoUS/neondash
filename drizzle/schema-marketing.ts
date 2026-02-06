import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { mentorados, users, leads, simNaoEnum } from "./schema";

// ═══════════════════════════════════════════════════════════════════════════
// MARKETING ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "active",
  "completed",
  "paused",
  "cancelled",
]);

export const campaignPlatformEnum = pgEnum("campaign_platform", [
  "instagram",
  "whatsapp",
  "both",
]);

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "generating",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "cancelled",
]);

export const postTypeEnum = pgEnum("post_type", [
  "image",
  "carousel",
  "reel",
  "story",
]);

export const templateCategoryEnum = pgEnum("template_category", [
  "promocao",
  "educativo",
  "depoimento",
  "antes_depois",
  "dica",
  "lancamento",
  "institucional",
]);

export const whatsappCampaignStatusEnum = pgEnum("whatsapp_campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "paused",
  "failed",
]);

// ═══════════════════════════════════════════════════════════════════════════
// MARKETING TABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Marketing Campaigns - Main campaign container for Instagram/WhatsApp
 */
export const marketingCampaigns = pgTable(
  "marketing_campaigns",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: campaignStatusEnum("status").default("draft").notNull(),
    platform: campaignPlatformEnum("platform").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    // AI Generation Context
    topic: text("topic"), // Main campaign theme
    targetAudience: text("target_audience"), // e.g., "Mulheres 25-45 anos"
    toneOfVoice: varchar("tone_of_voice", { length: 100 }), // e.g., "profissional", "acolhedor"
    // Stats (aggregated from posts)
    totalPosts: integer("total_posts").default(0),
    publishedPosts: integer("published_posts").default(0),
    totalReach: integer("total_reach").default(0),
    totalEngagement: integer("total_engagement").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("marketing_campaigns_mentorado_idx").on(table.mentoradoId),
    index("marketing_campaigns_status_idx").on(table.status),
    index("marketing_campaigns_platform_idx").on(table.platform),
    index("marketing_campaigns_dates_idx").on(table.startDate, table.endDate),
  ]
);

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = typeof marketingCampaigns.$inferInsert;

/**
 * Marketing Posts - Individual posts within a campaign
 */
export const marketingPosts = pgTable(
  "marketing_posts",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => marketingCampaigns.id, { onDelete: "cascade" }),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    // Content
    caption: text("caption").notNull(),
    hashtags: text("hashtags").array(),
    callToAction: text("call_to_action"),
    // Media
    imageUrl: text("image_url"),
    imagePrompt: text("image_prompt"), // Prompt used to generate image
    mediaType: postTypeEnum("media_type").default("image").notNull(),
    // Scheduling
    scheduledFor: timestamp("scheduled_for"),
    publishedAt: timestamp("published_at"),
    status: postStatusEnum("status").default("draft").notNull(),
    // Instagram API IDs
    instagramContainerId: varchar("instagram_container_id", { length: 100 }),
    instagramMediaId: varchar("instagram_media_id", { length: 100 }),
    // Analytics (populated after publishing)
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
    reach: integer("reach").default(0),
    impressions: integer("impressions").default(0),
    saves: integer("saves").default(0),
    shares: integer("shares").default(0),
    // Metadata
    order: integer("order").default(0), // Position in campaign
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("marketing_posts_campaign_idx").on(table.campaignId),
    index("marketing_posts_mentorado_idx").on(table.mentoradoId),
    index("marketing_posts_status_idx").on(table.status),
    index("marketing_posts_scheduled_idx").on(table.scheduledFor),
    index("marketing_posts_order_idx").on(table.campaignId, table.order),
  ]
);

export type MarketingPost = typeof marketingPosts.$inferSelect;
export type InsertMarketingPost = typeof marketingPosts.$inferInsert;

/**
 * Marketing Templates - Reusable content templates for campaigns
 */
export const marketingTemplates = pgTable(
  "marketing_templates",
  {
    id: serial("id").primaryKey(),
    // Ownership: null = system template, mentoradoId = custom template
    mentoradoId: integer("mentorado_id").references(() => mentorados.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: templateCategoryEnum("category").notNull(),
    platform: campaignPlatformEnum("platform").notNull(),
    // Template Content
    captionTemplate: text("caption_template").notNull(), // With {{variables}}
    imagePromptTemplate: text("image_prompt_template"),
    suggestedHashtags: text("suggested_hashtags").array(),
    // Metadata
    isPublic: simNaoEnum("is_public").default("nao").notNull(), // Visible to all users
    usageCount: integer("usage_count").default(0),
    createdBy: integer("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("marketing_templates_mentorado_idx").on(table.mentoradoId),
    index("marketing_templates_category_idx").on(table.category),
    index("marketing_templates_platform_idx").on(table.platform),
    index("marketing_templates_public_idx").on(table.isPublic),
  ]
);

export type MarketingTemplate = typeof marketingTemplates.$inferSelect;
export type InsertMarketingTemplate = typeof marketingTemplates.$inferInsert;

/**
 * WhatsApp Campaigns - Bulk messaging campaigns via Z-API
 */
export const whatsappCampaigns = pgTable(
  "whatsapp_campaigns",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    // Link to marketing campaign (optional)
    marketingCampaignId: integer("marketing_campaign_id").references(
      () => marketingCampaigns.id,
      { onDelete: "set null" }
    ),
    name: varchar("name", { length: 255 }).notNull(),
    // Message Content
    message: text("message").notNull(),
    mediaUrl: text("media_url"), // Image/video URL
    mediaType: varchar("media_type", { length: 20 }), // 'image', 'video', 'document'
    // Targeting
    targetFilter: jsonb("target_filter").$type<{
      tags?: string[];
      status?: string[];
      origen?: string[];
      lastInteractionDays?: number;
      includeOptInOnly?: boolean;
    }>(),
    targetContactsCount: integer("target_contacts_count").default(0),
    // Scheduling
    scheduledFor: timestamp("scheduled_for"),
    sentAt: timestamp("sent_at"),
    completedAt: timestamp("completed_at"),
    status: whatsappCampaignStatusEnum("status").default("draft").notNull(),
    // Stats
    messagesSent: integer("messages_sent").default(0),
    messagesDelivered: integer("messages_delivered").default(0),
    messagesRead: integer("messages_read").default(0),
    messagesReplied: integer("messages_replied").default(0),
    messagesFailed: integer("messages_failed").default(0),
    // Metadata
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("whatsapp_campaigns_mentorado_idx").on(table.mentoradoId),
    index("whatsapp_campaigns_status_idx").on(table.status),
    index("whatsapp_campaigns_scheduled_idx").on(table.scheduledFor),
    index("whatsapp_campaigns_marketing_idx").on(table.marketingCampaignId),
  ]
);

export type WhatsAppCampaign = typeof whatsappCampaigns.$inferSelect;
export type InsertWhatsAppCampaign = typeof whatsappCampaigns.$inferInsert;

/**
 * WhatsApp Campaign Messages - Track individual message deliveries
 */
export const whatsappCampaignMessages = pgTable(
  "whatsapp_campaign_messages",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => whatsappCampaigns.id, { onDelete: "cascade" }),
    leadId: integer("lead_id").references(() => leads.id, {
      onDelete: "set null",
    }),
    phone: varchar("phone", { length: 20 }).notNull(),
    // Status tracking
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, sent, delivered, read, failed
    zapiMessageId: varchar("zapi_message_id", { length: 128 }),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
    repliedAt: timestamp("replied_at"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("wc_messages_campaign_idx").on(table.campaignId),
    index("wc_messages_lead_idx").on(table.leadId),
    index("wc_messages_status_idx").on(table.status),
    index("wc_messages_phone_idx").on(table.phone),
  ]
);

export type WhatsAppCampaignMessage = typeof whatsappCampaignMessages.$inferSelect;
export type InsertWhatsAppCampaignMessage = typeof whatsappCampaignMessages.$inferInsert;

/**
 * AI Content Generation Log - Track AI usage and costs
 */
export const aiContentGenerationLog = pgTable(
  "ai_content_generation_log",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    // Generation Type
    generationType: varchar("generation_type", { length: 50 }).notNull(), // 'caption', 'image', 'campaign'
    // Input/Output
    promptUsed: text("prompt_used").notNull(),
    resultSummary: text("result_summary"), // Brief description of output
    // Model Info
    modelUsed: varchar("model_used", { length: 50 }).notNull(), // 'gpt-4', 'dall-e-3', etc.
    // Usage Metrics
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    imagesGenerated: integer("images_generated"),
    // Cost Tracking (in cents)
    estimatedCostCents: integer("estimated_cost_cents").default(0),
    // Reference
    postId: integer("post_id").references(() => marketingPosts.id, {
      onDelete: "set null",
    }),
    campaignId: integer("campaign_id").references(() => marketingCampaigns.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_log_mentorado_idx").on(table.mentoradoId),
    index("ai_log_type_idx").on(table.generationType),
    index("ai_log_created_idx").on(table.createdAt),
    index("ai_log_mentorado_month_idx").on(table.mentoradoId, table.createdAt),
  ]
);

export type AIContentGenerationLog = typeof aiContentGenerationLog.$inferSelect;
export type InsertAIContentGenerationLog = typeof aiContentGenerationLog.$inferInsert;
