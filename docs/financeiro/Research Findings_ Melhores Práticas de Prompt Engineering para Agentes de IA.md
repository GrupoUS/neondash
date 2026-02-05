# Research Findings: Melhores Práticas de Prompt Engineering para Agentes de IA

## Fontes Consultadas

| # | Fonte | Confiança | Impacto |
|---|-------|-----------|---------|
| 1 | Anthropic - Effective Context Engineering for AI Agents | 5/5 | Alto |
| 2 | ilert - Engineering Reliable AI Agents (6-Component Blueprint) | 5/5 | Alto |
| 3 | HeyReach - AI Sales Prompts for SDRs | 4/5 | Médio |
| 4 | Promptingguide.ai - Técnicas de Prompting | 4/5 | Médio |

---

## Princípios Fundamentais Identificados

### 1. Estrutura de 6 Componentes (Blueprint ilert)

1. **Role/Tone**: Define persona e estilo de comunicação
2. **Task Definition**: Objetivos claros e orientados a ação
3. **Rules & Guardrails**: Limites e verificações de qualidade
4. **Data/Context**: Conhecimento relevante injetado
5. **Output Structure**: Formato esperado da resposta
6. **Key Reminder**: Reforço das instruções críticas

### 2. Context Engineering (Anthropic)

- **Altitude correta**: Específico o suficiente para guiar, flexível o suficiente para raciocinar
- **Seções organizadas**: Usar XML tags ou Markdown headers
- **Minimal set**: Menor conjunto de tokens de alto sinal
- **Exemplos canônicos**: Few-shot com casos diversos

### 3. Prompt Engineering para Vendas (HeyReach)

- **4 elementos essenciais**:
  - Role & Persona
  - Goal/Task
  - Output Formats
  - Context & Guardrails

- **Inputs obrigatórios**:
  - ICP data (indústria, tamanho, cargos, dores)
  - Perfil do prospect
  - Sinais da empresa
  - Contexto do CRM

---

## Contexto Específico: Clínicas de Estética Avançada

### Perfil do Usuário Final (Mentorado)
- Profissionais de estética com clínicas próprias
- Foco em procedimentos de alto valor
- Necessidade de gestão financeira simplificada
- Marketing digital via Instagram (posts, stories, reels)
- Captação de leads via WhatsApp

### Métricas Chave do NeonDash
- Faturamento vs Meta
- Margem de Lucro
- Posts no Feed
- Stories
- Leads captados
- Procedimentos realizados
- Ticket médio

### Desafios Comuns
1. Sazonalidade de atendimentos
2. Precificação inadequada
3. Marketing sem estratégia
4. Conversão baixa de leads
5. Fluxo de caixa desorganizado

---

## Agentes Atuais do NeonDash

### 1. Neon Coach Financeiro
**Prompt Atual:**
> "Você é um especialista em finanças para clínicas de estética. Analise os dados de faturamento, lucro e despesas. Identifique tendências de queda, gastos excessivos com insumos ou marketing ineficiente. Seja direto, motivador e use emojis. Foque em: 1. Aumentar margem de lucro. 2. Reduzir custos fixos. 3. Otimizar ticket médio."

**Problemas Identificados:**
- Falta estrutura clara de seções
- Não define formato de output
- Não inclui guardrails
- Não contextualiza o público-alvo

### 2. Agente IA de Marketing
**Prompt Atual:**
> "Você é um especialista em marketing digital para profissionais de estética. Seu foco é Instagram, conteúdo orgânico e estratégias de engajamento. Analise métricas de posts, stories e reels. Sugira horários ideais de postagem, tipos de conteúdo que convertem e estratégias para aumentar alcance. Seja criativo e prático."

**Problemas Identificados:**
- Muito genérico
- Não define persona específica
- Falta contexto do Grupo US
- Não menciona metodologias específicas

### 3. Agente IA Comercial (SDR)
**Prompt Atual:**
> "Você é um especialista em vendas consultivas para clínicas de estética. Seu foco é qualificação de leads, scripts de abordagem e técnicas de fechamento. Ajude a estruturar o funil de vendas, melhorar conversões e criar relacionamento com potenciais clientes. Seja objetivo e orientado a resultados."

**Problemas Identificados:**
- Não define tom de voz
- Falta contexto de WhatsApp
- Não inclui guardrails de compliance
- Não especifica formato de resposta

---

## Recomendações para Aprimoramento

### Estrutura Proposta para Cada Agente

```yaml
# Template Base
<role_and_persona>
  # Quem é o agente, expertise, tom de voz
</role_and_persona>

<context>
  # Background do Grupo US, público-alvo, metodologias
</context>

<task_definition>
  # Objetivo principal e métricas de sucesso
</task_definition>

<rules_and_guardrails>
  # O que fazer e o que NÃO fazer
</rules_and_guardrails>

<output_structure>
  # Formato esperado das respostas
</output_structure>

<examples>
  # Few-shot com casos reais
</examples>

<key_reminder>
  # Reforço das 2-3 instruções mais críticas
</key_reminder>
```

---

## Próximos Passos

1. Desenvolver prompts completos para cada agente
2. Incluir exemplos específicos do mercado de estética
3. Validar com casos de uso reais
4. Documentar para fácil manutenção
