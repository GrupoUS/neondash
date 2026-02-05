# PLAN-session-duedate-fix: Fix "Invalid ISO date" Error on Session Save

> **Goal:** Corrigir erro de validação Zod que impede salvar sessões com action items sem data definida.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Frontend envia `dueDate: ""` quando input date está vazio | 5/5 | `MentorshipAdmin.tsx:327` | Causa do erro |
| 2 | Backend usa `z.string().date()` que rejeita strings vazias | 5/5 | `mentorship.ts:108,184` | Causa do erro |
| 3 | Schema DB define `dueDate: date("due_date")` como nullable | 5/5 | `schema.ts:1127` | Aceita null |
| 4 | Erro aparece no tRPC como array de validação | 5/5 | Screenshot do usuário | Múltiplos items afetados |
| 5 | `z.preprocess()` pode transformar `""` → `undefined` antes da validação | 5/5 | Zod docs | Solução |

### Knowledge Gaps & Assumptions
- **Assumption:** A solução no backend é preferível pois centraliza a lógica

---

## 1. User Review Required

> [!IMPORTANT]
> Esta é uma correção simples de validação. O **único arquivo modificado** será `server/routers/mentorship.ts`.

---

## 2. Proposed Changes

### Backend - Validação Zod

#### [MODIFY] [mentorship.ts](file:///home/mauricio/neondash/server/routers/mentorship.ts)

**Linhas 108 e 184:** Alterar validação de `dueDate`

**De:**
```typescript
dueDate: z.string().date().optional(),
```

**Para:**
```typescript
dueDate: z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().date().optional()
),
```

Isso converte strings vazias em `undefined` antes da validação, permitindo que o campo seja tratado como não-preenchido.

---

## 3. Atomic Implementation Tasks

### AT-001: Corrigir validação dueDate em createSession
**Goal:** Aceitar strings vazias como undefined no input de createSession
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Adicionar z.preprocess na linha 108
  - **File:** `server/routers/mentorship.ts`
  - **Validation:** `bun run check` passes
- [ ] ST-001.2: Testar criação de sessão com dueDate vazio
  - **Validation:** Criar sessão via UI com action item sem data

**Rollback:** `git checkout server/routers/mentorship.ts`

---

### AT-002: Corrigir validação dueDate em updateSession ⚡ PARALLEL-SAFE
**Goal:** Aceitar strings vazias como undefined no input de updateSession
**Dependencies:** None (pode rodar em paralelo com AT-001)

#### Subtasks:
- [ ] ST-002.1: Adicionar z.preprocess na linha 184
  - **File:** `server/routers/mentorship.ts`
  - **Validation:** `bun run check` passes
- [ ] ST-002.2: Testar edição de sessão existente com dueDate vazio
  - **Validation:** Editar sessão via UI e limpar data de action item

**Rollback:** `git checkout server/routers/mentorship.ts`

---

## 4. Verification Plan

### Automated Tests
```bash
bun run check   # TypeScript validation - must pass
bun run lint    # Linting - must pass
```

### Manual Verification
1. Iniciar servidor: `bun dev`
2. Acessar `/admin` → aba "Mentoria"
3. Selecionar um mentorado
4. Clicar "Nova Sessão"
5. Preencher título e resumo
6. Adicionar action item COM descrição mas SEM data
7. Clicar "Criar Sessão"
8. **Esperado:** Sessão criada sem erro

---

## 5. Rollback Plan

```bash
git checkout server/routers/mentorship.ts
```
