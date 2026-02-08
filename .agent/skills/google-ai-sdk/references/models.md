# Gemini Models Catalog

> Last updated: 2026-02-07 | Source: [Google AI Models](https://ai.google.dev/gemini-api/docs/models)

> [!CAUTION]
> **Este projeto usa APENAS 2 modelos. Nunca use modelos antigos (2.5, 2.0, etc).**

---

## Modelos Permitidos

| Feature | `gemini-3-flash-preview` | `gemini-3-pro-image-preview` |
|---------|--------------------------|------------------------------|
| **Alias** | Flash 3 (DEFAULT) | Nano Banana Pro |
| **Purpose** | ALL text, chat, analysis, tools, agents | ALL image generation |
| **Input Tokens** | 1,048,576 | 8,192 |
| **Output Tokens** | 65,536 | 8,192 |
| **Input Modalities** | Text, Image, Video, Audio, PDF | Text, Image |
| **Output Modalities** | Text | Text + Image |
| **Thinking** | ✅ Configurable | ❌ |
| **Tool Calling** | ✅ | ❌ |
| **Structured Output** | ✅ | ✅ (limited) |
| **Code Execution** | ✅ | ❌ |
| **Search Grounding** | ✅ | ❌ |
| **Caching** | ✅ Implicit | ❌ |

## ❌ Modelos BANIDOS

| Model | Reason |
|-------|--------|
| `gemini-2.5-pro` | Obsoleto — Flash 3 é superior em velocidade e qualidade |
| `gemini-2.5-flash` | Obsoleto — substituído por Flash 3 |
| `gemini-2.5-flash-lite` | Aposentado em 2026-03-31 |
| `gemini-2.0-flash` | Obsoleto |
| `gemini-3-pro-preview` | Desnecessário — Flash 3 cobre todos os casos de texto |

---

## Thinking Levels (Gemini 3 Flash & Pro)

Control reasoning depth with `thinkingConfig.thinkingLevel`:

| Level | Latency | Quality | Use Case |
|-------|---------|---------|----------|
| `minimal` | Lowest | Basic | Simple classification, formatting |
| `low` | Low | Good | Summarization, simple Q&A |
| `medium` | Medium | High | Analysis, content generation |
| `high` (default) | Highest | Best | Complex reasoning, multi-step tasks |

### Usage with Vercel AI SDK

```typescript
import { google } from "@/server/_core/aiProvider";
import { generateText } from "ai";

const { text } = await generateText({
  model: google("gemini-3-flash-preview"),
  prompt: "Classify this feedback...",
  providerOptions: {
    google: {
      thinkingConfig: { thinkingLevel: "minimal" },
    },
  },
});
```

### Usage with @google/genai

```typescript
const response = await client.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
  config: {
    thinkingConfig: { thinkingLevel: "low" },
  },
});
```

---

## When to Use Each Model

### `gemini-3-flash-preview` — TUDO que é texto
- Patient chat responses
- Marketing caption generation
- Lead qualification / SDR responses
- Data extraction / structured output
- Multi-step agentic workflows
- Complex patient analysis with multiple tools
- Campaign strategy generation
- Cross-referencing large datasets
- **Qualquer tarefa de texto, análise, ou agente**

### `gemini-3-pro-image-preview` — TUDO que é imagem
- Marketing post images
- Patient simulation images (antes/depois)
- Carousel generation (parallel calls)
- **Constraints:** No function calling, no code execution, max 8K tokens

---

## Implicit Caching (Cost Optimization)

Gemini 2.5+ automatically caches common prompt prefixes:
- **75% discount** on cached input tokens
- No configuration needed
- Works with system prompts and recurring context
- Cached automatically when same prefix appears across requests

**Best practice:** Put stable context (system prompt, patient records) at the START of the message array — dynamic content (user query) at the END.
