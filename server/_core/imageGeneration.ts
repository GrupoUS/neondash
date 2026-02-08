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

/** Fetch a remote URL and convert to base64 + mimeType */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    const data = Buffer.from(buffer).toString("base64");
    return { data, mimeType };
  } catch {
    return null;
  }
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
      } else if (img.url) {
        // Fetch remote HTTP(S) URL and convert to base64
        const fetched = await fetchImageAsBase64(img.url);
        if (fetched) {
          parts.push({
            inlineData: {
              mimeType: fetched.mimeType,
              data: fetched.data,
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
      : `${options.prompt}\nGenerate a realistic clinical aesthetic simulation image.\nStyle: Clinical aesthetic simulation. Soft neutral lighting. Professional medical.`,
  });

  const response = await gemini.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  // Extract image from response (may contain both text and image parts)
  const responseParts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of responseParts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType ?? "image/png";
      return { url: `data:${mimeType};base64,${part.inlineData.data}` };
    }
  }

  return {};
}
