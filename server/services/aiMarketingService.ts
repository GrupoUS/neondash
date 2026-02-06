/**
 * AI Marketing Service
 *
 * Provides AI-powered content generation for marketing campaigns:
 * - Caption/text generation using Gemini
 * - Image generation using DALL-E 3 (OpenAI)
 * - Campaign narrative generation
 *
 * All generation is logged to aiContentGenerationLog for cost tracking.
 */

import { generateText } from "ai";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { systemSettings } from "../../drizzle/schema";
import {
  aiContentGenerationLog,
  type InsertAIContentGenerationLog,
} from "../../drizzle/schema-marketing";
import { defaultModel, isAIConfigured } from "../_core/aiProvider";
import { getDb } from "../db";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ContentGenerationResult {
  success: boolean;
  content?: string;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  revisedPrompt?: string;
  error?: string;
  costCents?: number;
}

export interface CampaignContentResult {
  posts: Array<{
    caption: string;
    hashtags: string[];
    imagePrompt: string;
    callToAction?: string;
  }>;
  error?: string;
}

interface CampaignContext {
  topic: string;
  targetAudience: string;
  toneOfVoice: string;
  platform: "instagram" | "whatsapp" | "both";
  numberOfPosts: number;
  clinicName: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENAI CLIENT
// ═══════════════════════════════════════════════════════════════════════════

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKETING AGENT PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_MARKETING_PROMPT = `Você é um especialista em marketing digital para clínicas de estética.
Seu foco é criar conteúdo que converte para Instagram: posts, legendas persuasivas e narrativas de campanha.

DIRETRIZES:
1. Use linguagem acolhedora e profissional
2. Foque em benefícios emocionais e transformação
3. Inclua gatilhos de urgência e prova social quando apropriado
4. Adapte o tom para o público-alvo
5. Hashtags devem ser relevantes e misturar alcance (populares) com nicho
6. Call-to-action deve ser claro e motivador

FORMATOS DE POST QUE FUNCIONAM:
- Antes/Depois (com consentimento)
- Dicas rápidas em carrossel
- Depoimentos de pacientes
- Bastidores do procedimento
- Educativo sobre o procedimento
- Ofertas e promoções limitadas`;

async function getMarketingAgentPrompt(): Promise<string> {
  const db = getDb();
  const [setting] = await db
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, "marketing_agent_prompt"))
    .limit(1);

  return setting?.value || DEFAULT_MARKETING_PROMPT;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a caption for a marketing post using Gemini.
 */
