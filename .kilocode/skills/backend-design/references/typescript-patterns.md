# TypeScript Patterns Reference

## Type Error Solutions

### "Type instantiation is excessively deep"

```typescript
// ❌ Anti-Pattern
const mutate = useMutation(api.leads.updateStatus);

// ❌ Late cast (still recurses)
const mutate = useMutation(api.leads.updateStatus as any);

// ✅ Early cast (breaks recursion)
const mutate = useMutation((api as any).leads.updateStatus);
```

### "The inferred type cannot be named"

- **Cause**: Missing type export or circular dependency
- **Fix**: Export the type explicitly or break the circular import

## Branded Types

```typescript
type Brand<K, T> = K & { __brand: T };
type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

// Prevents: processOrder(userId, orderId) // Wrong order!
function processOrder(orderId: OrderId, userId: UserId) {}
```

## Satisfies Operator (TS 5.0+)

```typescript
// Preserves literal types while ensuring constraints
const config = {
  api: "https://api.example.com",
  timeout: 5000,
} satisfies Record<string, string | number>;
```

## Const Assertions

```typescript
const routes = ["/home", "/about"] as const;
type Route = (typeof routes)[number]; // "/home" | "/about"
```

## Build Performance

```bash
# Diagnose
npx tsc --extendedDiagnostics --incremental false

# Quick check
bun run check
```

### Optimization Tips

- `skipLibCheck: true` for faster builds
- `incremental: true` with `.tsbuildinfo` cache
- Precise `include`/`exclude` patterns
- Project references for monorepos

## Best Practices

| Do | Don't |
|----|-------|
| Use `unknown` | Use `any` |
| Explicit exports | Implicit inference |
| `const` assertions | Mutable literals |
| `satisfies` | Type assertions |
| Branded types | Primitive obsession |
