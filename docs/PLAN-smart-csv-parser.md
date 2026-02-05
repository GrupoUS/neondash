# PLAN-smart-csv-parser: Parser Inteligente de CSV Multi-Banco

> **Goal:** Substituir parser manual por PapaParse e criar sistema de detecção inteligente de colunas para importar CSVs de qualquer banco brasileiro.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Bug: regex `/"([^"]*)"/g` falha com campos vazios (`,,,,` sem aspas) | 5/5 | Análise do CSV | **Crítico** - Causa raiz do problema |
| 2 | PapaParse é RFC 4180 compliant, handles empty fields corretamente | 5/5 | Context7 docs | Solução definitiva |
| 3 | CSV BTG tem 7 colunas: Data, Descricao, Credenciadora, Produto, CNPJ, Valor, Saldo | 5/5 | Arquivo do usuário | Mapear colunas por nome |
| 4 | Formato BR: datas DD/MM/YYYY, valores "1.234,56" | 5/5 | Análise do CSV | Normalização necessária |
| 5 | Bancos usam headers variados (Data/DATE/DT_LANCAMENTO, Valor/AMOUNT) | 4/5 | Tavily research | Column detection flexível |

### Knowledge Gaps & Assumptions

- **Gap:** Não temos amostras de CSV de outros bancos (Itaú, Bradesco, Nubank)
- **Assumption:** Headers sempre estão na primeira linha
- **Assumption:** Delimitador é sempre `,` ou `;`

### Edge Cases
1. Arquivo sem header
2. Header com encoding diferente (UTF-8 BOM, Latin-1)
3. Valores com sinais em colunas separadas (débito/crédito)
4. Datas em formatos diferentes (YYYY-MM-DD, MM/DD/YYYY)
5. Campos com quebras de linha dentro de aspas

---

## 1. User Review Required

> [!IMPORTANT]
> **Nova dependência:** `papaparse` será adicionada ao projeto.

---

## 2. Proposed Changes

### Phase 1: Infraestrutura de Parsing

#### [NEW] [csvParser.ts](file:///home/mauricio/neondash/client/src/lib/csvParser.ts)
- **Action:** Criar módulo de parsing CSV com PapaParse
- **Details:** 
  - `detectColumnMapping()` - detecta colunas por aliases
  - `parseValue()` - normaliza valores BR/EN
  - `parseDate()` - converte datas para YYYY-MM-DD
  - `parseTransactions()` - orquestra o parsing

---

### Phase 2: Integração

#### [MODIFY] [FileImportDialog.tsx](file:///home/mauricio/neondash/client/src/components/financeiro/FileImportDialog.tsx)
- **Action:** Substituir `parseCsv` manual por `parseTransactions` do novo módulo
- **Details:** Remover lógica de regex, usar import do `csvParser.ts`

---

## 3. Atomic Implementation Tasks

### AT-001: Instalar PapaParse
**Goal:** Adicionar dependência robusta de parsing CSV
**Dependencies:** None ⚡ PARALLEL-SAFE

#### Subtasks:
- [ ] ST-001.1: Executar `bun add papaparse`
  - **File:** `package.json`
  - **Validation:** `bun install` sem erros
- [ ] ST-001.2: Adicionar tipos `@types/papaparse`
  - **File:** `package.json`
  - **Validation:** `bun add -d @types/papaparse` sem erros

**Rollback:** `bun remove papaparse @types/papaparse`

---

### AT-002: Criar Módulo csvParser
**Goal:** Implementar parser inteligente com detecção de colunas
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Criar arquivo `csvParser.ts` com estrutura base
  - **File:** `client/src/lib/csvParser.ts`
  - **Validation:** Arquivo existe e exporta funções
- [ ] ST-002.2: Implementar `detectColumnMapping()`
  - **File:** `client/src/lib/csvParser.ts`
  - **Validation:** Unit test com headers variados
- [ ] ST-002.3: Implementar `parseValue()` para formato BR/EN
  - **File:** `client/src/lib/csvParser.ts`
  - **Validation:** "1.234,56" → 1234.56
- [ ] ST-002.4: Implementar `parseDate()` para múltiplos formatos
  - **File:** `client/src/lib/csvParser.ts`
  - **Validation:** DD/MM/YYYY → YYYY-MM-DD
- [ ] ST-002.5: Implementar `parseTransactions()` principal
  - **File:** `client/src/lib/csvParser.ts`
  - **Validation:** Parse arquivo de teste com 1000+ resultados

**Rollback:** `rm client/src/lib/csvParser.ts`

---

### AT-003: Integrar no FileImportDialog
**Goal:** Substituir parser manual pelo novo módulo
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Importar `parseTransactions` do csvParser
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** Import sem erro de tipo
- [ ] ST-003.2: Remover função `parseCsv` local
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** Função removida, sem referências
- [ ] ST-003.3: Chamar `parseTransactions` no `onDrop`
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** Transações aparecem no preview

**Rollback:** `git checkout client/src/components/financeiro/FileImportDialog.tsx`

---

## 4. Verification Plan

### Automated Tests
```bash
# TypeScript validation
bun run check

# Code formatting
bun run lint
```

### Manual Verification
1. Iniciar dev server: `bun dev`
2. Navegar para **Financeiro → Transações**
3. Clicar **Importar CSV**
4. Arrastar arquivo `docs/50_005120475_05-02-2026 (1).csv`
5. **Verificar:** Preview deve mostrar ~1300 transações (não apenas 4)
6. Confirmar importação
7. **Verificar:** Transações aparecem na lista

---

## 5. Rollback Plan

```bash
# Reverter alterações
git checkout client/src/components/financeiro/FileImportDialog.tsx
rm client/src/lib/csvParser.ts

# Remover dependências
bun remove papaparse @types/papaparse
```
