# PLAN-ai-agent-prompts: Aprimoramento dos Master Prompts de IA

> **Goal:** Aplicar o blueprint de 6 componentes de prompt engineering (documentado em `docs/financeiro/`) aos 4 agentes de IA do NeonDash.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Documentação completa já existe com prompts aprimorados para 3 agentes | 5/5 | `docs/financeiro/Guia_de_Prompts_NeonDash.md` | Alto |
| 2 | Blueprint de 6 componentes: role, context, task, rules, output, examples | 5/5 | `docs/financeiro/Research Findings` | Alto |
| 3 | Prompts prontos para copiar estão em `Prompts Prontos para Uso` | 5/5 | `docs/financeiro/` | Alto |
| 4 | 4 agentes identificados, não 3 (WhatsApp AI separado do SDR Chat) | 5/5 | Análise de código | Médio |
| 5 | Todos os agentes usam `DEFAULT_PROMPT` simples sem estrutura | 5/5 | Componentes React | Alto |
| 6 | `AIAgentSettingsCard.tsx` já tem estrutura mais avançada (config separado) | 4/5 | Análise de código | Médio |
| 7 | Backward compatible: prompts salvos no DB têm precedência sobre defaults | 5/5 | Análise de código | Baixo (seguro) |

### Knowledge Gaps
- **Gap 1:** Não há testes unitários específicos para os componentes de settings

### Assumptions to Validate
- **Assumção 1:** Os prompts aprimorados da documentação são a versão final aprovada
- **Assumção 2:** O WhatsApp AI Agent (SDR real) deve usar o mesmo prompt do SDR Chat documentado

### Edge Cases (5+)
1. **Prompt muito longo:** Textarea pode não acomodar prompts de 2000+ caracteres
2. **Caracteres especiais:** Emojis nos prompts podem causar problemas de encoding
3. **Migração de dados:** Usuários com prompts customizados salvos não serão afetados (positivo)
4. **Reset to defaults:** Botão de reset deve usar novo prompt aprimorado
5. **Cópia/cola:** Usuários podem copiar/colar prompts com formatação quebrada

---

## 1. User Review Required

> [!IMPORTANT]
> **Confirmação necessária:** Os prompts documentados em `docs/financeiro/Prompts Prontos para Uso - NeonDash.md` são a versão final a ser implementada?

> [!NOTE]
> **Observação:** O WhatsApp AI Agent (`AIAgentSettingsCard.tsx`) tem uma estrutura diferente dos outros 3 agentes. Ele usa `trpc.aiAgent.upsertConfig` em vez de `trpc.admin.updateSetting`. O prompt recomendado para o SDR será aplicado neste componente também.

---

## 2. Proposed Changes

### Componente 1: Neon Coach Financeiro

#### [MODIFY] [FinancialCoachSettingsCard.tsx](file:///home/mauricio/neondash/client/src/components/financeiro/FinancialCoachSettingsCard.tsx)
- **Action:** Substituir DEFAULT_PROMPT inline pelo prompt aprimorado da documentação
- **Details:** 
  - Linha 37-39: Substituir string simples pelo prompt estruturado
  - Prompt contém: persona, contexto, tarefa, regras, formato de saída

---

### Componente 2: Marketing Agent

#### [MODIFY] [MarketingAgentSettingsCard.tsx](file:///home/mauricio/neondash/client/src/components/settings/MarketingAgentSettingsCard.tsx)
- **Action:** Substituir DEFAULT_PROMPT pelo prompt aprimorado
- **Details:**
  - Linha 13: Substituir constante DEFAULT_PROMPT
  - Novo prompt inclui: plano de conteúdo semanal, diagnóstico, exemplos

---

### Componente 3: SDR Agent (Chat Widget)

#### [MODIFY] [SdrAgentSettingsCard.tsx](file:///home/mauricio/neondash/client/src/components/settings/SdrAgentSettingsCard.tsx)
- **Action:** Substituir DEFAULT_PROMPT pelo prompt aprimorado
- **Details:**
  - Linha 13: Substituir constante DEFAULT_PROMPT
  - Novo prompt diferencia SDR de Closer, foca em qualificação

---

### Componente 4: WhatsApp AI Agent

#### [MODIFY] [AIAgentSettingsCard.tsx](file:///home/mauricio/neondash/client/src/components/whatsapp/AIAgentSettingsCard.tsx)
- **Action:** Substituir DEFAULT_SYSTEM_PROMPT pelo prompt SDR aprimorado
- **Details:**
  - Linhas 39-49: Substituir constante DEFAULT_SYSTEM_PROMPT
  - Manter DEFAULT_GREETING atual (já está adequado)

---

### Componente 5: UX Improvements (Opcional)

#### [MODIFY] Todos os 3 componentes não-WhatsApp
- **Action:** Aumentar `min-h-[200px]` para `min-h-[300px]` no Textarea
- **Details:** Permite visualização melhor de prompts longos

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Cada task tem subtasks com validação específica.

### AT-001: Update Neon Coach Financeiro Prompt ⚡
**Goal:** Aplicar prompt aprimorado ao Financial Coach
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Substituir DEFAULT_PROMPT em `FinancialCoachSettingsCard.tsx`
  - **File:** `client/src/components/financeiro/FinancialCoachSettingsCard.tsx`
  - **Validation:** `bun run check` passa sem erros
- [ ] ST-001.2: Aumentar min-height do Textarea para 300px
  - **File:** `client/src/components/financeiro/FinancialCoachSettingsCard.tsx`
  - **Validation:** Inspecionar visualmente no browser

