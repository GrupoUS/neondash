# PLAN-mentorados-evolucao-dezembro: Importar Dados de Dezembro 2025 e Melhorar Página de Evolução

> **Goal:** Importar os dados de dezembro 2025 do arquivo `seed-dezembro.mjs` para o banco Neon e melhorar a página de evolução para exibir comparação mês-a-mês.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Arquivo `seed-dezembro.mjs` contém dados de 14 mentorados (5 Estrutura + 9 Escala) | 5/5 | Codebase | Alto - dados já existem |
| 2 | Script usa MySQL driver incorretamente (`drizzle-orm/mysql2`) | 5/5 | Codebase | Alto - precisa correção |
| 3 | Banco atual tem 8 mentorados, nomes não correspondem ao seed | 5/5 | Neon DB | Alto - precisa mapeamento |
| 4 | Apenas Mauricio Magalhães tem métricas (jan/fev 2026) | 5/5 | Neon DB | Médio - banco quase vazio |
| 5 | Página `EvolucaoView.tsx` já funciona com gráfico e tabela | 5/5 | Codebase | Baixo - já implementado |
| 6 | `SubmitMetricsForm.tsx` permite lançar métricas por mês/ano | 5/5 | Codebase | Baixo - já implementado |
| 7 | Turma enum só tem valor "neon" (não tem "neon_estrutura"/"neon_escala") | 5/5 | Schema | Médio - dados precisam adaptar |

### Knowledge Gaps & Assumptions

- **Gap:** Não está claro se os 8 mentorados atuais correspondem aos 14 do seed ou se são diferentes
- **Assumption:** Os mentorados do seed precisam ser criados como novos registros
- **Assumption:** O usuário quer que os mentorados possam preencher janeiro 2026 e ver comparação com dezembro 2025

---

## 1. User Review Required

> [!IMPORTANT]
> **Divergência de Mentorados**
> 
> O banco atual tem 8 mentorados:
> - Ana Mara Santos, Bruno Paixão, Elica Pereira, Enfa Tamara Dilma
> - Gabriela Santiago, Gabriela Alvares, Iza Rafaela, Mauricio Magalhães
>
> O arquivo `seed-dezembro.mjs` tem 14 mentorados com **nomes diferentes**:
> - **Estrutura:** Ana Scaravate, Tamara Martins, Élica Pires, Ana Cláudia, Iza Nunes
> - **Escala:** Lana Máximo, Thaís Olímpia, Kleber Oliveira, Jéssica Borges, Carmen Lúcia, Alina Souza, Dra. Milena, Dra. Bruna, Dra. Jéssica
>
> **Opções:**
> 1. **Mapear nomes similares** (ex: "Elica Pereira" → "Élica Pires")
> 2. **Criar novos mentorados** para os 14 do seed
> 3. **Inserir dados apenas para os mentorados existentes** que tenham correspondência

> [!WARNING]
> O script `seed-dezembro.mjs` usa **MySQL driver** mas o projeto usa **PostgreSQL/Neon**. Precisa ser reescrito completamente.

---

## 2. Proposed Changes

### Fase 1: Corrigir Script de Seed

#### [MODIFY] [seed-dezembro.mjs](file:///home/mauricio/neondash/server/seed-dezembro.mjs)
- **Action:** Reescrever script para usar PostgreSQL/Neon
- **Details:** 
  - Trocar `drizzle-orm/mysql2` para `@neondatabase/serverless`
  - Usar `upsertMetricaMensal` existente
  - Mapear mentorados por email ou criar SQL de inserção direto

---

#### [NEW] [seed-dezembro-neon.ts](file:///home/mauricio/neondash/server/seed-dezembro-neon.ts)
- **Action:** Criar novo script de seed compatível com Neon
- **Details:**
  - TypeScript com tipagem correta
  - Usar pool de conexão Neon
  - Inserir métricas de dezembro 2025 para mentorados existentes ou criar novos

---

### Fase 2: Melhorar Página de Evolução

#### [MODIFY] [EvolucaoView.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/EvolucaoView.tsx)
- **Action:** Adicionar comparação mês-a-mês destacada
- **Details:**
  - Card com variação percentual vs mês anterior
  - Destaque visual (verde/vermelho) para crescimento/queda
  - Pré-selecionar janeiro 2026 no formulário de métricas

---

#### [MODIFY] [EvolutionChart.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/EvolutionChart.tsx)
- **Action:** Melhorar visualização com indicadores de variação
- **Details:**
  - Adicionar labels de variação percentual nos pontos
  - Destacar mês atual vs anterior

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Cada tarefa tem subtasks. Não executar tarefas de fase 2 antes de concluir fase 1.

