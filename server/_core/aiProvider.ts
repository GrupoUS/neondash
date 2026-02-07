/**
 * AI Provider Configuration
 *
 * Uses Vercel AI SDK with Google Gemini provider.
 * Provides the AI model instance used by the AI Assistant service.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ENV } from "./env";

/**
 * Google Gemini AI provider instance.
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
