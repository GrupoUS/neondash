# PLAN-seed-financeiro-defaults: Default Financial Data for Aesthetic Clinics

> **Goal:** Create default insumos, categorias, and formas de pagamento based on Brazilian aesthetic clinic market standards, all editable by users.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Insumos comuns: toxina botulínica, ácido hialurônico, descartáveis, anestésicos tópicos | 5/5 | Tavily (BCMED, Utilidades Clínicas) | Defines default insumos list |
| 2 | Categorias: procedimentos faciais/corporais, HOF, venda produtos, insumos, marketing | 5/5 | Market research | Defines categorias list |
| 3 | Formas pagamento Brasil: PIX (0%), Débito (1.5%), Crédito (2.5-6%), Boleto | 5/5 | Market standard | Defines payment methods |
| 4 | Existing routers support `create` mutations for all entities | 5/5 | Codebase (`financeiroRouter.ts`, `precificacaoRouter.ts`) | Reuse patterns for seed |
| 5 | No existing seed mechanism in codebase | 5/5 | grep search | Need to create new mutation |

### Knowledge Gaps & Assumptions
- **Assumption:** Users want an opt-in button to load defaults (not auto-seed)
- **Assumption:** Prices/values are in centavos (following codebase patterns)

---

## 1. User Review Required

> [!IMPORTANT]
> **Default Data Confirmation:** The seed data below is based on Brazilian aesthetic clinic market research. Review and confirm the categories, supplies, and payment methods before implementation.

### Default Insumos (54 items)

| Nome | Valor Compra (R$) | Rendimento |
|------|-------------------|------------|
| Agulha 40x13 | 25,00 | 100 |
| Agulha 30x13 | 39,00 | 100 |
| Agulha 80x30 | 25,00 | 100 |
| Agulha 60x30 | 25,00 | 100 |
| Agulha 30x7 | 15,00 | 100 |
| Agulha Ponteira Capilar | 80,00 | 8 |
| Ponteira SmartGR | 290,00 | 10 |
| Ponteira 5 Agulhas | 1,00 | 1 |
| Ativos - Alopecia Masculina | 144,10 | 5 |
| Dudasterida | 186,34 | 10 |
| Ativos - Alopecia Masculina + Feminina | 163,52 | 5 |
| Ativos - IM Boom Capilar | 113,56 | 10 |
| Anestésico | 40,00 | 1 |
| Labial | 450,00 | 1 |
| Full Face | 500,00 | 1 |
| Diamond Bio | 450,00 | 1 |
| Elleva 210 Bio | 699,99 | 1 |
| Fios de PDO | 1.129,90 | 60 |
| Cânula | 250,00 | 10 |
| Botox | 600,00 | 1 |
| Soro Fisiológico Bastonete | 1,20 | 1 |
| Água de Injeção Bastonete | 1,20 | 1 |
| Luvas | 33,00 | 100 |
| Máscara | 11,00 | 100 |
| Oxigênio Portátil | 62,00 | 1000 |
| Fluido Biorelaxante | 130,00 | 1 |
| Oxigênio | 960,40 | 98000 |
| Álcool Suabe | 7,90 | 100 |
| Band Aid | 25,00 | 500 |
| Seringa 3ML | 29,00 | 100 |
| Seringa 10ML | 45,00 | 100 |
| Seringa 20ML | 39,50 | 50 |
| Seringa 60ML | 17,50 | 5 |
| Sonda | 60,00 | 50 |
| Tubo de Coleta | 65,00 | 50 |
| Escalpe | 36,00 | 30 |
| Papel Lençol | 69,00 | 210 |
| Torneirinha 3 vias | 45,50 | 35 |
| Gaze | 159,60 | 500 |
| Tubo Verde | 135,00 | 50 |
| Saco de Lixo | 35,00 | 100 |
| Cápsula de Café | 22,00 | 8 |
| Açúcar | 5,00 | 20 |
| Material Banheiro | 20,00 | 12 |
| Água Mineral | 16,00 | 20 |
| Sabonete Líquido Pele | 114,00 | 500 |
| Tônico Pele | 111,00 | 500 |
| Esfoliante | 138,00 | 200 |
| Loção Emoliente | 99,00 | 500 |
| Creme Emoliente | 139,00 | 200 |
| Epigem | 1.108,00 | 120 |
| Vitamina Pós Procedimento | 250,00 | 30 |
| Máquina Lavien (Locação Diária) | 1.100,00 | 5 |
| Locação Máquina Microfocado | 2.800,00 | 8 |

### Default Categorias Financeiras

**Receitas (8):**
- Procedimentos Faciais
- Procedimentos Corporais
- Harmonização Orofacial
- Consultas e Avaliações
- Venda de Produtos
- Tratamentos Capilares
- Depilação
- Outros Serviços

**Despesas (12):**
- Insumos e Materiais
- Equipamentos
- Aluguel/Condomínio
- Salários e Profissionais
- Marketing e Publicidade
- Impostos e Taxas
- Manutenção
- Cursos e Capacitação
- Contabilidade
- Limpeza e Higienização
- Sistemas e Software
- Outras Despesas

### Default Formas de Pagamento (10)

| Nome | Taxa (%) | Prazo (dias) |
|------|----------|--------------|
| Dinheiro | 0 | 0 |
| PIX | 0 | 0 |
| Débito | 1.50 | 1 |
| Crédito à Vista | 2.90 | 30 |
| Crédito 2x | 4.50 | 60 |
| Crédito 3x | 5.20 | 90 |
| Crédito 4-6x | 5.80 | 120 |
| Crédito 7-12x | 6.50 | 180 |
| Boleto | 1.90 | 3 |
| Link de Pagamento | 2.50 | 2 |

