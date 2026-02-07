/**
 * Image generation helper — Nano Banana Pro (gemini-3-pro-image-preview)
 *
 * Uses Google Gemini generateContent API with IMAGE response modality.
 * Supports input images for before/after simulation editing.
 */

import { GoogleGenAI } from "@google/genai";

const IMAGE_MODEL = "gemini-3-pro-image-preview";

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

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate or edit an image using Nano Banana Pro.
 *
 * When `originalImages` are provided (e.g. patient photo),
 * the model uses them as context for before/after simulation.
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  const gemini = getClient();
  if (!gemini) {
    throw new Error("Gemini não configurada. Configure GEMINI_API_KEY.");
  }

  // Build multimodal content parts
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Add original images as context (for before/after simulation)
  if (options.originalImages?.length) {
    for (const img of options.originalImages) {
      if (img.b64Json) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType ?? "image/jpeg",
            data: img.b64Json,
          },
        });
      } else if (img.url?.startsWith("data:")) {
        // Parse data URL: data:mime;base64,DATA
        const match = img.url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
    }
  }

  // Add text prompt — context-aware for simulation vs standalone
  parts.push({
    text: options.originalImages?.length
      ? `Based on the provided patient photo, create a realistic before/after aesthetic simulation.\n${options.prompt}\nStyle: Clinical, natural-looking result. Soft, neutral lighting. Professional medical aesthetic.`
      : `${options.prompt}\nStyle: Clinical aesthetic simulation. Soft neutral lighting. Professional medical.`,
  });

  const response = await gemini.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "1:1" },
    },
  });

  // Extract image from response
  const responseParts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of responseParts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType ?? "image/png";
      return { url: `data:${mimeType};base64,${part.inlineData.data}` };
    }
  }

  return {};
}
