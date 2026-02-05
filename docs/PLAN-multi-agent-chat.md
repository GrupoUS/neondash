# PLAN-multi-agent-chat: Sistema Multi-Agente IA

> **Goal:** Configurar 3 agentes especializados (SDR, Marketing, Financeiro) na página de configurações e rotear automaticamente as conversas do chat widget para o agente apropriado baseado na intenção do usuário.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Settings page tem SDR (`AIAgentSettingsCard`) e Financial Coach cards | 5/5 | `Settings.tsx` lines 46-70 | Reuse pattern |
| 2 | Financial Coach usa `systemSettings` (global key-value) | 5/5 | `FinancialCoachSettingsCard.tsx` | Extend pattern |
| 3 | SDR config usa `aiAgentConfig` table (per-mentorado) | 5/5 | `aiAgentRouter.ts`, `schema.ts:893` | Different pattern |
| 4 | Chat widget já tem `isFinancialQuery()` com keyword detection | 5/5 | `aiAssistantService.ts:27-51, 646-676` | Extend pattern |
| 5 | Intent injection modifica `effectiveSystemPrompt` antes de `generateText()` | 5/5 | `aiAssistantService.ts:646-680` | Same approach |

### Knowledge Gaps & Assumptions
- **Gap:** Sem dados específicos de marketing/instagram no chat (apenas tools existentes)
- **Assumption:** Agent prompts são admin-level (global), não per-mentorado
- **Assumption:** Keywords são suficientes para intent detection (vs NLP/LLM-based)

---

## 1. User Review Required

> [!IMPORTANT]
> **Decisão Arquitetural**: Usar `systemSettings` (global) para todos os agent prompts vs criar tabela específica.
> - ✅ Recomendo `systemSettings` por simplicidade (Financial já usa este padrão)
> - Se precisar per-mentorado: migrações necessárias

> [!NOTE]
> **Keywords podem não capturar 100%**: Intent detection por keywords é simples mas pode ter falsos negativos/positivos.
> - Alternativa futura: LLM-based intent classification (mais complexo, mais custo)

---

## 2. Proposed Changes

### Backend - Intent Detection

#### [MODIFY] [aiAssistantService.ts](file:///home/mauricio/neondash/server/services/aiAssistantService.ts)
- **Add** `MARKETING_KEYWORDS` array (instagram, post, story, reels, conteúdo, engajamento, etc.)
- **Add** `SDR_KEYWORDS` array (lead, venda, cliente, atendimento, prospecção, CRM, pipeline, etc.)
- **Add** `isMarketingQuery()` and `isSdrQuery()` functions
- **Modify** `chat()` function to implement priority-based agent routing

---

### Backend - Admin Settings

#### [MODIFY] [adminRouter.ts](file:///home/mauricio/neondash/server/adminRouter.ts)
- Verify `getSetting` and `updateSetting` procedures support the new keys (já existem)

---

### Frontend - Settings Page

#### [NEW] [MarketingAgentSettingsCard.tsx](file:///home/mauricio/neondash/client/src/components/marketing/MarketingAgentSettingsCard.tsx)
- Create card similar to `FinancialCoachSettingsCard`
- Use `trpc.admin.getSetting/updateSetting` with key `marketing_agent_prompt`
- Purple/violet theme to differentiate from other agents

#### [MODIFY] [Settings.tsx](file:///home/mauricio/neondash/client/src/pages/Settings.tsx)
- Add Marketing Agent section with `<MarketingAgentSettingsCard />`
- Improve section headers/descriptions for clarity

#### [MODIFY] [AIAgentSettingsCard.tsx](file:///home/mauricio/neondash/client/src/components/whatsapp/AIAgentSettingsCard.tsx)
- Improve labeling to clarify this is for SDR/vendas
- Optional: Add link to docs about SDR automation

#### [MODIFY] [FinancialCoachSettingsCard.tsx](file:///home/mauricio/neondash/client/src/components/financeiro/FinancialCoachSettingsCard.tsx)
- Optional: Add preview section or template suggestions

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task has subtasks with validation.

### AT-001: Add Intent Detection Keywords ⚡
**Goal:** Define keyword arrays for Marketing and SDR agent intent detection
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Add `MARKETING_KEYWORDS` array after `FINANCIAL_KEYWORDS`
  - **File:** `server/services/aiAssistantService.ts`
  - **Validation:** Array includes ~15 marketing terms (instagram, post, story, reels, conteúdo, engajamento, alcance, seguidor, campanha, tráfego, anúncio, branding, marca, audiência, hashtag)
- [ ] ST-001.2: Add `SDR_KEYWORDS` array after `MARKETING_KEYWORDS`
  - **File:** `server/services/aiAssistantService.ts`
  - **Validation:** Array includes ~15 sales terms (lead, venda, cliente, atendimento, comercial, prospecção, follow-up, crm, pipeline, conversão, fechamento, qualificação, contato, agendamento, proposta)
- [ ] ST-001.3: Add `isMarketingQuery()` and `isSdrQuery()` functions
  - **File:** `server/services/aiAssistantService.ts`
  - **Validation:** Functions follow same pattern as `isFinancialQuery()`

**Rollback:** `git checkout server/services/aiAssistantService.ts`

---

### AT-002: Implement Agent Routing in Chat Function ⚡
**Goal:** Route chat messages to appropriate agent based on detected intent
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Fetch agent prompts from `systemSettings` inside `chat()` function
  - **File:** `server/services/aiAssistantService.ts`
  - **Validation:** Imports `systemSettings` from schema, uses db.select with key filter
