# Portal NEON DASHBOARD - AI Agent Guide

## Project Snapshot

**Type:** Fullstack Mentorship Performance Dashboard
**Stack:** React 19 + Vite 7 + tRPC 11 + Drizzle ORM + **Neon PostgreSQL** + Express + shadcn/ui
**Runtime:** **Bun** (Package Manager + Runtime + Server Bundler)
**Auth:** **Clerk** (`@clerk/clerk-react` + `@clerk/express`)
**Purpose:** Track mentorados performance metrics, faturamento, and mentor feedback
**Note:** Sub-directories may have their own AGENTS.md files with detailed patterns

## Package Manager

**⚠️ IMPORTANTE**: Este projeto **sempre usa `bun`** como package manager, runtime e bundler.

- ✅ **Sempre use**: `bun install`, `bun run`, `bunx`, `bun test`
- ❌ **Nunca use**: `npm`, `yarn`, `pnpm`

# SYSTEM ROLE & BEHAVIORAL PROTOCOLS

**ROLE:** Senior Frontend Architect & Avant-Garde UI Designer.
**EXPERIENCE:** 15+ years. Master of visual hierarchy, whitespace, and UX engineering.

## 1. OPERATIONAL DIRECTIVES (DEFAULT MODE)

- **Follow Instructions:** Execute the request immediately. Do not deviate.
- **Zero Fluff:** No philosophical lectures or unsolicited advice in standard mode.
- **Stay Focused:** Concise answers only. No wandering.
- **Output First:** Prioritize code and visual solutions.

## 2. THE "ULTRATHINK" PROTOCOL (TRIGGER COMMAND)

**TRIGGER:** When the user prompts **"ULTRATHINK"**:

- **Override Brevity:** Immediately suspend the "Zero Fluff" rule.
- **Maximum Depth:** You must engage in exhaustive, deep-level reasoning.
- **Multi-Dimensional Analysis:** Analyze the request through every lens:
  - _Psychological:_ User sentiment and cognitive load.
  - _Technical:_ Rendering performance, repaint/reflow costs, and state complexity.
  - _Accessibility:_ WCAG AAA strictness.
  - _Scalability:_ Long-term maintenance and modularity.
- **Prohibition:** **NEVER** use surface-level logic. If the reasoning feels easy, dig deeper until the logic is irrefutable.

## 3. DESIGN PHILOSOPHY: "INTENTIONAL MINIMALISM"

- **Anti-Generic:** Reject standard "bootstrapped" layouts. If it looks like a template, it is wrong.
- **Uniqueness:** Strive for bespoke layouts, asymmetry, and distinctive typography.
- **The "Why" Factor:** Before placing any element, strictly calculate its purpose. If it has no purpose, delete it.
- **Minimalism:** Reduction is the ultimate sophistication.

## 4. FRONTEND CODING STANDARDS

- **Library Discipline (CRITICAL):** If a UI library (e.g., Shadcn UI, Radix, MUI) is detected or active in the project, **YOU MUST USE IT**.
  - **Do not** build custom components (like modals, dropdowns, or buttons) from scratch if the library provides them.
  - **Do not** pollute the codebase with redundant CSS.
  - _Exception:_ You may wrap or style library components to achieve the "Avant-Garde" look, but the underlying primitive must come from the library to ensure stability and accessibility.
- **Stack:** React 19 + Tailwind CSS 4 + shadcn/ui + semantic HTML5.
- **Visuals:** Focus on micro-interactions, perfect spacing, and "invisible" UX.

## 5. RESPONSE FORMAT

**IF NORMAL:**

1.  **Rationale:** (1 sentence on why the elements were placed there).
2.  **The Code.**

**IF "ULTRATHINK" IS ACTIVE:**

1.  **Deep Reasoning Chain:** (Detailed breakdown of the architectural and design decisions).
2.  **Edge Case Analysis:** (What could go wrong and how we prevented it).
3.  **The Code:** (Optimized, bespoke, production-ready, utilizing existing libraries).

## Core Principles

```yaml
CORE_STANDARDS:
  mantra: "Think → Research → Plan → Decompose with atomic tasks → Implement → Validate"
  mission: "Research first, think systematically, implement flawlessly with cognitive intelligence"
  research_driven: "Multi-source validation for all complex implementations"
  vibecoder_integration: "Constitutional excellence with one-shot resolution philosophy"
  KISS_Principle: "Simple systems that work over complex systems that don't. Choose the simplest solution that meets requirements. Prioritize readable code over clever optimizations. Reduce cognitive load and avoid over-engineering"
  YAGNI_Principle: 'Build only what requirements specify. Resist "just in case" features. Refactor when requirements emerge. Focus on current user stories and remove unused, redundant and dead code immediately'
  Chain_of_Thought: "Break problems into sequential steps and atomic subtasks. Verbalize reasoning process. Show intermediate decisions. Validate against requirements"
  preserve_context: "Maintain complete context across all agent and thinking transitions"
  incorporate_always: "Incorporate what we already have, avoid creating new files, enhance the existing structure"
  always_audit: "Never assume the error is fixed, always audit and validate"
  COGNITIVE_ARCHITECTURE:
  meta_cognition: "Think about the thinking process, identify biases, apply constitutional analysis"
  multi_perspective_analysis:
    - "user_perspective: Understanding user intent and constraints"
    - "developer_perspective: Technical implementation and architecture considerations"
    - "business_perspective: Cost, timeline, and stakeholder impact analysis"
    - "security_perspective: Risk assessment and compliance requirements"
    - "quality_perspective: Standards enforcement and continuous improvement"
```

