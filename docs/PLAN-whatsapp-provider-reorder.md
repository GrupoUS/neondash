# PLAN-whatsapp-provider-reorder: Remover Meta Cloud API e Priorizar Baileys

> **Goal:** Remover temporariamente a opção Meta Cloud API do frontend (mantendo backend intacto) e reordenar os provedores de WhatsApp para que Baileys seja a primeira opção.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Settings.tsx já tem `defaultValue="baileys"` nos Tabs | 5/5 | `client/src/pages/Settings.tsx:48` | Mínimo - já está pré-selecionado |
| 2 | Existem 3 tabs: Z-API, Meta, Baileys (nesta ordem visual) | 5/5 | `Settings.tsx:49-53` | Médio - requer reordenação |
| 3 | MetaConnectionCard.tsx (427 linhas) é usado apenas em Settings.tsx | 5/5 | grep_search | Fácil - comentar import e uso |
| 4 | ProviderComparisonTable.tsx mostra coluna "Meta Cloud API" | 5/5 | Linhas 64, 73 | Requer atualização da tabela |
| 5 | Backend metaApi em `server/` permanece intacto | 5/5 | Requisito do usuário | Não alterar backend |

### Knowledge Gaps & Assumptions
- **Assumption:** O usuário pretende reativar a opção Meta futuramente (por isso manter backend)
- **Assumption:** Z-API deve permanecer visível como segunda opção

---

## 1. User Review Required (If Any)

> [!IMPORTANT]
> **Confirmação de ordem das tabs:**
> 
> Nova ordem proposta:
> 1. **Baileys (Self-Hosted)** - Primeira opção, destacada
> 2. **Z-API (Estável)** - Segunda opção
> 
> A tab Meta Cloud API será **ocultada** mas o código permanecerá (comentado) para reativação futura.

---

## 2. Proposed Changes

### Frontend - Settings Page

#### [MODIFY] [Settings.tsx](file:///home/mauricio/neondash/client/src/pages/Settings.tsx)
- **Action:** Remover/comentar import e uso do MetaConnectionCard
- **Details:**
  - Comentar linha 15: `import { MetaConnectionCard }`
  - Remover TabsTrigger "meta" (linha 51)
  - Remover TabsContent "meta" (linhas 59-61)
  - Reordenar TabsList para: Baileys → Z-API (2 colunas)

---

### Frontend - Comparison Table

#### [MODIFY] [ProviderComparisonTable.tsx](file:///home/mauricio/neondash/client/src/components/whatsapp/ProviderComparisonTable.tsx)
- **Action:** Remover coluna Meta Cloud API e reordenar colunas
- **Details:**
  - Remover `meta: string` do tipo ProviderComparisonRow (linha 13)
  - Remover valores `meta` de todos os PROVIDER_ROWS (linhas 22, 28, 35-36, 41-42, 47)
  - Remover TableHead "Meta Cloud API" (linha 64)
  - Remover TableCell `{row.meta}` (linha 74)
  - Reordenar para: Recurso → Baileys → Z-API

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Cada task tem subtasks. Nenhuma task solitária permitida.

### AT-001: Modificar Settings.tsx - Remover Meta e Reordenar
**Goal:** Ocultar Meta Cloud API tab e colocar Baileys primeiro
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Comentar import do MetaConnectionCard
  - **File:** `client/src/pages/Settings.tsx`
  - **Validation:** Verificar que não há erro de import
- [ ] ST-001.2: Atualizar TabsList de grid-cols-3 para grid-cols-2
  - **File:** `client/src/pages/Settings.tsx`
  - **Validation:** Build sem erros
- [ ] ST-001.3: Remover TabsTrigger "meta" e reordenar (baileys → zapi)
  - **File:** `client/src/pages/Settings.tsx`
  - **Validation:** Visual check
- [ ] ST-001.4: Remover TabsContent "meta"
  - **File:** `client/src/pages/Settings.tsx`
  - **Validation:** Build sem erros

**Rollback:** `git checkout client/src/pages/Settings.tsx`

⚡ **PARALLEL-SAFE** with AT-002

---

### AT-002: Modificar ProviderComparisonTable.tsx - Remover Coluna Meta
**Goal:** Remover referências ao Meta da tabela comparativa
**Dependencies:** None

#### Subtasks:
- [ ] ST-002.1: Remover `meta: string` do tipo ProviderComparisonRow
  - **File:** `client/src/components/whatsapp/ProviderComparisonTable.tsx`
  - **Validation:** TypeScript sem erros
- [ ] ST-002.2: Remover propriedade `meta` de todos os itens PROVIDER_ROWS
  - **File:** `client/src/components/whatsapp/ProviderComparisonTable.tsx`
  - **Validation:** Build sem erros
- [ ] ST-002.3: Reordenar colunas da tabela (Recurso → Baileys → Z-API)
  - **File:** `client/src/components/whatsapp/ProviderComparisonTable.tsx`
  - **Validation:** Visual check
- [ ] ST-002.4: Remover TableHead e TableCell do Meta
  - **File:** `client/src/components/whatsapp/ProviderComparisonTable.tsx`
  - **Validation:** TypeScript sem erros

**Rollback:** `git checkout client/src/components/whatsapp/ProviderComparisonTable.tsx`

⚡ **PARALLEL-SAFE** with AT-001

---

## 4. Verification Plan

### Automated Tests
```bash
# TypeScript type checking
bun run check

# Linting
bun run lint

# Unit tests (se existirem)
bun test
```

### Manual Verification
1. Iniciar dev server: `bun dev`
2. Navegar para `/settings`
3. Verificar:
   - [ ] Apenas 2 tabs visíveis: "Baileys (Self-Hosted)" e "Z-API (Estável)"
   - [ ] Baileys está selecionado por padrão
   - [ ] Baileys aparece primeiro (esquerda)
   - [ ] Tabela comparativa mostra apenas 2 colunas (Baileys e Z-API)
   - [ ] BaileysConnectionCard renderiza corretamente
   - [ ] Z-API card renderiza ao clicar na tab

---

## 5. Rollback Plan

```bash
# Reverter ambos os arquivos
git checkout client/src/pages/Settings.tsx
git checkout client/src/components/whatsapp/ProviderComparisonTable.tsx
```

---

## Pre-Submission Checklist

- [x] Created `docs/PLAN-whatsapp-provider-reorder.md`
- [x] Findings Table with 5 entries
- [x] Knowledge Gaps listed
- [x] All tasks have AT-XXX IDs
- [x] All tasks have subtasks (ST-XXX.N)
- [x] Dependencies mapped
- [x] Rollback steps defined
- [x] Parallel-safe marked with ⚡