---

## 2. Proposed Changes

### Phase 1: Backend Mutations

#### [MODIFY] [financeiroRouter.ts](file:///home/mauricio/neondash/server/financeiroRouter.ts)
- **Action:** Add `seedDefaults` mutation for categorias + formasPagamento
- **Logic:** Check if mentorado has 0 items, then bulk insert defaults
- **Returns:** `{ categoriasCriadas: number, formasCriadas: number }`

#### [MODIFY] [precificacaoRouter.ts](file:///home/mauricio/neondash/server/precificacaoRouter.ts)
- **Action:** Add `seedDefaults` mutation for insumos
- **Logic:** Check if mentorado has 0 insumos, then bulk insert defaults
- **Returns:** `{ insumosCriados: number }`

---

### Phase 2: Frontend Integration

#### [MODIFY] [CategoriasTab.tsx](file:///home/mauricio/neondash/client/src/components/financeiro/CategoriasTab.tsx)
- **Action:** Add "Carregar Padrões" button to OnboardingCard
- **Trigger:** Calls `financeiro.seedDefaults` mutation

#### [MODIFY] [FormasPagamentoTab.tsx](file:///home/mauricio/neondash/client/src/components/financeiro/FormasPagamentoTab.tsx)
- **Action:** Add "Carregar Padrões" button to OnboardingCard

#### [MODIFY] [InsumosTab.tsx](file:///home/mauricio/neondash/client/src/components/financeiro/InsumosTab.tsx)
- **Action:** Add "Carregar Padrões" button calling `precificacao.seedDefaults`

---

## 3. Atomic Implementation Tasks

### AT-001: Add seedDefaults to financeiroRouter ⚡
**Goal:** Create mutation to seed default categorias and formasPagamento
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Define default categorias data array (20 items)
  - **File:** `server/financeiroRouter.ts`
  - **Validation:** Array has 8 receitas + 12 despesas
- [ ] ST-001.2: Define default formasPagamento data array (10 items)
  - **File:** `server/financeiroRouter.ts`
  - **Validation:** Array has all payment methods
- [ ] ST-001.3: Create `seedDefaults` mutation
  - **File:** `server/financeiroRouter.ts`
  - **Validation:** `bun run check` passes

**Rollback:** `git checkout server/financeiroRouter.ts`

---

### AT-002: Add seedDefaults to precificacaoRouter ⚡
**Goal:** Create mutation to seed default insumos
**Dependencies:** None

#### Subtasks:
- [ ] ST-002.1: Define default insumos data array (54 items)
  - **File:** `server/precificacaoRouter.ts`
  - **Validation:** Array contains all 54 aesthetic supplies from P&L
- [ ] ST-002.2: Create `seedDefaults` mutation
  - **File:** `server/precificacaoRouter.ts`
  - **Validation:** `bun run check` passes

**Rollback:** `git checkout server/precificacaoRouter.ts`

---

### AT-003: Update CategoriasTab with seed button
**Goal:** Add UI to trigger seed mutation
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-003.1: Add mutation hook for `seedDefaults`
  - **File:** `client/src/components/financeiro/CategoriasTab.tsx`
- [ ] ST-003.2: Add "Carregar Categorias Padrão" button to OnboardingCard
  - **Validation:** Button visible, triggers mutation

**Rollback:** `git checkout client/src/components/financeiro/CategoriasTab.tsx`

---

### AT-004: Update FormasPagamentoTab with seed button ⚡
**Goal:** Add UI to trigger seed mutation for payment methods
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-004.1: Add mutation hook and button
  - **File:** `client/src/components/financeiro/FormasPagamentoTab.tsx`
  - **Validation:** Button triggers mutation

**Rollback:** `git checkout client/src/components/financeiro/FormasPagamentoTab.tsx`

---

### AT-005: Update InsumosTab with seed button ⚡
**Goal:** Add UI to trigger seed mutation for supplies
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-005.1: Add mutation hook for `precificacao.seedDefaults`
  - **File:** `client/src/components/financeiro/InsumosTab.tsx`
- [ ] ST-005.2: Add "Carregar Insumos Padrão" button to OnboardingCard
  - **Validation:** Button visible, triggers mutation

**Rollback:** `git checkout client/src/components/financeiro/InsumosTab.tsx`

---

## 4. Verification Plan

### Automated Tests
```bash
bun run check     # TypeScript validation
bun run lint      # Biome formatting
```

### Manual Verification
1. Start dev server: `bun dev`
2. Navigate to Financeiro > Categorias
3. Click "Carregar Categorias Padrão" button
4. Verify 20 categories appear (8 receitas + 12 despesas)
5. Navigate to Formas de Pagamento
6. Click "Carregar Padrões" button
7. Verify 10 payment methods appear
8. Navigate to Insumos
9. Click "Carregar Insumos Padrão" button
10. Verify 25 supplies appear
11. Edit any item to confirm all are editable
12. Refresh page and verify data persists

---

## 5. Rollback Plan

```bash
git checkout server/financeiroRouter.ts
git checkout server/precificacaoRouter.ts
git checkout client/src/components/financeiro/CategoriasTab.tsx
git checkout client/src/components/financeiro/FormasPagamentoTab.tsx
git checkout client/src/components/financeiro/InsumosTab.tsx
```