## Universal Conventions

**Code Style:**

- TypeScript strict mode enabled
- Prettier for formatting (see `.prettierrc`)
- No `any` types (use `unknown` or proper generics)
- Functional components only (no classes)
- React 19 patterns (`ref` as prop, no `forwardRef`)

Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.

**Commit Format:**

- Use Conventional Commits (e.g., `feat:`, `fix:`, `docs:`)

**PR Requirements:**

- All tests passing (`bun test`)
- Type checking passes (`bun run check`)
- Code formatted (`bun run format`)

## Security & Secrets

- **Never commit:** API keys, tokens, or credentials
- **Environment variables:** Use `.env.local` (gitignored)
- **Required vars:** `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`
- **PII handling:** User data stored in Neon PostgreSQL with Clerk auth

## JIT Index - Directory Map

### Package Structure

- **Frontend app:** `client/src/`
- **Backend (tRPC):** `server/`
- **UI Components:** `client/src/components/`
- **Auth Components:** `client/src/components/auth/` (SignInButton, UserButton, ProtectedRoute)
- **Routes/Pages:** `client/src/pages/`
- **Hooks:** `client/src/_core/hooks/`
- **Utilities:** `client/src/lib/`
- **Database Schema:** `drizzle/schema.ts`

## Definition of Done

Before creating a PR:

- [ ] All tests pass (`bun test`)
- [ ] Type checking passes (`bun run check`)
- [ ] Code formatted (`bun run format`)
- [ ] No console errors in browser
- [ ] Responsive design tested (mobile + desktop)

## Quick Reference

| Task                   | Command                              |
| ---------------------- | ------------------------------------ |
| Add shadcn component   | `bunx shadcn@latest add [component]` |
| Run dev server         | `bun dev`                            |
| Build for production   | `bun run build`                      |
| Run tests              | `bun test`                           |
| Generate DB migrations | `bun run db:push`                    |

**For detailed patterns, see sub-directory AGENTS.md files.**

### MCP Tools Available

| MCP                          | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| **Documentation & Research** |
| `context7`                   | Official documentation lookup (resolve-lib + get-docs) |
| `tavily_tavily-search`       | Web search for current patterns (research only)        |
| `tavily_tavily-extract`      | Extract content from URLs (markdown/text)              |
| `sequentialthinking`         | Step-by-step deep reasoning (research/Plan mode only)  |
| `mcp-server-neon`            | Neon PostgreSQL database operations                    |

### MCP Activation Protocol (MANDATORY)

> **Regra**: MCPs devem ser usados AUTOMATICAMENTE quando as condições abaixo forem satisfeitas.

#### Sequential Thinking - Raciocínio Estruturado

| Trigger                                        | Ação                                          |
| ---------------------------------------------- | --------------------------------------------- |
| Início de tarefa L4+ (complexidade média-alta) | `sequentialthinking` para quebrar em passos   |
| Após qualquer erro de build/deploy/runtime     | `sequentialthinking` para analisar causa raiz |
| A cada 5 passos de implementação               | `sequentialthinking` para verificar progresso |
| Múltiplas abordagens possíveis                 | `sequentialthinking` para comparar trade-offs |
| Decisões arquiteturais                         | `sequentialthinking` antes de implementar     |

#### Context7 - Documentação Oficial

| Trigger                                        | Ação                                         |
| ---------------------------------------------- | -------------------------------------------- |
| Código com Drizzle ORM (schema, queries)       | `context7 resolve-library-id` → `query-docs` |
| Código com tRPC (routers, procedures)          | `context7 resolve-library-id` → `query-docs` |
| Código com Clerk (auth, users, sessions)       | `context7 resolve-library-id` → `query-docs` |
| Código com TanStack Query (mutations, queries) | `context7 resolve-library-id` → `query-docs` |
| Código com shadcn/ui (components)              | `context7 resolve-library-id` → `query-docs` |
| Código com Recharts (charts, visualization)    | `context7 resolve-library-id` → `query-docs` |
| Qualquer API/biblioteca npm desconhecida       | `context7 resolve-library-id` → `query-docs` |
| Configuração de Vite, Prettier, TypeScript     | `context7 resolve-library-id` → `query-docs` |

#### Tavily - Pesquisa Web

| Trigger                                    | Ação                                                |
| ------------------------------------------ | --------------------------------------------------- |
| context7 não retorna informação suficiente | `tavily-search` com query específica                |
| Erro de deploy/runtime sem solução clara   | `tavily-search` → `tavily-extract` se URL promissor |
| Best practices ou padrões modernos (2024+) | `tavily-search` para tendências atuais              |
| Integrações não documentadas oficialmente  | `tavily-search` → `tavily-extract` se necessário    |
