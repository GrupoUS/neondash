# API Patterns Reference

## Decision Tree: REST vs GraphQL vs tRPC

```
Who consumes the API?
│
├── TypeScript monorepo (same codebase)
│   └── tRPC ✅ (type-safe E2E, no codegen)
│
├── Multiple clients / multiple languages
│   └── REST ✅ (universal, cacheable)
│
├── Complex nested data, flexible queries needed
│   └── GraphQL ✅ (client-driven queries)
│
└── Unsure?
    └── ASK USER first!
```

## tRPC (This Project)

```typescript
// Router pattern
export const userRouter = router({
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(users).where(eq(users.id, input.id));
    }),

  create: protectedProcedure
    .input(insertUserSchema)
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db.insert(users).values(input).returning();
      return user;
    }),
});
```

## REST Conventions

| Method | Action | Status Codes |
|--------|--------|--------------|
| GET | Read | 200, 404 |
| POST | Create | 201, 400 |
| PUT | Replace | 200, 404 |
| PATCH | Update | 200, 404 |
| DELETE | Remove | 204, 404 |

## Response Format

```typescript
// Success
{
  data: T,
  meta?: { page: number, total: number }
}

// Error
{
  error: {
    code: string,
    message: string,
    details?: object
  }
}
```

## Auth Patterns

| Pattern | Use Case |
|---------|----------|
| JWT | Stateless APIs, mobile apps |
| Session cookies | Web apps, SSR |
| API Keys | Server-to-server |
| OAuth | Third-party auth |

## Anti-Patterns

❌ Verbs in REST endpoints (`/getUsers`)
❌ Inconsistent response formats
❌ Exposing internal errors
❌ No rate limiting
❌ No pagination on list endpoints
