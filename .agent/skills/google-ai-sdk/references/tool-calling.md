# Tool Calling Guide

> Build multi-step AI agents with Gemini using the Vercel AI SDK.

---

## Basic Tool Definition

```typescript
import { generateText, tool } from "ai";
import { defaultModel } from "@/server/_core/aiProvider";
import { z } from "zod";

const { text, steps } = await generateText({
  model: defaultModel,
  system: "You are a clinical assistant with access to patient tools.",
  prompt: userMessage,
  tools: {
    getPatientHistory: tool({
      description: "Retrieve medical history for a patient by ID",
      parameters: z.object({
        patientId: z.number().describe("Patient database ID"),
      }),
      execute: async ({ patientId }) => {
        const history = await db.query.patients.findFirst({
          where: eq(patients.id, patientId),
        });
        return history;
      },
    }),
    scheduleAppointment: tool({
      description: "Schedule a new appointment for a patient",
      parameters: z.object({
        patientId: z.number(),
        date: z.string().describe("ISO date for the appointment"),
        procedure: z.string().describe("Procedure name"),
      }),
      execute: async ({ patientId, date, procedure }) => {
        // ... create appointment
        return { success: true, appointmentId: 123 };
      },
    }),
  },
  maxSteps: 5, // Legacy — prefer stopWhen below
});
```

---

## Multi-Step Agent Loops

Use `stopWhen` with `stepCountIs` for controlled agent loops (AI SDK v5+).

```typescript
import { generateText, tool, stopWhen, stepCountIs } from "ai";

const { text, steps } = await generateText({
  model: defaultModel,
  system: agentPrompt,
  prompt: userQuery,
  tools: { /* ... */ },
  stopWhen: stepCountIs(10), // Max 10 steps
  onStepFinish: ({ stepType, text, toolCalls, toolResults }) => {
    console.log(`Step: ${stepType}`, { toolCalls: toolCalls?.length });
  },
});

// Access all steps
for (const step of steps) {
  console.log(step.stepType); // "initial" | "tool-result" | "continue"
  console.log(step.toolCalls); // Tool calls made in this step
  console.log(step.toolResults); // Results from tool execution
}
```

---

## Thought Signatures (Gemini 3)

Gemini 3 models with thinking enabled require `thought_signature` in multi-turn tool calling. The `@ai-sdk/google` v2+ handles this **automatically**.

### What Happens

1. Model generates a thought before calling a tool
2. The thought has a cryptographic `thought_signature`
3. When sending tool results back, the signature MUST be included
4. `@ai-sdk/google` v2+ passes signatures transparently

### If You See This Error

```
Error: Function call is missing a thought_signature
```

**Fix:** Ensure `@ai-sdk/google` is v2+ and `ai` is v5+:

```bash
bun add @ai-sdk/google@latest ai@latest
```

### Alternative: Disable Thinking for Tool Calls

```typescript
const { text } = await generateText({
  model: defaultModel,
  tools: { /* ... */ },
  providerOptions: {
    google: {
      thinkingConfig: { thinkingLevel: "minimal" },
    },
  },
});
```

---

## Parallel Tool Calls

Gemini can call multiple tools in a single step:

```typescript
const { text, steps } = await generateText({
  model: defaultModel,
  prompt: "Get data for patients 1, 2, and 3",
  tools: {
    getPatient: tool({
      description: "Get patient by ID",
      parameters: z.object({ id: z.number() }),
      execute: async ({ id }) => fetchPatient(id),
    }),
  },
  stopWhen: stepCountIs(5),
});

// The model may call getPatient 3 times in a single step
// All executions run in parallel automatically
```

---

## Tool Calling Best Practices

1. **Clear descriptions** — Each tool needs a descriptive `description` field
2. **Typed parameters** — Use Zod with `.describe()` on every field
3. **Return structured data** — Return objects, not strings, from `execute`
4. **Limit steps** — Always set `stopWhen: stepCountIs(N)` to prevent infinite loops
5. **Use `onStepFinish`** — Monitor agent behavior for debugging
6. **Keep tools focused** — One tool = one action. Don't create "god tools"
7. **Handle errors** — Wrap `execute` in try-catch, return error objects the model can reason about

---

## Migration: Legacy `invokeLLM` Tools → Vercel AI SDK

### Before (Legacy)

```typescript
const result = await invokeLLM({
  messages,
  tools: [{
    type: "function",
    function: {
      name: "get_patient",
      description: "Get patient data",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Patient ID" },
        },
        required: ["id"],
      },
    },
  }],
});

// Manual tool execution loop
if (result.choices[0].message.tool_calls) {
  // ... manually execute and send results back
}
```

### After (Vercel AI SDK)

```typescript
const { text } = await generateText({
  model: defaultModel,
  messages,
  tools: {
    get_patient: tool({
      description: "Get patient data",
      parameters: z.object({ id: z.number().describe("Patient ID") }),
      execute: async ({ id }) => fetchPatient(id),
    }),
  },
  stopWhen: stepCountIs(5), // Automatic multi-step execution
});
// Tool execution is automatic — no manual loop needed
```