- [ ] ST-002.2: Implement priority-based intent detection (Financial > Marketing > SDR)
  - **File:** `server/services/aiAssistantService.ts`
  - **Validation:** Order of checks: financial → marketing → sdr → default
- [ ] ST-002.3: Create specialized prompt injections for each agent type
  - **File:** `server/services/aiAssistantService.ts`
  - **Validation:** Each agent type has distinct instruction block with mode header
- [ ] ST-002.4: Add logging for agent activation (debug mode)
  - **File:** `server/services/aiAssistantService.ts`
  - **Validation:** Console.log shows which agent was activated

**Rollback:** `git checkout server/services/aiAssistantService.ts`

---

### AT-003: Create Marketing Agent Settings Card ⚡
**Goal:** Add UI for configuring Marketing agent prompt
**Dependencies:** None (parallel-safe)

#### Subtasks:
- [ ] ST-003.1: Create component file with form similar to FinancialCoachSettingsCard
  - **File:** `client/src/components/marketing/MarketingAgentSettingsCard.tsx`
  - **Validation:** Uses `trpc.admin.getSetting/updateSetting`, key `marketing_agent_prompt`
- [ ] ST-003.2: Apply purple/violet theme styling
  - **File:** `client/src/components/marketing/MarketingAgentSettingsCard.tsx`
  - **Validation:** Uses `border-violet-500/20`, `bg-violet-500/10`, etc.
- [ ] ST-003.3: Add default prompt for marketing agent
  - **File:** `client/src/components/marketing/MarketingAgentSettingsCard.tsx`
  - **Validation:** Default text includes Instagram, conteúdo, engajamento focus

**Rollback:** `rm client/src/components/marketing/MarketingAgentSettingsCard.tsx`

---

### AT-004: Update Settings Page Layout
**Goal:** Add Marketing section and improve existing sections
**Dependencies:** AT-003

#### Subtasks:
- [ ] ST-004.1: Import `MarketingAgentSettingsCard` component
  - **File:** `client/src/pages/Settings.tsx`
  - **Validation:** Import statement present
- [ ] ST-004.2: Add Marketing Agent section between SDR and Financial sections
  - **File:** `client/src/pages/Settings.tsx`
  - **Validation:** Section renders with Megaphone icon, description about marketing/content
- [ ] ST-004.3: Improve section descriptions for clarity
  - **File:** `client/src/pages/Settings.tsx`
  - **Validation:** Each section clearly states what the agent does

**Rollback:** `git checkout client/src/pages/Settings.tsx`

---

### AT-005: Enhance Existing Agent Cards (Optional)
**Goal:** Improve SDR and Financial cards with better UX
**Dependencies:** None (parallel-safe)

#### Subtasks:
- [ ] ST-005.1: Update AIAgentSettingsCard title/description to emphasize SDR focus
  - **File:** `client/src/components/whatsapp/AIAgentSettingsCard.tsx`
  - **Validation:** Title says "Agente IA (SDR)", description mentions lead qualification
- [ ] ST-005.2: Add optional improvements to FinancialCoachSettingsCard
  - **File:** `client/src/components/financeiro/FinancialCoachSettingsCard.tsx`
  - **Validation:** Optional: Add character counter or prompt templates

**Rollback:** `git checkout client/src/components/whatsapp/AIAgentSettingsCard.tsx client/src/components/financeiro/FinancialCoachSettingsCard.tsx`

---

## 4. Verification Plan

### Automated Tests
```bash
bun run check      # TypeScript validation
bun run lint       # Code formatting
bun test           # Unit tests (if applicable)
```

### Manual Verification
1. **Settings Page:**
   - Navigate to `/configuracoes`
   - Verify 3 agent cards render: SDR, Marketing, Financeiro
   - Edit and save each agent's prompt
   - Refresh page and verify prompts persist

2. **Chat Widget Intent Detection:**
   - Open chat widget
   - Test Financial: "Como está meu faturamento este mês?"
   - Test Marketing: "Como melhorar meu engajamento no Instagram?"
   - Test SDR: "Como qualificar melhor meus leads?"
   - Verify each triggers the appropriate agent mode

3. **Priority Test:**
   - Test query with mixed terms: "Quanto gastei com marketing?"
   - Verify Financial agent takes priority (mentions "gastei")

---

## 5. Rollback Plan

```bash
# Revert all changes
git checkout server/services/aiAssistantService.ts
git checkout client/src/pages/Settings.tsx
git checkout client/src/components/whatsapp/AIAgentSettingsCard.tsx
git checkout client/src/components/financeiro/FinancialCoachSettingsCard.tsx
rm -rf client/src/components/marketing/

# Verify clean state
bun run check
```

---

## 6. Keywords Reference

### Financial (existing)
```
financeiro, finanças, dinheiro, lucro, faturamento, gasto, despesa, conta, 
caixa, margem, investimento, preço, custo, receita, venda, pagamento, 
dívida, economiz, balanço
```

### Marketing (new)
```
instagram, post, story, stories, reels, conteúdo, engajamento, alcance, 
seguidor, audiência, campanha, tráfego, anúncio, branding, marca, hashtag,
feed, bio, carrossel, viral, social
```

### SDR (new)
```
lead, qualificação, venda, cliente, atendimento, comercial, prospecção, 
follow-up, crm, pipeline, conversão, fechamento, contato, agendamento, 
proposta, prospect, negociação, objeção, kanban
```
