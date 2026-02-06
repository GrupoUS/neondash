---
trigger: always_on
---

# GEMINI.md - Project Rules

> **Single source of truth for AI behavior in this workspace.**

---

## 🔴 MANDATORY SKILL LOADING

Before ANY implementation:

1. **CHECK** which skill applies to the request
2. **READ** the skill's `SKILL.md`
3. **APPLY** rules from skill + this file

### Skills (7 total)

| Skill             | Purpose                                    | When to Use         |
| ----------------- | ------------------------------------------ | ------------------- |
| `backend-design`  | API, TypeScript, data, DB, code principles | Backend work        |
| `debug`           | Testing, debugging, fixing                 | Bugs, errors        |
| `frontend-design` | UI/UX, Tailwind, components                | Frontend work       |
| `notion`          | Notion CMS integration                     | Content from Notion |
| `planning`        | Project planning, PRPs                     | Complex tasks       |
| `skill-creator`   | Creating new skills                        | Meta work           |
| `theme-factory`   | Visual themes                              | Styling artifacts   |

### Workflows (4 total)

| Command      | Description                                    |
| ------------ | ---------------------------------------------- |
| `/debug`     | Systematic problem investigation & QA pipeline |
| `/design`    | Frontend design orchestration                  |
| `/implement` | Execute approved implementation plan           |
| `/plan`      | Create project plan with research              |

**Priority:** GEMINI.md > Skill

---

## 🧠 LEVER Philosophy (ALWAYS APPLY)

> **L**everage patterns | **E**xtend first | **V**erify reactivity | **E**liminate duplication | **R**educe complexity

**"The best code is no code. The second best structure is the one that already exists."**

### Decision Tree

```
Before coding:
├── Can existing code handle it? → Yes: EXTEND
├── Can we modify existing patterns? → Yes: ADAPT
└── Is new code reusable? → Yes: ABSTRACT → No: RECONSIDER
```

### Scoring: Extend vs Create

| Factor                | Points |
| --------------------- | ------ |
| Reuse data structure  | +3     |
| Reuse indexes/queries | +3     |
| Reuse >70% code       | +5     |
| Circular dependencies | -5     |
| Distinct domain       | -3     |

**Score > 5**: Extend existing code.

---

## 🛠️ Three-Pass Implementation

| Pass              | Focus                                | Code           |
| ----------------- | ------------------------------------ | -------------- |
| 1. Discovery      | Find related code, document patterns | None           |
| 2. Design         | Write interfaces, plan data flow     | Minimal        |
| 3. Implementation | Execute with max reuse               | Essential only |

---

## 📋 Request Classification

| Type          | Keywords                  | Action             |
| ------------- | ------------------------- | ------------------ |
| Question      | "what is", "explain"      | Answer directly    |
| Simple edit   | "fix", "add" (1 file)     | Edit directly      |
| Complex build | "create", "implement"     | `/plan` first      |
| Debug         | "bug", "error", "broken"  | `/debug` workflow  |
| Design        | "UI", "page", "dashboard" | `/design` workflow |

---

## 🏗️ Architecture Principles

### Database

**Goal**: 0 new tables. Extend existing.

```typescript
// ❌ DON'T
campaignTracking: pgTable("campaign_tracking", { ... })

// ✅ DO
users: pgTable("users", {
  ...existing,
  campaignSource: varchar("campaign_source"),
});
```

### Queries

**Goal**: No duplicate logic.

```typescript
// ❌ DON'T: getTrialUsers AND getUsers

// ✅ DO: Extend with computed props
export const getUserStatus = query({
  handler: async ctx => ({
    ...(await getUser(ctx)),
    isTrial: Boolean(user?.campaign),
  }),
});
```

### Performance

- Use `useQuery` (reactive) over `useState/useEffect`
- Use `Promise.all` for batch writes
- Reuse indexes with `.filter()`
- Single aggregated query > 3 separate requests

---

## 🔧 Code Quality Standards (Ultracite)

### Type Safety

- Use `unknown` over `any` when type is genuinely unknown
- Use const assertions (`as const`) for immutable values
- Use meaningful variable names instead of magic numbers
- Leverage TypeScript's type narrowing over assertions

### Modern TypeScript

```typescript
// ✅ Use
const foo = bar?.baz ?? "default"; // Optional chaining + nullish
for (const item of items) {
} // for...of
const { id, name } = user; // Destructuring
const msg = `Hello ${name}`; // Template literals
```

### "Type instantiation is excessively deep"

```typescript
// ✅ Early cast
const mutate = useMutation((api as any).leads.updateStatus);
```

### React 19 Rules

- Function components only (no classes)
- Hooks at top level only (never conditional)
- Use `ref` as prop (not `React.forwardRef`)
- Always specify hook dependency arrays correctly
- Use unique IDs for `key` props (not array indices)

### Error Handling

- No `console.log`/`debugger` in production
- Throw `Error` objects with descriptive messages
- Use early returns over nested conditionals
- Handle async errors with try-catch

### Security

- Add `rel="noopener"` on `target="_blank"` links
- Avoid `dangerouslySetInnerHTML`
- Never use `eval()`
- Validate and sanitize user input

### Performance

- Avoid spread in loop accumulators
- Use top-level regex literals
- Prefer specific imports over namespace imports
- Avoid barrel files (index re-exports)

---

## ✅ Review Checklist

### Code Quality

- [ ] Extended existing tables/queries?
- [ ] Followed Three-Pass approach?
- [ ] No manual state sync?
- [ ] New code < 50% of fresh implementation?

### Stack

- [ ] `bun run check` passes?
- [ ] `bun run lint:check` passes? (Biome)
- [ ] `bun run test` passes? (Vitest)
- [ ] No console errors in browser?

---

## 📁 Project Structure

```
neondash/
├── client/src/           # React frontend
│   ├── components/       # UI components
│   ├── pages/            # Route pages
│   └── lib/trpc.ts       # tRPC client
├── server/               # Express + tRPC backend
│   ├── _core/            # Server core (index, context)
│   └── *.ts              # Feature routers
├── drizzle/              # Database schema
│   └── schema.ts         # Neon PostgreSQL tables
└── .agent/               # AI configuration
    ├── skills/           # 7 skills
    ├── workflows/        # 4 workflows
    └── rules/            # This file
```

---

## 🛑 Anti-Patterns

| Pattern               | Problem                   |
| --------------------- | ------------------------- |
| UI-Driven DB          | Schema matches components |
| "Just one more table" | Join complexity           |
| Parallel APIs         | Duplication               |
| Manual state sync     | Race conditions           |
| `SELECT *`            | Performance               |
| No indexes on FKs     | Slow queries              |

---

## 📦 Stack Quick Reference

| Layer    | Technology                    |
| -------- | ----------------------------- |
| Runtime  | Bun                           |
| Frontend | React 19 + Vite               |
| Styling  | Tailwind CSS 4 + shadcn/ui    |
| Routing  | wouter                        |
| State    | TanStack Query + tRPC         |
| Backend  | Express + tRPC 11             |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth     | Clerk                         |
| Linter   | Biome                         |
| Tests    | Vitest                        |

---

## 🚀 Commands

```bash
bun dev             # Dev server
bun run check       # TypeScript type check
bun run lint        # Biome lint + format (auto-fix)
bun run lint:check  # Biome lint + format (check only)
bun run format      # Biome format only
bun run test        # Vitest run
bun run test:watch  # Vitest watch mode
bun run db:push     # Drizzle migrations
```

