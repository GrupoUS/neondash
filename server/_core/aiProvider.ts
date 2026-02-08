/**
 * AI Provider Configuration
 *
 * Uses Vercel AI SDK with Google Gemini provider.
 * Provides the AI model instance used by the AI Assistant service.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GoogleGenAI } from "@google/genai";
import { ENV } from "./env";

// Validate API key at module load to fail fast with a clear message
if (!ENV.geminiApiKey) {
  // biome-ignore lint/suspicious/noConsole: Startup validation warning
  console.warn("[aiProvider] GEMINI_API_KEY is not set. AI features will be unavailable.");
}

/**
 * Google Gemini AI provider instance (Vercel AI SDK).
 * Uses GEMINI_API_KEY from environment.
 */
export const google = createGoogleGenerativeAI({
  apiKey: ENV.geminiApiKey,
});

/**
 * Default AI model for the assistant.
 * Gemini 3 Flash Preview — latest and fastest.
 */
export const defaultModel = google("gemini-3-flash-preview");

/**
 * Pro model for complex reasoning tasks.
 * Use sparingly due to higher cost and latency.
 */
export const proModel = google("gemini-2.5-pro");

/**
 * Check if AI is configured and available.
 */
export function isAIConfigured(): boolean {
  return Boolean(ENV.geminiApiKey);
}

/**
 * Raw Google GenAI client for direct API access (image generation, etc.).
 * Returns null if GEMINI_API_KEY is not set.
 */
export function getGeminiClient(): GoogleGenAI | null {
  if (!ENV.geminiApiKey) return null;
  return new GoogleGenAI({ apiKey: ENV.geminiApiKey });
}
