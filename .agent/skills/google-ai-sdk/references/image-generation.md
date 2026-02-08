# Image Generation Guide

> Generate images using Gemini 3 Pro Image Preview (Nano Banana Pro).

---

## Model: `gemini-3-pro-image-preview`

| Property | Value |
|----------|-------|
| Alias | Nano Banana Pro |
| Input Tokens | 8,192 max |
| Output Tokens | 8,192 max |
| Input Modalities | Text, Image |
| Output Modalities | Text + Image |
| Function Calling | ❌ NOT SUPPORTED |
| Code Execution | ❌ NOT SUPPORTED |
| Caching | ❌ NOT SUPPORTED |
| Thinking | ❌ NOT SUPPORTED |

---

## Basic Image Generation

Uses `@google/genai` directly (NOT the Vercel AI SDK).

```typescript
import { getGeminiClient } from "@/server/_core/aiProvider";

const IMAGE_MODEL = "gemini-3-pro-image-preview";

async function generateImage(prompt: string): Promise<{
  base64: string;
  mimeType: string;
} | null> {
  const client = getGeminiClient();
  if (!client) throw new Error("GEMINI_API_KEY not configured");

  const response = await client.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  // Extract image from response parts
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? "image/png",
      };
    }
  }

  return null;
}
```

---

## Carousel Generation (Multiple Images)

Generate multiple images in parallel for Instagram carousels.

```typescript
async function generateCarouselImages(
  prompt: string,
  count: number = 3,
): Promise<Array<{ base64: string; mimeType: string }>> {
  const client = getGeminiClient();
  if (!client) throw new Error("GEMINI_API_KEY not configured");

  // Parallel generation with unique variation prompts
  const promises = Array.from({ length: count }, (_, i) =>
    client.models.generateContent({
      model: IMAGE_MODEL,
      contents: `${prompt}\n\nVariation ${i + 1} of ${count}. Create a unique visual perspective.`,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    })
  );

  const responses = await Promise.all(promises);

  return responses
    .map((response) => {
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
          return {
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType ?? "image/png",
          };
        }
      }
      return null;
    })
    .filter(Boolean) as Array<{ base64: string; mimeType: string }>;
}
```

---

## Prompt Enhancement

Improve image quality by enhancing the user prompt before generation.

```typescript
import { generateText } from "ai";
import { defaultModel } from "@/server/_core/aiProvider";

async function enhanceImagePrompt(
  basicPrompt: string,
  context: string,
): Promise<string> {
  const { text } = await generateText({
    model: defaultModel, // Use Flash for fast prompt enhancement
    system: `You are an expert at writing prompts for AI image generation.
Transform the user's basic description into a detailed, high-quality prompt.
Include: lighting, composition, style, mood, color palette.
Output ONLY the enhanced prompt, no explanations.`,
    prompt: `Context: ${context}\n\nBasic prompt: ${basicPrompt}`,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: "minimal" },
      },
    },
  });

  return text;
}
```

---

## Aspect Ratios

The model doesn't take explicit aspect ratio parameters. Control via prompt:

| Desired Ratio | Prompt Hint |
|---------------|-------------|
| 1:1 (Square) | "square format, 1:1 aspect ratio" |
| 4:5 (Portrait) | "portrait format, 4:5 aspect ratio, vertical" |
| 16:9 (Landscape) | "wide landscape format, 16:9 aspect ratio, horizontal" |
| 9:16 (Story) | "vertical story format, 9:16 aspect ratio, mobile" |

---

## Limitations & Workarounds

1. **No function calling** — Cannot combine image gen with tool use in same call
2. **No caching** — Each request is fully processed (no implicit caching)
3. **Small context** — 8K token limit means prompts must be concise
4. **No streaming** — Image data arrives in the complete response, not streamed
5. **Rate limits** — Image generation has lower rate limits than text; use `Promise.all` with max 3-5 parallel calls
6. **Content filtering** — Medical/aesthetic images may trigger safety filters. Use detailed clinical language in prompts to avoid false positives