**Rollback:** `git checkout client/src/components/financeiro/FinancialCoachSettingsCard.tsx`

---

### AT-002: Update Marketing Agent Prompt ⚡
**Goal:** Aplicar prompt aprimorado ao Marketing Agent
**Dependencies:** None

#### Subtasks:
- [ ] ST-002.1: Substituir DEFAULT_PROMPT em `MarketingAgentSettingsCard.tsx`
  - **File:** `client/src/components/settings/MarketingAgentSettingsCard.tsx`
  - **Validation:** `bun run check` passa sem erros
- [ ] ST-002.2: Aumentar min-height do Textarea para 300px
  - **File:** `client/src/components/settings/MarketingAgentSettingsCard.tsx`
  - **Validation:** Inspecionar visualmente no browser

**Rollback:** `git checkout client/src/components/settings/MarketingAgentSettingsCard.tsx`

---

### AT-003: Update SDR Agent Prompt ⚡
**Goal:** Aplicar prompt aprimorado ao SDR Agent
**Dependencies:** None

#### Subtasks:
- [ ] ST-003.1: Substituir DEFAULT_PROMPT em `SdrAgentSettingsCard.tsx`
  - **File:** `client/src/components/settings/SdrAgentSettingsCard.tsx`
  - **Validation:** `bun run check` passa sem erros
- [ ] ST-003.2: Aumentar min-height do Textarea para 300px
  - **File:** `client/src/components/settings/SdrAgentSettingsCard.tsx`
  - **Validation:** Inspecionar visualmente no browser

**Rollback:** `git checkout client/src/components/settings/SdrAgentSettingsCard.tsx`

---

### AT-004: Update WhatsApp AI Agent Prompt ⚡
**Goal:** Aplicar prompt SDR aprimorado ao WhatsApp AI
**Dependencies:** None

#### Subtasks:
- [ ] ST-004.1: Substituir DEFAULT_SYSTEM_PROMPT em `AIAgentSettingsCard.tsx`
  - **File:** `client/src/components/whatsapp/AIAgentSettingsCard.tsx`
  - **Validation:** `bun run check` passa sem erros
- [ ] ST-004.2: Aumentar min-height do Textarea para 300px (já tem 200px)
  - **File:** `client/src/components/whatsapp/AIAgentSettingsCard.tsx`
  - **Validation:** Inspecionar visualmente no browser

**Rollback:** `git checkout client/src/components/whatsapp/AIAgentSettingsCard.tsx`

---

### AT-005: Final Validation
**Goal:** Garantir que todas as mudanças funcionam corretamente
**Dependencies:** AT-001, AT-002, AT-003, AT-004

#### Subtasks:
- [ ] ST-005.1: Executar verificação de tipos
  - **Command:** `bun run check`
  - **Validation:** Exit code 0, sem erros
- [ ] ST-005.2: Executar linting
  - **Command:** `bun run lint`
  - **Validation:** Exit code 0, sem erros
- [ ] ST-005.3: Teste manual na página de Settings
  - **Steps:**
    1. Acessar `/configuracoes`
    2. Verificar que todos os 4 cards de IA aparecem
    3. Verificar que os textareas mostram os novos prompts padrão
    4. Verificar que é possível editar e salvar
  - **Validation:** Funcionamento visual correto

**Rollback:** `git stash` ou `git checkout .`

---

## 4. Verification Plan

### Automated Tests
```bash
# TypeScript type check
bun run check

# Code formatting and linting
bun run lint

# Unit tests (se existirem)
bun test
```

### Manual Verification
1. **Iniciar servidor dev:** `bun dev`
2. **Acessar Settings:** `http://localhost:3000/configuracoes`
3. **Verificar cada card de IA:**
   - [ ] Neon Coach Financeiro: Prompt começa com "Você é o Neon Coach Financeiro..."
   - [ ] Marketing Agent: Prompt menciona "Diagnóstico de Marketing"
   - [ ] SDR Agent (Chat): Prompt menciona "qualificar, não vender"
   - [ ] WhatsApp AI Agent: Prompt menciona "SDR" e "WhatsApp"
4. **Testar edição:** Modificar um prompt, salvar, e verificar toast de sucesso
5. **Testar persistência:** Recarregar página e verificar que o prompt editado permanece

---

## 5. Rollback Plan

```bash
# Opção 1: Reverter arquivo específico
git checkout <arquivo>

# Opção 2: Reverter todos os arquivos modificados
git checkout -- client/src/components/

# Opção 3: Stash e restore
git stash
git stash pop  # para restaurar
```

---

## 6. Summary

### Changes Overview
| File | Change | Lines Modified |
|------|--------|----------------|
| `FinancialCoachSettingsCard.tsx` | DEFAULT_PROMPT + min-height | ~20 |
| `MarketingAgentSettingsCard.tsx` | DEFAULT_PROMPT + min-height | ~30 |
| `SdrAgentSettingsCard.tsx` | DEFAULT_PROMPT + min-height | ~35 |
| `AIAgentSettingsCard.tsx` | DEFAULT_SYSTEM_PROMPT + min-height | ~30 |

### Complexity Assessment
- **Level:** L3 (Feature, multi-file)
- **Risk:** LOW (apenas constantes de string, backward compatible)
- **Estimated time:** 30 minutos de implementação

### Pre-Submission Checklist
- [x] Codebase patterns searched and documented
- [x] Research Findings table with 7 entries
- [x] Knowledge Gaps listed
- [x] Edge cases documented (5)
- [x] All tasks have AT-XXX IDs with subtasks
- [x] Rollback steps defined
- [x] Parallel-safe tasks marked with ⚡
