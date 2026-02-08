# Implementation Patterns

> Code patterns used in this project for Google AI SDK integration.

---

## Pattern 1: Vercel AI SDK Text Generation

The primary pattern for all text-based AI operations.

```typescript
import { google, defaultModel } from "@/server/_core/aiProvider";
import { generateText } from "ai";

// Simple generation
const { text } = await generateText({
  model: defaultModel, // gemini-3-flash-preview
  system: "You are a clinical assistant...",
  prompt: userMessage,
});

// With thinking control (fast response)
const { text } = await generateText({
  model: defaultModel,
  system: "Classify this lead...",
  prompt: leadData,
  providerOptions: {
    google: {
      thinkingConfig: { thinkingLevel: "minimal" },
    },
  },
});
```

---

## Pattern 2: Streaming Text

For real-time UX (chat, long content generation).

```typescript
import { google, defaultModel } from "@/server/_core/aiProvider";
import { streamText } from "ai";

const result = streamText({
  model: defaultModel,
  system: systemPrompt,
  messages: chatHistory,
});

// Express integration
result.pipeDataStreamToResponse(res);
```

---

## Pattern 3: Structured Output with generateObject

Extract typed data from unstructured text.

```typescript
import { google, defaultModel } from "@/server/_core/aiProvider";
import { generateObject } from "ai";
import { z } from "zod";

const schema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  topics: z.array(z.string()),
  urgency: z.number().min(1).max(5),
});

const { object } = await generateObject({
  model: defaultModel,
  schema,
  prompt: "Analyze this patient feedback: " + feedback,
});
// object is fully typed: { sentiment, topics, urgency }
```

---

## Pattern 4: Raw @google/genai for Image Generation

Used ONLY when Vercel AI SDK doesn't support the operation (image gen).

```typescript
import { getGeminiClient } from "@/server/_core/aiProvider";

const client = getGeminiClient();
if (!client) throw new Error("GEMINI_API_KEY not configured");

const response = await client.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: enhancedPrompt,
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    // NO function calling — not supported by this model
  },
});

// Extract image from response
for (const part of response.candidates?.[0]?.content?.parts ?? []) {
  if (part.inlineData) {
    const base64 = part.inlineData.data;
    const mimeType = part.inlineData.mimeType; // image/png
  }
}
```

---

## Pattern 5: Safety Settings for Medical Content

Essential when AI discusses procedures, anatomy, or before/after photos.

```typescript
const { text } = await generateText({
  model: defaultModel,
  system: clinicalPrompt,
  prompt: patientQuery,
  providerOptions: {
    google: {
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    },
  },
});
```

---

## Anti-Pattern: Legacy `invokeLLM` (TO MIGRATE)

```typescript
// ❌ LEGACY — DO NOT use for new code
import { invokeLLM } from "../_core/llm";

const result = await invokeLLM({
  messages: [{ role: "system", content: prompt }, ...history],
  model: "gemini-3-flash-preview",
  maxTokens: 2048,
});
const reply = result.choices[0].message.content;

// ✅ MODERN — Use this instead
import { defaultModel } from "../_core/aiProvider";
import { generateText } from "ai";

const { text } = await generateText({
  model: defaultModel,
  system: prompt,
  messages: history.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  })),
  maxTokens: 2048,
});
```

### Migration Checklist (invokeLLM → Vercel AI SDK)

1. Replace `import { invokeLLM }` with `import { generateText } from "ai"`
2. Replace model string with `defaultModel` from `aiProvider.ts`
3. Convert `messages` array to Vercel AI SDK format (role: "user" | "assistant" | "system")
4. Replace `result.choices[0].message.content` with destructured `{ text }`
5. Replace `tools` array with `tool()` definitions
6. Add `stopWhen` for multi-step conversations
7. Handle streaming via `streamText` if UX requires it

---

## Pattern 6: Provider Options Reference

```typescript
providerOptions: {
  google: {
    // Thinking control
    thinkingConfig: {
      thinkingLevel: "minimal" | "low" | "medium" | "high",
    },

    // Safety filters
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT" | "HARM_CATEGORY_HATE_SPEECH" |
                  "HARM_CATEGORY_SEXUALLY_EXPLICIT" | "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE" | "BLOCK_ONLY_HIGH" | "BLOCK_MEDIUM_AND_ABOVE" |
                   "BLOCK_LOW_AND_ABOVE",
      },
    ],

    // Structured output (use only when generateObject is not suitable)
    structuredOutputs: false, // Disable if encountering schema limitation bugs

    // Search grounding
    useSearchGrounding: true,
  },
}
```