export async function generateCaption(
  topic: string,
  options: {
    targetAudience?: string;
    toneOfVoice?: string;
    platform?: "instagram" | "whatsapp";
    includeHashtags?: boolean;
    includeCallToAction?: boolean;
    mentoradoId?: number;
  } = {}
): Promise<ContentGenerationResult> {
  if (!isAIConfigured()) {
    return { success: false, error: "AI não configurada. Configure GOOGLE_API_KEY." };
  }

  const {
    targetAudience = "Mulheres 25-45 anos interessadas em estética",
    toneOfVoice = "profissional e acolhedor",
    platform = "instagram",
    includeHashtags = true,
    includeCallToAction = true,
    mentoradoId,
  } = options;

  const marketingPrompt = await getMarketingAgentPrompt();

  const prompt = `${marketingPrompt}

TAREFA: Criar uma legenda para ${platform === "instagram" ? "post do Instagram" : "mensagem de WhatsApp"}.

TEMA DO POST: ${topic}
PÚBLICO-ALVO: ${targetAudience}
TOM DE VOZ: ${toneOfVoice}

REQUISITOS:
${includeHashtags ? "- Inclua 5-8 hashtags relevantes ao final" : "- NÃO inclua hashtags"}
${includeCallToAction ? "- Termine com um call-to-action claro" : ""}
- Use emojis estrategicamente (não exagere)
- Máximo 2200 caracteres para Instagram
- Primeira frase deve capturar atenção

RESPONDA APENAS com a legenda pronta, sem explicações adicionais.`;

  try {
    const result = await generateText({
      model: defaultModel,
      prompt,
      maxTokens: 1000,
    });

    // Log usage if mentoradoId provided
    if (mentoradoId) {
      await logGeneration({
        mentoradoId,
        generationType: "caption",
        promptUsed: topic,
        resultSummary: result.text.substring(0, 200),
        modelUsed: "gemini-2.5-flash",
        inputTokens: result.usage?.promptTokens,
        outputTokens: result.usage?.completionTokens,
        estimatedCostCents: Math.ceil((result.usage?.totalTokens || 0) * 0.0001), // ~$0.001 per 1k tokens
      });
    }

    return {
      success: true,
      content: result.text,
      inputTokens: result.usage?.promptTokens,
      outputTokens: result.usage?.completionTokens,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[AI Marketing] Caption generation error:", message);
    return { success: false, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION (DALL-E 3)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate an image using DALL-E 3.
 *
 * Costs:
 * - Standard 1024x1024: $0.04
 * - Standard 1024x1792: $0.08
 * - HD 1024x1024: $0.08
 * - HD 1024x1792: $0.12
 */
export async function generateImage(
  prompt: string,
  options: {
    size?: "1024x1024" | "1024x1792" | "1792x1024";
    quality?: "standard" | "hd";
    mentoradoId?: number;
    postId?: number;
  } = {}
): Promise<ImageGenerationResult> {
  const openai = getOpenAIClient();
  if (!openai) {
    return { success: false, error: "OpenAI não configurada. Configure OPENAI_API_KEY." };
  }

  const { size = "1024x1024", quality = "standard", mentoradoId, postId } = options;

  // Calculate cost in cents
  const isWide = size === "1024x1792" || size === "1792x1024";
  const isHd = quality === "hd";
  let costCents: number;
  if (isHd) {
    costCents = isWide ? 12 : 8;
  } else {
    costCents = isWide ? 8 : 4;
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Professional aesthetic clinic marketing image: ${prompt}. 
Style: Modern, clean, premium healthcare aesthetic. 
Lighting: Soft, professional studio lighting.
Colors: Neutral tones with subtle accents.
DO NOT include any visible text or watermarks.`,
      n: 1,
      size,
      quality,
    });

    const imageData = response.data?.[0];
    const imageUrl = imageData?.url;
    const revisedPrompt = imageData?.revised_prompt;

    if (!imageUrl) {
      return { success: false, error: "Nenhuma imagem gerada" };
    }

    // Log usage
    if (mentoradoId) {
      await logGeneration({
        mentoradoId,
        generationType: "image",
        promptUsed: prompt,
        resultSummary: `DALL-E 3 ${quality} ${size}`,
        modelUsed: "dall-e-3",
        imagesGenerated: 1,
        estimatedCostCents: costCents,
        postId,
      });
    }

    return {
      success: true,
      imageUrl,
      revisedPrompt,
      costCents,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[AI Marketing] Image generation error:", message);
    return { success: false, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMPAIGN CONTENT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate content for an entire campaign (multiple posts).
 */
export async function generateCampaignContent(
  context: CampaignContext,
  mentoradoId: number
): Promise<CampaignContentResult> {
  if (!isAIConfigured()) {
    return { posts: [], error: "AI não configurada. Configure GOOGLE_API_KEY." };
  }

  const marketingPrompt = await getMarketingAgentPrompt();

  const prompt = `${marketingPrompt}

TAREFA: Criar uma campanha de marketing completa para Instagram de uma clínica de estética.

CONTEXTO DA CAMPANHA:
- Nome da Clínica: ${context.clinicName}
- Tema Principal: ${context.topic}
- Público-Alvo: ${context.targetAudience}
- Tom de Voz: ${context.toneOfVoice}
- Plataforma: ${context.platform}
- Quantidade de Posts: ${context.numberOfPosts}

REQUISITOS:
1. Crie ${context.numberOfPosts} posts que formem uma narrativa coerente
2. Cada post deve ter: legenda, hashtags (5-8), call-to-action, e prompt para imagem
3. Varie os formatos (educativo, promotional, storytelling)
4. Posts devem ser publicáveis em sequência (dias diferentes)
5. Prompts de imagem devem ser específicos e gerar fotos profissionais

RESPONDA NO SEGUINTE FORMATO JSON (APENAS O JSON, SEM MARKDOWN):
{
  "posts": [
    {
      "caption": "Legenda completa do post...",
      "hashtags": ["hashtag1", "hashtag2", ...],
      "imagePrompt": "Descrição detalhada para geração de imagem...",
      "callToAction": "Agende sua avaliação gratuita!"
    }
  ]
}`;

  try {
    const result = await generateText({
      model: defaultModel,
      prompt,
      maxTokens: 4000,
    });

    // Parse JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { posts: [], error: "Falha ao parsear resposta da IA" };
    }

    const parsed = JSON.parse(jsonMatch[0]) as CampaignContentResult;

    // Log usage
    await logGeneration({
      mentoradoId,
      generationType: "campaign",
      promptUsed: `Campaign: ${context.topic} (${context.numberOfPosts} posts)`,
      resultSummary: `Generated ${parsed.posts.length} posts`,
      modelUsed: "gemini-2.5-flash",
      inputTokens: result.usage?.promptTokens,
      outputTokens: result.usage?.completionTokens,
      estimatedCostCents: Math.ceil((result.usage?.totalTokens || 0) * 0.0001),
    });

    return { posts: parsed.posts };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[AI Marketing] Campaign generation error:", message);
    return { posts: [], error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE PROMPT ENHANCEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enhance a basic image description into a detailed DALL-E prompt.
 */
export async function enhanceImagePrompt(
  basicDescription: string,
  context?: {
    postTopic?: string;
    targetAudience?: string;
    style?: "photography" | "illustration" | "minimal";
  }
): Promise<ContentGenerationResult> {
  if (!isAIConfigured()) {
    return { success: false, error: "AI não configurada" };
  }

  const { postTopic = "", targetAudience = "", style = "photography" } = context || {};

  const prompt = `Você é um especialista em criar prompts para DALL-E 3.

TAREFA: Transformar a descrição básica abaixo em um prompt detalhado para gerar uma imagem profissional para marketing de clínica de estética.

DESCRIÇÃO BÁSICA: "${basicDescription}"
${postTopic ? `CONTEXTO DO POST: ${postTopic}` : ""}
${targetAudience ? `PÚBLICO-ALVO: ${targetAudience}` : ""}
ESTILO: ${style}

REQUISITOS DO PROMPT:
1. Linguagem em inglês (DALL-E funciona melhor)
2. Descreva composição, iluminação, cores e mood
3. Especifique que NÃO deve ter texto na imagem
4. Mantenha tom profissional de healthcare/beauty
5. Evite rostos reais reconhecíveis

RESPONDA APENAS com o prompt otimizado, sem explicações.`;

  try {
    const result = await generateText({
      model: defaultModel,
      prompt,
      maxTokens: 500,
    });

    return {
      success: true,
      content: result.text,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE LOGGING
// ═══════════════════════════════════════════════════════════════════════════

async function logGeneration(data: Omit<InsertAIContentGenerationLog, "id" | "createdAt">) {
  try {
    const db = getDb();
    await db.insert(aiContentGenerationLog).values(data);
  } catch (error) {
    console.error("[AI Marketing] Failed to log generation:", error);
  }
}

/**
 * Get AI usage stats for a mentorado in the current month.
 */
export async function getMonthlyUsageStats(mentoradoId: number) {
  const db = getDb();

  const logs = await db
    .select({
      generationType: aiContentGenerationLog.generationType,
      estimatedCostCents: aiContentGenerationLog.estimatedCostCents,
      imagesGenerated: aiContentGenerationLog.imagesGenerated,
    })
    .from(aiContentGenerationLog)
    .where(eq(aiContentGenerationLog.mentoradoId, mentoradoId));

  const stats = {
    totalCostCents: 0,
    totalImages: 0,
    totalCaptions: 0,
    totalCampaigns: 0,
  };

  for (const log of logs) {
    stats.totalCostCents += log.estimatedCostCents || 0;
    stats.totalImages += log.imagesGenerated || 0;
    if (log.generationType === "caption") stats.totalCaptions++;
    if (log.generationType === "campaign") stats.totalCampaigns++;
  }

  return stats;
}