### AT-001: Criar Script de Seed para Neon ⚡
**Goal:** Criar script TypeScript que insere dados de dezembro 2025 no banco Neon
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Criar arquivo `server/seed-dezembro-neon.ts`
  - **File:** `server/seed-dezembro-neon.ts`
  - **Validation:** `bun run check` passa sem erros
- [ ] ST-001.2: Implementar conexão com Neon usando `@neondatabase/serverless`
  - **File:** `server/seed-dezembro-neon.ts`
  - **Validation:** Script conecta ao banco
- [ ] ST-001.3: Mapear dados do seed para mentorados existentes ou criar novos
  - **File:** `server/seed-dezembro-neon.ts`
  - **Validation:** Query confirma mentorados no banco
- [ ] ST-001.4: Inserir métricas de dezembro 2025
  - **File:** `server/seed-dezembro-neon.ts`
  - **Validation:** `SELECT * FROM metricas_mensais WHERE ano = 2025 AND mes = 12` retorna dados

**Rollback:** `DELETE FROM metricas_mensais WHERE ano = 2025 AND mes = 12;`

---

### AT-002: Executar Seed e Validar Dados
**Goal:** Rodar o script e confirmar que os dados foram inseridos corretamente
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Executar script de seed
  - **File:** Terminal
  - **Validation:** Output mostra "Migração concluída"
- [ ] ST-002.2: Validar dados no banco via SQL
  - **File:** Neon Console
  - **Validation:** Query retorna 14+ registros para dezembro 2025
- [ ] ST-002.3: Validar na UI que dados aparecem
  - **File:** Browser
  - **Validation:** Página de Evolução mostra dados de dezembro

**Rollback:** `DELETE FROM metricas_mensais WHERE ano = 2025 AND mes = 12;`

---

### AT-003: Melhorar EvolucaoView com Comparação Mês-a-Mês ⚡
**Goal:** Adicionar visualização de variação entre meses na página de evolução
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Criar componente `MonthComparison` para exibir variação
  - **File:** `client/src/components/dashboard/MonthComparison.tsx`
  - **Validation:** Componente renderiza sem erros
- [ ] ST-003.2: Calcular variação percentual entre meses consecutivos
  - **File:** `client/src/components/dashboard/EvolucaoView.tsx`
  - **Validation:** Cálculo correto de variação
- [ ] ST-003.3: Adicionar indicadores visuais (verde/vermelho)
  - **File:** `client/src/components/dashboard/EvolucaoView.tsx`
  - **Validation:** UI mostra cores corretas

**Rollback:** Git revert do arquivo

---

### AT-004: Pré-selecionar Janeiro 2026 no Formulário
**Goal:** Facilitar preenchimento de janeiro 2026 pelos mentorados
**Dependencies:** None ⚡

#### Subtasks:
- [ ] ST-004.1: Detectar se mentorado já tem dados de dezembro 2025
  - **File:** `client/src/components/dashboard/SubmitMetricsForm.tsx`
  - **Validation:** Hook retorna booleano correto
- [ ] ST-004.2: Se sim, pré-selecionar janeiro 2026 automaticamente
  - **File:** `client/src/components/dashboard/SubmitMetricsForm.tsx`
  - **Validation:** Formulário abre com janeiro 2026 selecionado
- [ ] ST-004.3: Adicionar mensagem informativa sobre comparação
  - **File:** `client/src/components/dashboard/SubmitMetricsForm.tsx`
  - **Validation:** Mensagem aparece quando há dados anteriores

**Rollback:** Git revert do arquivo

---

## 4. Verification Plan

### Automated Tests
- `bun run check` - TypeScript validation
- `bun run lint` - Code formatting
- `bun test` - Unit tests

### Manual Verification
1. Executar seed script e verificar logs
2. Consultar banco Neon para confirmar inserção
3. Acessar `/meu-dashboard` → Evolução
4. Verificar se gráfico mostra dezembro 2025
5. Verificar se tabela mostra dezembro 2025
6. Preencher dados de janeiro 2026
7. Verificar comparação mês-a-mês

---

## 5. Rollback Plan

```bash
# Se precisar reverter dados do banco:
DELETE FROM metricas_mensais WHERE ano = 2025 AND mes = 12;
DELETE FROM feedbacks WHERE ano = 2025 AND mes = 12;

# Se precisar reverter código:
git checkout HEAD -- client/src/components/dashboard/EvolucaoView.tsx
git checkout HEAD -- client/src/components/dashboard/SubmitMetricsForm.tsx
```
