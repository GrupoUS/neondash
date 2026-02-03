# PLAN-design-instagram-tab: Aba de Análise do Instagram

> **Goal:** Adicionar aba "Instagram" no dashboard individual de mentorados para login e análise detalhada de métricas.

## Research Findings

| # | Finding | Confidence | Source |
|---|---------|------------|--------|
| 1 | Dashboard usa `NeonTabs` para tabs com valores: visao-geral, diagnostico, evolucao, atividades | High | `MyDashboard.tsx` |
| 2 | Já existe `InstagramConnectionCard` para login via Facebook SDK | High | `components/instagram/` |
| 3 | `targetMentoradoId` disponível para passar ao componente | High | `MyDashboard.tsx:62` |
| 4 | Schema tem `instagramSyncLog` com dados de posts/stories por mês | High | `schema.ts` |
| 5 | Tema GPUS usa Gold/Navy como cores principais | High | GPUS theme |

## Design Specs

### Hierarchy
- **Primary:** Card de conexão Instagram (login/status)
- **Secondary:** Métricas (posts, stories, engajamento)
- **Tertiary:** Histórico de sincronizações

### Colors (60-30-10)
- **60% Background:** `bg-card` / Navy dark
- **30% Foreground:** Text/borders
- **10% Accent:** Instagram gradient (purple→pink) para CTAs

### Typography
- **Heading:** `text-xl font-semibold`
- **Subheading:** `text-sm text-muted-foreground`
- **Metrics:** `text-4xl font-bold`

## UI Layout

```
┌────────────────────────────────────────────────────────────┐
│ [Tab: Instagram]                                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ InstagramConnectionCard                               │ │
│  │ • Conectar/Desconectar                               │ │
│  │ • Status da conta                                    │ │
│  │ • Última sync                                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │   Posts Feed    │  │    Stories      │  │ Engagement │ │
│  │     XX          │  │      XX         │  │   X.XX%    │ │
│  │   este mês      │  │   este mês      │  │  média     │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Histórico de Métricas (últimos 6 meses)              │ │
│  │ [Chart: Posts + Stories over time]                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Atomic Tasks

### AT-001: Criar componente InstagramAnalyticsView
- [x] ST-001.1: Criar `InstagramAnalyticsView.tsx` → File: `components/dashboard/InstagramAnalyticsView.tsx`
- [x] ST-001.2: Importar `InstagramConnectionCard`
- [x] ST-001.3: Adicionar cards de métricas (posts, stories, engagement)
- [x] ST-001.4: Adicionar gráfico histórico com Recharts

### AT-002: Adicionar tab Instagram no MyDashboard
- [x] ST-002.1: Adicionar `NeonTabsTrigger` para "Instagram"
- [x] ST-002.2: Adicionar `NeonTabsContent` com `InstagramAnalyticsView`
- [x] ST-002.3: Passar `mentoradoId` para o componente

### AT-003: Backend - Query para métricas do Instagram
- [x] ST-003.1: Adicionar `getMetricsHistory` no `instagramRouter`
- [x] ST-003.2: Query últimos 6 meses de `instagram_sync_log`

## Validation
- [x] `bun run check` passa
- [x] `bun run lint` passa
- [ ] Tab aparece no dashboard
- [ ] Conexão funciona (após configurar Facebook Dev Console)
