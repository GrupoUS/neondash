# Testing Pyramid

> Unit → Integration → E2E: From fast/isolated to slow/comprehensive.

```
        /\
       /E2E\       ← Few, slow, high confidence
      /------\
     / Integ. \    ← Some, medium speed
    /----------\
   /   Unit     \  ← Many, fast, isolated
  /--------------\
```

## Layer Selection

| Layer | Tool | When to Use | Count |
|-------|------|-------------|-------|
| **Unit** | Vitest | Pure functions, utils, business logic | 70% |
| **Integration** | Vitest + tRPC | API routes, DB queries, auth flows | 20% |
| **E2E** | agent-browser | Critical user journeys, UI flows | 10% |

## Unit Tests

```typescript
// Pattern: AAA (Arrange, Act, Assert)
describe('calculateTotal', () => {
  it('sums items correctly', () => {
    // Arrange
    const items = [{ price: 10 }, { price: 20 }];

    // Act
    const result = calculateTotal(items);

    // Assert
    expect(result).toBe(30);
  });
});
```

## Integration Tests

```typescript
// Test API + DB together
describe('mentorados.create', () => {
  it('creates mentorado in database', async () => {
    const result = await caller.mentorados.create({
      nome_completo: 'Test User',
      turma: 'neon_estrutura'
    });

    expect(result.id).toBeDefined();
  });
});
```

## E2E Tests (agent-browser)

```bash
# Test login flow
agent-browser open http://localhost:3000/login
agent-browser find label "Email" fill "test@example.com"
agent-browser find label "Password" fill "password123"
agent-browser find role button click --name "Sign In"
agent-browser wait --text "Dashboard"
agent-browser screenshot login-success.png
```

## Test Naming Convention

```
describe('[Component/Function]')
  it('[should/does] [expected behavior] [when condition]')
```

Examples:
- `it('calculates tax correctly for positive amounts')`
- `it('throws error when input is negative')`
- `it('returns empty array when no items found')`

## Commands

```bash
# Run all tests
bun test

# Run specific file
bun test path/to/file.test.ts

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```
