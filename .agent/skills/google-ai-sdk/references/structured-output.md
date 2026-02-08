# Structured Output Guide

> Generate type-safe JSON from Gemini models using Zod schemas.

---

## Method 1: `generateObject` (Vercel AI SDK) — PREFERRED

Integrates Zod natively. Handles schema conversion and validation automatically.

```typescript
import { generateObject } from "ai";
import { defaultModel } from "@/server/_core/aiProvider";
import { z } from "zod";

const patientAnalysisSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high"]).describe("Patient risk assessment"),
  recommendations: z.array(z.object({
    procedure: z.string().describe("Recommended procedure name"),
    priority: z.number().min(1).max(5).describe("Priority 1-5"),
    rationale: z.string().describe("Clinical rationale"),
  })),
  nextFollowUp: z.string().describe("Recommended follow-up date in ISO format"),
});

const { object } = await generateObject({
  model: defaultModel,
  schema: patientAnalysisSchema,
  prompt: `Analyze patient: ${JSON.stringify(patientData)}`,
});

// object is typed: { riskLevel, recommendations, nextFollowUp }
```

---

## Method 2: `zodToJsonSchema` (Raw @google/genai)

Used when calling `@google/genai` directly (e.g., combined with image gen).

```typescript
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const schema = z.object({
  caption: z.string().describe("Instagram caption"),
  hashtags: z.array(z.string()).describe("Relevant hashtags"),
});

const response = await client.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: zodToJsonSchema(schema),
  },
});

const result = schema.parse(JSON.parse(response.text));
```

---

## Streaming Structured Output

Stream partial JSON as it generates (useful for large extractions).

### With @google/genai

```typescript
const stream = await client.models.generateContentStream({
  model: "gemini-3-flash-preview",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: zodToJsonSchema(schema),
  },
});

let accumulated = "";
for await (const chunk of stream) {
  accumulated += chunk.candidates[0].content.parts[0].text;
  // accumulated is partial JSON — parse only when complete
}
const result = schema.parse(JSON.parse(accumulated));
```

### With Vercel AI SDK (streamObject)

```typescript
import { streamObject } from "ai";

const result = streamObject({
  model: defaultModel,
  schema: patientAnalysisSchema,
  prompt: analysisPrompt,
});

for await (const partialObject of result.partialObjectStream) {
  // partialObject has typed partial fields as they stream in
  console.log(partialObject.riskLevel); // may be undefined initially
}
```

---

## Structured Output + Tools (Gemini 3)

Gemini 3 supports structured output with built-in tools (Google Search, URL Context).

```typescript
// @google/genai direct
const response = await client.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: "Research competitor pricing for dermal fillers",
  config: {
    tools: [{ googleSearch: {} }],
    responseMimeType: "application/json",
    responseJsonSchema: zodToJsonSchema(competitorSchema),
  },
});
```

---

## Best Practices

1. **Always add `.describe()`** to Zod fields — the model uses descriptions as guidance
2. **Use `z.enum()`** for classification instead of free-text strings
3. **Use `z.number().min().max()`** for bounded numeric values
4. **Keep schemas flat** — deeply nested schemas (>3 levels) may be rejected
5. **Validate output** — structured output guarantees valid JSON, NOT semantically correct values
6. **Use `z.optional()`** sparingly — required fields produce more reliable output

## Known Issues

- **Gemini 3 + function calling:** May return structured/JSON-like output unexpectedly when function calling is enabled. Workaround: set `structuredOutputs: false` in provider options if schema limitations appear.
- **Large schemas:** API may reject schemas with many properties or deep nesting. Simplify by shortening property names and reducing constraints.

## JSON Schema Type Support

| Type | Supported | Notes |
|------|-----------|-------|
| `string` | ✅ | Supports `enum`, `format` (date-time, date, time) |
| `number` | ✅ | Supports `minimum`, `maximum`, `enum` |
| `integer` | ✅ | Supports `minimum`, `maximum`, `enum` |
| `boolean` | ✅ | |
| `object` | ✅ | `properties`, `required`, `additionalProperties` |
| `array` | ✅ | `items`, `minItems`, `maxItems`, `prefixItems` |
| `null` | ✅ | Use `{"type": ["string", "null"]}` |
