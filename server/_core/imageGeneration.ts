/**
 * Image generation helper
 *
 * NOTE: The legacy image generation proxy (LLM_API_URL) has been removed.
 * Use the Gemini API image generation via the AI Marketing Service instead
 * (see server/aiMarketingService.ts).
 *
 * This module is kept for backward compatibility but will throw a clear error
 * if called without a configured storage/proxy backend.
 */

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  _options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  throw new Error(
    "Image generation via legacy proxy is not configured. " +
      "Use the AI Marketing Service (aiMarketingService.ts) with Gemini API instead."
  );
}
