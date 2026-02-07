# Prompt: CRM de Lead Management - Neon Dashboard

> **Contexto**: Sistema para coordenar leads gerados pelos alunos do Neon, seguindo melhores práticas modernas de CRM design (2025) e integrando-se ao ecossistema Neon Dashboard.

---

## 📋 Visão Geral

**Objetivo**: Build um CRM completo e bem estruturado para gerenciamento de leads, focado em eficiência, visualização em pipeline e produtividade para os mentorados/alunos do Neon.

**Princípios de Design CRM 2025** (baseado em pesquisa):

- **Visual Pipeline**: Kanban board para visibilidade clara do fluxo de leads
- **Touch Targets**: 48px+ para CTAs principais (Fitts' Law)
- **Progressive Disclosure**: Filtros avançados escondidos até necessário (Hick's Law)
- **Contextual Insights**: Dados transformados em ações acionáveis
- **Role-Based Views**: Interface adaptada ao tipo de usuário (mentor/aluno)

---

## 🎯 Requisitos Funcionais (MVP)

### 1. Lista de Leads com Filtros Avançados

```
Filtros Básicos (visíveis):
├── Busca global (nome, email, telefone)
├── Status do lead
├── Origem do lead
└── Data de criação (últimos 7/30/90 dias)

Filtros Avançados (collapsible):
├── Turma do mentorado (neon_estrutura/neon_escala)
├── Faturamento estimado range
├── Número de follow-ups realizados
├── Última interação (X dias atrás)
└── Tags personalizadas
```

### 2. Visualização em Pipeline (Kanban View)

```
Etapas do Pipeline (configuráveis):
├── 🆕 Novo Lead
├── 📞 Em Contato
├── 🤝 Reunião Agendada
├── 📄 Proposta Enviada
├── ⚡ Negociação
├── ✅ Fechado (Ganho)
└── ❌ Perdido

Funcionalidades:
└── Drag-and-drop entre colunas
└── Contador de leads por etapa
└── Valor total por etapa (somatório de estimativas)
```

### 3. Detalhes de Lead (Modal/View)

```
Informações do Lead:
├── Nome completo
├── Email
├── Telefone
├── Empresa (opcional)
├── Origem (Instagram, WhatsApp, Google, etc.)
├── Status atual
├── Valor estimado da oportunidade
├── Data de criação
└── Última atualização

Histórico de Interações:
├── Timeline cronológica
├── Tipo de interação (ligação, email, WhatsApp, reunião)
├── Notas
├── Data/hora
└── Mentorado responsável
```

### 4. Gestão de Interações (Follow-ups)

```
Tipos de Interação:
├── 📞 Ligação (com duração automática)
├── 📧 Email (com template opcional)
├── 💬 WhatsApp (quick reply)
├── 📅 Reunião (agender no calendário - future)
└── 📝 Nota genérica

Ações Rápidas:
├── Logar interação (com notas)
├── Agendar próximo follow-up (com lembrete)
├── Mover lead para próxima etapa
└── Adicionar tag personalizada
```

### 5. Dashboard de Analytics Básico

```
KPIs Principais:
├── Total de leads ativos
├── Taxa de conversão (pipeline)
├── Tempo médio de fechamento
├── Leads por origem
├── Top performer (mentorado com mais conversões)
└── Gráfico de pipeline (funnel)
```

---

## 🎨 Requisitos Não-Funcionais (UX/UI)

### Design Psychology (Frontend-Design Skill)

#### Hick's Law - Redução de Escolhas

```
❌ Anti-pattern: 15+ filtros visíveis de uma vez
✅ Filtros prioritários + "Advanced Options ▼" collapsible
```

#### Fitts' Law - Alcançabilidade dos CTAs

```
Botões primários:
├── height: 48px minimum
├── padding: 0 24px
└── distância: perto do cursor/scroll atual

Touch targets (mobile):
└── 44×44px minimum per elemento interativo
```

#### Miller's Law - Chunking de Conteúdo

```
Lista de leads:
├── Paginação (20-50 itens por página)
└── Agrupar por data/semana

Card de lead:
└── Máximo 7 infos visíveis (chunking)
```

#### Von Restorff - Destaque de Elementos

```
CTA primário:
├── Cor diferenciada (accent color)
└── Sombra elevada (shadow-lg)

Pipeline stages ativos:
└── Border destacado quando tem itens
```

#### Serial Position - Ordenação Estratégica

```
Pipeline Kanban:
├── Primeira coluna: Novo Lead (priorização entrada)
└── Última coluna: Fechado/Perdido (finalização)

Filtros principais:
├── Primeiro: Busca global
└── Último: Data (timeline)
```

### Emotional Design Levels

**VISCERAL (First Impression)**

- Clean, minimal UI com generous whitespace
- Color palette coerente com branding Neon (a ser definido)
- Micro-interactions suaves no hover/drag-drop

**BEHAVIORAL (Effective Use)**

- Feedback instantâneo em todas as ações
- Loading states claros (skeleton screen em vez de spinner)
- Keyboard navigation completa (tab, arrow keys)
- Responsivo (mobile, tablet, desktop)

**REFLECTIVE (Identity)**

- Dashboard personalizado por mentorado
- Histórico de performance visível
- Progress indicators (gamificação básica)

---

## 🚀 Tech Stack & Convenções

### Stack do Projeto Neon

| Layer             | Technology                    | Conventions                           |
| ----------------- | ----------------------------- | ------------------------------------- |
| **Runtime**       | **Bun**                       | `bun install`, `bun run`, `bunx`      |
| **Frontend**      | React 19.2 + Vite 7           | Functional components, hooks only     |
| **Styling**       | Tailwind CSS 4 + shadcn/ui    | `@/components/ui/*` imports           |
| **Data Fetching** | TanStack Query 5 + tRPC 11    | `trpc.*.useQuery()`, `.useMutation()` |
| **Forms**         | react-hook-form + zod         | Schema-driven validation              |
| **Backend**       | Express 4 + tRPC 11           | Protected procedures with Clerk auth  |
| **Database**      | Neon PostgreSQL + Drizzle ORM | `ctx.db.*` for queries                |
| **Auth**          | Clerk                         | `SignedIn`, `UserButton` components   |

### Component Architecture

```
client/src/
├── components/
│   ├── ui/              # shadcn/ui primitives (USE THEM!)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx   # For modals
│   │   ├── select.tsx
│   │   └── ...
│   ├── crm/
│   │   ├── LeadsTable.tsx      # Table view
│   │   ├── PipelineKanban.tsx   # Kanban view
│   │   ├── LeadDetail.tsx       # Modal/slideout
│   │   ├── InteractionLog.tsx   # Timeline component
│   │   ├── QuickActions.tsx     # Action buttons
│   │   └── FiltersPanel.tsx     # Collapsible filters
│   └── auth/
│       ├── SignInButton.tsx
│       └── UserButton.tsx
├── pages/
│   ├── crm/
│   │   └── LeadsPage.tsx        # Main CRM page
│   └── dashboard/
│       └── MentorDashboard.tsx  # Analytics overview
├── hooks/
│   └── use-leads.ts             # Custom hooks for tRPC
└── lib/
    └── trpc.ts                  # tRPC client config
```

### Database Schema (Drizzle ORM)

```typescript
// drizzle/schema.ts - Extensão para CRM

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id), // mentorado dono
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  empresa: text("empresa"),
  origem: text("origem"), // Instagram, WhatsApp, Google, etc.
  status: text("status").notNull(), // pipeline stage
  valor_estimado: integer("valor_estimado"),
  data_criacao: timestamp("data_criacao").defaultNow(),
  ultima_atualizacao: timestamp("ultima_atualizacao").defaultNow(),
  tags: text("tags").array(),
});

export const interacoes = pgTable("interacoes", {
  id: serial("id").primaryKey(),
  lead_id: integer("lead_id").references(() => leads.id),
  tipo: text("tipo").notNull(), // ligacao, email, whatsapp, reuniao, nota
  notas: text("notas"),
  data: timestamp("data").defaultNow(),
  user_id: integer("user_id").references(() => users.id),
});
```

### tRPC Router Pattern

```typescript
// server/leadsRouter.ts
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";

export const leadsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        busca: z.string().optional(),
        status: z.string().optional(),
        page: z.number().default(1),
      })
    )
    .query(async ({ ctx, input }) => {
      // Query com filtros e paginação
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Detalhes de lead + história de interações
    }),

  create: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(1),
        email: z.string().email(),
        telefone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Criar novo lead
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Mover lead para nova etapa
    }),

  addInteraction: protectedProcedure
    .input(
      z.object({
        lead_id: z.number(),
        tipo: z.string(),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Registrar interação
    }),
});
```

---

## 🎨 Design System & Color Palette

### Palette Sugerida (Luxury CRM Trust)

```yaml
Primary (Trust, Stability):
  - slate-900 # Principal ações, headers
  - slate-50 # Background light mode

Secondary (Calm, Professional):
  - slate-600 # Secondary text
  - slate-200 # Borders, dividers

Accent (Action, Urgency):
  - blue-600 # Primary buttons, CTA
  - blue-500 # Hover states

Success (Conversion):
  - green-500 # Fechado pipeline
  - green-50 # Background success states

Warning (Negotiation):
  - amber-500 # Em negociação
  - amber-50 # Background warning states

Error (Lost):
  - red-500 # Perdido pipeline
  - red-50 # Background error states
```

### Typography Scale (Editorial 1.333)

```yaml
Scale Ratio: 1.333

Display XL: 64px - Hero headers (dashboard)
Display LG: 48px - Page titles
Display MD: 36px - Section headers
Heading XL: 24px - Card titles
Heading LG: 18px - Subsection titles
Heading MD: 16px - List item titles
Body: 16px - Standard text (minimum accessibility)
Small: 14px - Secondary text, metadata
X-Small: 12px - Labels, timestamps
```

### Spacing (8-Point Grid)

```yaml
Tight: 4px   (half-step for micro)
Small: 8px
Medium: 16px
Large: 24px
XL: 32px
2XL: 48px
3XL: 64px
```

---

## 📐 Layout & Component Guidelines

### Main CRM Page Structure

```
┌─────────────────────────────────────────────────────┐
│ Header: Neon Dashboard  |  Search   丨  User      │
└─────────────────────────────────────────────────────┘
│ Breadcrumb: Dashboard › Leads                        │
├─────────────────────────────────────────────────────┤
│ Stats Bar:                                         │
│ [Active: 24]  [Conversion: 23%]  [Value: R$ 125K] │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   Filters Panel      │   Main Content Area         │
│   (Collapsible)      │   (Kanban / Table View)     │
│                      │                              │
├──────────────────────┴──────────────────────────────┤
│  Pagination / Load More                               │
└─────────────────────────────────────────────────────┘
```

### Kanban Pipeline Layout

```
Horizontal scroll:
┌─────────┬─────────┬────────────┬───────────┬───────┐
| Novo    | Em      | Reunião    | Proposta  | ...   |
|  [4]    | Contato | Agendada   | Enviada   |       |
|─────────┼─────────┼────────────┼───────────┼───────┤
| Lead 1  | Lead 5  | Lead 12    | Lead 8    |       |
| Lead 3  | Lead 7  |            | Lead 9    |       |
| Lead 6  |         |            |           |       |
└─────────┴─────────┴────────────┴───────────┴───────┘

Card height: 200px (flexible content)
Card width: 280px (fixed)
Gap between cards: 16px
Gap between columns: 24px
```

### Lead Detail Modal

```
Size: modal-lg (max-w-4xl, h-[90vh])

Layout:
┌───────────────────────────────────────────────┐
│ Header: [Nome do Lead]  X                     │
│ Email: lead@company.com                        │
├───────────────────────────────────────────────┤
│                                                 │
│ Status Chips [Em Contato] [Instagram]          │
│                                                 │
│ Lead Info (grid):                              │
│ ├─ Created: Jan 15, 2025                      │
│ ├─ Value: R$ 15,000                            │
│ └─ Owner: João Silva (neon_estrutura)         │
│                                                 │
│ Tabs:                                          │
│ [Details] [History] [Notes] [Activity]        │
│                                                 │
│ Interaction Timeline (scrollable):              │
│ ┌─────────────────────────────────────────┐   │
│ │ Jan 28 - Ligação (5 min)               │   │
│ │    "Interessado no plano premium"      │   │
│ └─────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────┐   │
│ │ Jan 25 - WhatsApp                      │   │
│ │    "Enviei a proposta por email"       │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Quick Actions (sticky bottom):                  │
│ [Call] [Email] [WhatsApp] [Log Interaction]   │
└───────────────────────────────────────────────┘
```

---

## ✅ Deliverables & Verification

### Mínimo Viável (MVP)

- [ ] Database schema extendido (leads, interações table)
- [ ] tRPC router `leads.*` procedures (CRUD + queries)
- [ ] Página principal de leads com lista + filtros
- [ ] Kanban view para pipeline
- [ ] Modal de detalhes de lead
- [ ] Form de criação/edição de lead
- [ ] Log de interações básico
- [ ] Dashboard com 3-4 KPIs

### Verificação por Deliverable

**Backend (Database + API)**

```bash
# 1. Database migration
bun run db:push
Verify: tables 'leads' e 'interacoes' criadas no Neon

# 2. Test tRPC procedures
curl localhost:3000/trpc/leads.list
Verify: returns array of leads with pagination

# 3. Create lead test
curl -X POST localhost:3000/trpc/leads.create \
  -H "Content-Type: application/json" \
  -d '{"input": {"nome": "Test Lead", "email": "test@test.com"}}'
Verify: returns created lead object
```

**Frontend (UI Components)**

```bash
bun dev
Verify (in browser):
- [ ] /crm/leads carrega sem console errors
- [ ] Lista de leads visível com dados de teste
- [ ] Filtros funcionais (busca, status)
- [ ] Kanban cards drag-and-drop funcionando
- [ ] Modal de detalhes abre ao clicar card
- [ ] Criar lead form válido (zod validation)
```

**Integration Tests**

```typescript
// server/leads.test.ts
import { describe, test, expect } from "bun:test";

test("create lead", async () => {
  const result = await ctx.db.insert(leads).values({...}).returning();
  expect(result[0].id).toBeDefined();
});

test("list leads with filters", async () => {
  const results = await trpcCaller.leads.list.query({ status: "Novo" });
  expect(results).toHaveLength(4);
});
```

---

## 🚦 Priority & Sequencing

### Phase 1: Foundation (Backend + UI Skeleton)

```
1. Database schema (leads, interacoes)
2. tRPC router (basic CRUD)
3. Page layout (tabs, breadcrumbs)
4. shadcn/ui components integration
```

### Phase 2: Core Features (MVP)

```
5. Leads list with table view
6. Filters basic + advanced (collapsible)
7. Kanban pipeline view
8. Lead detail modal
```

### Phase 3: Enhancement (Post-MVP)

```
9. Interaction logging (quick actions)
10. Dashboard analytics (KPIs)
11. Mobile responsive optimizations
12. Performance optimization (skeleton, infinite scroll)
```

---

## 📅 Time Estimation

| Phase     | Tasks             | Est. Time       |
| --------- | ----------------- | --------------- |
| Phase 1   | Foundation        | 4-6 hours       |
| Phase 2   | MVP               | 8-12 hours      |
| Phase 3   | Enhancement       | 8-10 hours      |
| **Total** | **Complete MVP+** | **20-28 hours** |

---

## 🔍 Resources & References

### Best Practices Research

- [Admin Dashboard UI/UX Best Practices 2025](https://medium.com/@CarlosSmith24/admin-dashboard-ui-ux-best-practices-for-2025-8bdc6090c57d)
- [CRM UX Design in 2025](https://yellowslice.in/bed/crm-ux-design-in-2025-what-works-what-fails-and-whats-next/)
- [Kanban Sales Pipeline Best Practices](https://pipelinecrm.com/blog/kanban-sales-pipelines/)
- [Dashboard Design Best Practices](https://www.resolution.de/post/dashboard-design-best-practices/)

### Project Documentation

- `GEMINI.md` - Project rules & conventions
- `drizzle/schema.ts` - Existing schema
- `server/routers.ts` - tRPC router aggregation
- `client/src/components/ui/` - shadcn/ui components

### Skills Applied

- `frontend-design` - UX Psychology, Layout Principles
- `ui-ux-pro-max` - Design patterns, Accessibility, Performance
- `react-patterns` - React 19 patterns, Hooks
- `clean-code` - Concise, maintainable code

---

## 🎯 Success Criteria

**When is this "Done"?**

1. ✅ All MVP deliverables implemented
2. ✅ Type checking passes (`bun run check`)
3. ✅ Tests passing (`bun test`)
4. ✅ No console errors in browser
5. ✅ Responsive design verified (mobile + tablet + desktop)
6. ✅ Accessibility audit passes (WCAG AA minimum)
7. ✅ Performance acceptable (Lighthouse 90+)
8. ✅ User manual testing:
   - Can create a lead?
   - Can filter leads?
   - Can move leads in pipeline?
   - Can view lead details?
   - Can log interactions?

---

## 🚀 Next Steps (After Approval)

1. **Confirm requirements** with stakeholders (mentors/students)
2. **Refine design system** if specific branding needed
3. **Create implementation plan** using `plan-writing` skill
4. **Start development** following Phase 1 → Phase 3 sequence
5. **Continuous testing** at each phase verification

---

> **Note**: This prompt incorporates research from modern CRM best practices (2025), UX psychology principles from `frontend-design` skill, UI/UX patterns from `ui-ux-pro-max`, and strictly follows the Neon project conventions (Bun, React 19, Tailwind 4, shadcn/ui, tRPC, Drizzle, Clerk).

> **Anti-Patterns to Avoid**:
>
> - ❌ Don't create custom modal/dropdown if shadcn/ui provides it
> - ❌ Don't use emoji icons (use SVG from Lucide/Heroicons)
> - ❌ Don't bypass Clerk authentication checks
> - ❌ Don't add non-essential animations (prefers-reduced-motion)
> - ❌ Don't hardcode colors (use theme variables)
> - ❌ Don't ignore mobile responsiveness (mobile-first approach)

```

```
