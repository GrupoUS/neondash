---
name: google-ai-sdk
description: Expert knowledge for Google AI SDKs (@google/genai, @ai-sdk/google, Vercel AI SDK). Use when implementing AI features, debugging Gemini models, configuring thinking/tool-calling/structured-output, or generating images with Nano Banana Pro.
---

# Google AI SDK — Expert Skill

> **When to load:** Any task involving Gemini models, AI text/image generation, tool calling, structured output, or refactoring AI services.

---

## SDK Architecture (This Project)

```
┌─────────────────────────────────────────────────────┐
│  Vercel AI SDK (`ai` v5)                            │
│  ├─ generateText / streamText / generateObject      │
│  ├─ tool() definitions                              │
│  └─ stopWhen / stepCountIs (agent loops)            │
├─────────────────────────────────────────────────────┤
│  @ai-sdk/google v2  ← Provider adapter             │
│  └─ google("gemini-3-flash-preview")                │
├─────────────────────────────────────────────────────┤
│  @google/genai v1  ← Direct API access             │
│  └─ GoogleGenAI → models.generateContent()          │
│     (Used ONLY for image generation)                │
└─────────────────────────────────────────────────────┘
```

### Central Provider: `server/_core/aiProvider.ts`

```typescript
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GoogleGenAI } from "@google/genai";

export const google = createGoogleGenerativeAI({ apiKey: ENV.geminiApiKey });
export const defaultModel = google("gemini-3-flash-preview");
export const proModel = google("gemini-2.5-pro");
export function getGeminiClient(): GoogleGenAI | null { /* ... */ }
```

---

## Decision Tree: Which SDK to Use

```
Task requires AI?
├── Text generation / chat / analysis?
│   └── USE: @ai-sdk/google via Vercel AI SDK
│       ├─ generateText()  → single response
│       ├─ streamText()    → streaming UX
│       └─ generateObject() → structured data extraction
│
├── Tool calling / multi-step agent?
│   └── USE: @ai-sdk/google via Vercel AI SDK
│       └─ generateText() + tool() + stopWhen(stepCountIs(N))
│
├── Image generation?
│   └── USE: @google/genai directly (GoogleGenAI)
│       └─ models.generateContent() with responseModalities: ["TEXT", "IMAGE"]
│       ⚠️ Nano Banana Pro does NOT support function calling
│
├── Structured output (JSON extraction)?
│   └── USE: @ai-sdk/google via generateObject() with Zod schema
│       OR: @google/genai with zodToJsonSchema() + responseMimeType
│
└── Legacy service still using invokeLLM?
    └── MIGRATE to @ai-sdk/google (see references/patterns.md)
```

---

## Activation Triggers

| Context | Action |
|---------|--------|
| Code with `generateText` / `streamText` / `generateObject` | Read `references/patterns.md` |
| Code with `tool()` or multi-step agent | Read `references/tool-calling.md` |
| Code with `generateContent` for images | Read `references/image-generation.md` |
| Code using Zod schemas for AI output | Read `references/structured-output.md` |
| Choosing which Gemini model to use | Read `references/models.md` |
| Code importing from `../_core/llm` | Flag as legacy — read migration pattern in `references/patterns.md` |
| Debugging `thought_signature` errors | Read `references/tool-calling.md` §Thought Signatures |
| Configuring thinking level for reasoning | Read `references/models.md` §Thinking Levels |
| Safety settings for medical content | Read `references/patterns.md` §Safety Settings |

---

## Quick Reference: Model Selection

> [!CAUTION]
> **ONLY TWO MODELS ARE ALLOWED** in this project. Never use Gemini 2.5, 2.0, or any legacy model.

| Model | Purpose | Use For |
|-------|---------|----------|
| `gemini-3-flash-preview` | **ALL text/chat/analysis** | Patient chat, SDR, marketing captions, structured output, tool calling, agents |
| `gemini-3-pro-image-preview` | **ALL image generation** (Nano Banana Pro) | Marketing posts, patient simulations, carousels |

> See `references/models.md` for full specs and limits.

---

## Project AI Services Map

| Service | File | SDK Used | Status |
|---------|------|----------|--------|
| Patient Chat & Analysis | `patientAiService.ts` | `@ai-sdk/google` | ✅ Modern |
| Marketing Content | `aiMarketingService.ts` | `@ai-sdk/google` + `@google/genai` | ✅ Modern |
| Multi-Agent Router | `aiAssistantService.ts` | `@ai-sdk/google` | ✅ Modern |
| WhatsApp SDR | `aiSdrService.ts` | Legacy `invokeLLM` | ⚠️ Needs migration |
| AI Agent Router | `aiAgentRouter.ts` | `@ai-sdk/google` | ✅ Modern |
| Raw LLM Client | `_core/llm.ts` | OpenAI-compat fetch | ⚠️ Legacy |

---

## Critical Rules

1. **ONLY `gemini-3-flash-preview`** for ALL text, chat, analysis, tool calling, and agents — NO exceptions
2. **ONLY `gemini-3-pro-image-preview`** (Nano Banana Pro) for ALL image generation — NO exceptions
3. **NEVER use legacy models** — `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.0-*` are BANNED
4. **ALWAYS use `defaultModel`** from `aiProvider.ts` — never hardcode model strings
5. **NEVER mix SDKs** in the same function — pick one path per operation
6. **ALWAYS define Zod schemas** for structured output — never rely on prompt-only JSON
7. **ALWAYS set `stopWhen: stepCountIs(N)`** for agent loops — never use unbounded recursion
8. **NEVER enable function calling** with `gemini-3-pro-image-preview` — it will error
9. **ALWAYS handle `thought_signature`** — use `@ai-sdk/google` v2+ which handles it automatically
10. **Use `thinkingConfig`** to balance latency vs quality (default: `high`, fast tasks: `minimal`)
