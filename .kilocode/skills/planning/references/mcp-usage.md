# MCP Tools Usage Guide

Reference for when and how to use MCP tools during planning.

## Context7 — Official Documentation

**Purpose:** Query official library documentation before implementation.

### Triggers

- Convex (queries, mutations, schema)
- Clerk (auth, users, sessions)
- TanStack Router (routes, loaders)
- shadcn/ui (components)
- Recharts (charts, visualization)
- Any npm library/API
- Vite, Biome, TypeScript config
- Drizzle ORM
- tRPC

### Usage Pattern

```
1. resolve-library-id → Get exact library ID
2. query-docs → Query specific documentation
```

### Example

```
User needs: "Add Clerk auth middleware"

1. mcp_context7_resolve-library-id: "clerk"
2. mcp_context7_query-docs:
   - libraryId: "/clerk/clerk-docs"
   - query: "express middleware authentication"
```

---

## Tavily — Web Research

**Purpose:** Find best practices and solutions not in official docs.

### Triggers

- Context7 returns insufficient info
- Deploy/runtime errors without clear solution
- Best practices / modern patterns (2024+)
- Undocumented integrations
- Security advisories

### Usage Pattern

```
1. tavily-search → Find relevant resources
2. tavily-extract → Extract content from promising URLs
```

### Example

```
Problem: "Neon connection pooling timeout errors"

1. tavily_search:
   - query: "neon postgresql connection pooling timeout serverless 2024"
   - options: {topic: "general", maxResults: 5}

2. tavily_extract: (if URL looks promising)
   - urls: ["https://neon.tech/docs/..."]
```

---

## Sequential Thinking — Structured Reasoning

**Purpose:** Break down complex problems systematically.

### Triggers

- L4+ complexity tasks
- After any build/deploy/runtime error
- Every 5 implementation steps (progress check)
- Multiple approaches possible (trade-off analysis)
- Architectural decisions

### Usage Pattern

```
mcp_sequential-thinking_sequentialthinking:
  - thought: "Current analysis step"
  - thoughtNumber: 1
  - totalThoughts: 5
  - nextThoughtNeeded: true
```

### When to Use

| Situation           | Recommended Thoughts |
| ------------------- | -------------------- |
| Simple bug          | 2-3 thoughts         |
| Feature decision    | 4-5 thoughts         |
| Architecture choice | 6-8 thoughts         |
| Complex debugging   | 8-10 thoughts        |

---

## Research Cascade Protocol

Follow this order when researching:

```
┌─────────────────────────────────────────────────────────────┐
│  RESEARCH CASCADE (follow in order)                         │
├─────────────────────────────────────────────────────────────┤
│  1. LOCAL CODEBASE                                          │
│     └─→ grep_search, view_file, list_dir                    │
│                                                              │
│  2. CONTEXT7 (official docs)                                │
│     └─→ resolve-library-id → query-docs                     │
│                                                              │
│  3. TAVILY (web search) - only if 1 and 2 insufficient     │
│     └─→ tavily-search → tavily-extract                      │
│                                                              │
│  4. SEQUENTIAL THINKING (synthesis)                         │
│     └─→ Combine information and define solution             │
└─────────────────────────────────────────────────────────────┘
```

---

## Anti-Hallucination Rules

```yaml
critical:
  - "NEVER speculate about unopened code"
  - "MUST read files before making claims"
  - "Search and verify BEFORE responding"
  - "If fact unknown: research it OR mark as Knowledge Gap"
```
