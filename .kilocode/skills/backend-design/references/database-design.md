# Database Design Reference

> Schema design, indexing, query optimization for Neon PostgreSQL + Drizzle ORM.

## Database Selection (This Project)

| Database | Use Case |
|----------|----------|
| **Neon PostgreSQL** | Production (serverless, branching) ✅ |
| SQLite | Local dev, embedded apps |
| Turso | Edge-first, multi-region |

## ORM Selection (This Project)

| ORM | Use Case |
|-----|----------|
| **Drizzle ORM** | Type-safe, SQL-like syntax ✅ |
| Prisma | Schema-first, migrations |
| Kysely | Query builder only |

---

## Schema Design Principles

### Normalization Decision

```
Normalize (separate tables):
├── Data repeated across rows
├── Updates need multiple changes
├── Clear relationships
└── Query patterns benefit

Denormalize (embed/duplicate):
├── Read performance critical
├── Data rarely changes
├── Always fetched together
└── Simpler queries needed
```

### Primary Key Selection

| Type | Use When |
|------|----------|
| Serial/BigSerial | Simple apps, single database ✅ |
| UUID | Distributed systems, security |
| ULID | UUID + sortable by time |

### Timestamps (Always Include)

```typescript
// Drizzle pattern
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().notNull(),
```

### Relationship Types

| Type | Implementation |
|------|----------------|
| One-to-One | FK on child with unique constraint |
| One-to-Many | FK on child table |
| Many-to-Many | Junction table |

---

## Indexing Principles

### When to Index

```
✅ Index these:
├── WHERE clause columns
├── JOIN condition columns
├── ORDER BY columns
├── Foreign keys
└── Unique constraints

❌ Don't over-index:
├── Write-heavy tables
├── Low-cardinality columns
├── Rarely queried columns
```

### Index Types

| Type | Use For |
|------|---------|
| B-tree | General purpose (default) |
| Hash | Equality only |
| GIN | JSONB, arrays, full-text |
| pgvector | Vector similarity |

### Composite Index Order

```
Order matters:
├── Equality columns FIRST
├── Range columns LAST
├── Most selective FIRST
└── Match query pattern
```

---

## Query Optimization

### N+1 Problem

```
Problem:
├── 1 query for parents
├── N queries for children
└── Very slow!

Solutions:
├── JOIN → Single query
├── Eager loading → ORM joins
├── Batch loading → Promise.all
```

### EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

Look for:
├── Seq Scan → Add index
├── Actual vs estimated rows mismatch
├── High execution time
```

### Drizzle Patterns

```typescript
// ✅ Select specific columns
db.select({ id: users.id, name: users.name }).from(users);

// ✅ Use indexes with eq()
db.select().from(users).where(eq(users.email, email));

// ✅ JOIN instead of N+1
db.select()
  .from(mentorados)
  .leftJoin(metrics, eq(mentorados.id, metrics.mentoradoId));

// ✅ Batch writes
await Promise.all(items.map(item => db.insert(table).values(item)));
```

---

## Anti-Patterns

❌ Default to PostgreSQL for simple apps (SQLite may suffice)
❌ Skip indexing on FK columns
❌ Use `SELECT *` in production
❌ Store JSON when structured data is better
❌ Ignore N+1 queries
❌ Create new tables when extending existing works

---

## Checklist

- [ ] Database chosen for THIS context?
- [ ] Deployment environment considered?
- [ ] Index strategy planned?
- [ ] Relationship types defined?
- [ ] Timestamps included?
- [ ] N+1 patterns avoided?
