# Code Principles Reference

## LEVER Philosophy

> **L**everage patterns | **E**xtend first | **V**erify reactivity | **E**liminate duplication | **R**educe complexity

**"The best code is no code. The second best structure is the one that already exists."**

## Decision Tree

```
Before coding:
1. Can existing code handle it? → Yes: EXTEND
2. Can we modify existing patterns? → Yes: ADAPT
3. Is new code reusable? → Yes: ABSTRACT → No: RECONSIDER
```

## Scoring: Extend vs Create

| Factor | Points |
|--------|--------|
| Reuse data structure | +3 |
| Reuse indexes/queries | +3 |
| Reuse >70% code | +5 |
| Circular dependencies | -5 |
| Distinct domain | -3 |

**Score > 5**: Extend existing code.

## Three-Pass Process

| Pass | Focus | Code |
|------|-------|------|
| 1. Discovery | Find related code, document patterns | None |
| 2. Design | Write interfaces, plan data flow | Minimal |
| 3. Implementation | Execute with max reuse | Essential only |

## Database Rules

**Goal**: 0 new tables.

```typescript
// ❌ DON'T
campaignTracking: defineTable({ ... })

// ✅ DO
users: defineTable({
  ...existing,
  campaignSource: v.optional(v.string()),
});
```

## Query Rules

**Goal**: No duplicate logic.

```typescript
// ❌ DON'T: getTrialUsers AND getUsers

// ✅ DO: Extend with computed props
export const getUserStatus = query({
  handler: async ctx => ({
    ...await getUser(ctx),
    isTrial: Boolean(user?.campaign),
  }),
});
```

## Performance Rules

- Use `useQuery` (reactive) over `useState/useEffect` (manual)
- Use `Promise.all` for batch writes
- Reuse indexes with `.filter()`
- Single aggregated query > 3 separate requests

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| UI-Driven DB | Schema matches components |
| "Just one more table" | Join complexity |
| Parallel APIs | Duplication |
| Manual state sync | Race conditions |
| Sequential DB writes | Performance |

## Metrics

- Code reduction: >50% vs fresh build
- New tables: 0
- New files: <3 per feature

## Review Checklist

- [ ] Extended existing tables/queries?
- [ ] Followed Three-Pass approach?
- [ ] No manual state sync?
- [ ] Added fields are optional?
- [ ] New code < 50% of fresh implementation?
