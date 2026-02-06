# Prompt de Implementação: Sincronização de Procedimentos - NeonDash

**Para:** Antigravity IDE  
**Projeto:** NeonDash - Sistema de Gestão para Clínicas de Estética  
**Data:** 06 de Fevereiro de 2026

---

## 🎯 OBJETIVO DA IMPLEMENTAÇÃO

Você deve implementar um sistema completo de sincronização de procedimentos estéticos no NeonDash, seguindo rigorosamente o plano de implementação anexado. O sistema atual possui procedimentos isolados na área de precificação. Sua missão é transformar isso em um hub centralizado que sincroniza procedimentos entre CRM, Agenda e Financeiro.

---

## 📋 CONTEXTO DO PROJETO

**Stack Tecnológico:**
- Backend: Node.js + tRPC + Drizzle ORM + PostgreSQL
- Frontend: React + TypeScript + TailwindCSS + TanStack Query
- Gerenciador de pacotes: Bun

**Estrutura Atual:**
- Tabela `procedimentos` existe com campos de precificação
- Tabela `insumos` possui 54 insumos padrão com auto-seed
- Leads armazenam `procedimentosInteresse` como `text[]` (texto livre)
- Agenda não possui campo para procedimento
- Aba "Precificação" está em `/financeiro`

**Arquivos Principais:**
- Schema: `drizzle/schema.ts`
- Router: `server/precificacaoRouter.ts` (será renomeado)
- Páginas: `client/src/pages/Financeiro.tsx`, `client/src/pages/crm/LeadsPage.tsx`, `client/src/pages/Agenda.tsx`

---

## 🏗️ PLANO DE IMPLEMENTAÇÃO DETALHADO

### **FASE 1: BACKEND - ESTRUTURA DE DADOS**

#### **TAREFA 1.1: Atualizar Schema do Banco de Dados**

**Arquivo:** `drizzle/schema.ts`

**Ações:**

1. **Modificar tabela `leads`:**
   - Localizar a definição da tabela `leads` (linha ~453)
   - Alterar o campo `procedimentosInteresse` de `text("procedimentos_interesse").array()` para:
   ```typescript
   procedimentosInteresse: integer("procedimentos_interesse").array().references(() => procedimentos.id)
   ```
   - **Importante:** Como PostgreSQL não suporta FK em arrays nativamente, use uma abordagem alternativa:
     - Manter como `integer("procedimentos_interesse").array()` SEM FK direta
     - Adicionar validação na camada de aplicação (tRPC)

2. **Adicionar campo em eventos da agenda:**
   - Se houver uma tabela `calendar_events` ou similar, adicionar:
   ```typescript
   procedimentoId: integer("procedimento_id").references(() => procedimentos.id, { onDelete: "set null" })
   ```
   - **Nota:** Se eventos são armazenados apenas no Google Calendar, adicionar o campo em `extendedProperties` via API

3. **Gerar migração:**
   ```bash
   bun run drizzle-kit generate
   bun run drizzle-kit migrate
   ```

**Validação:**
- Executar `bun run build` sem erros
- Verificar no banco se as colunas foram criadas corretamente

**Rollback:**
- Reverter alterações no `schema.ts`
- Rodar `drizzle-kit generate` novamente para criar migração reversa

---

#### **TAREFA 1.2: Renomear Roteador**

**Arquivos:**
- `server/precificacaoRouter.ts` → `server/procedimentosRouter.ts`
- `server/_app.ts` (ou onde os routers são registrados)

**Ações:**

1. Renomear o arquivo:
   ```bash
   mv server/precificacaoRouter.ts server/procedimentosRouter.ts
   ```

2. Atualizar exportação no arquivo renomeado:
   ```typescript
   // Antes: export const precificacaoRouter = router({...})
   // Depois: export const procedimentosRouter = router({...})
   ```

3. Atualizar importação em `server/_app.ts`:
   ```typescript
   // Antes: import { precificacaoRouter } from "./precificacaoRouter";
   // Depois: import { procedimentosRouter } from "./procedimentosRouter";
   
   // Antes: precificacao: precificacaoRouter,
   // Depois: procedimentos: procedimentosRouter,
   ```

**Validação:**
- `bun run build` deve compilar sem erros
- Endpoints antigos devem funcionar com novo nome: `trpc.procedimentos.insumos.list.useQuery()`

**Rollback:**
- Renomear arquivo de volta
- Reverter alterações nas importações

---

#### **TAREFA 1.3: Criar Seed de Procedimentos Padrão**

**Arquivo:** `server/procedimentosRouter.ts`

**Ações:**

1. **Criar array de procedimentos padrão** (adicionar após o array de insumos padrão):

```typescript
const DEFAULT_PROCEDIMENTOS = [
  // FACIAIS
  {
    nome: "Harmonização Facial Completa",
    categoria: "Facial",
    precoVenda: 550000, // R$ 5.500,00 em centavos
    custoOperacional: 50000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Full Face", quantidade: 1 },
      { nome: "Cânula", quantidade: 2 },
      { nome: "Anestésico", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
      { nome: "Álcool Suabe", quantidade: 2 },
    ]
  },
  {
    nome: "Botox (Toxina Botulínica)",
    categoria: "Facial",
    precoVenda: 150000, // R$ 1.500,00
    custoOperacional: 20000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Botox", quantidade: 1 },
      { nome: "Seringa 3ML", quantidade: 1 },
      { nome: "Álcool Suabe", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Preenchimento Labial",
    categoria: "Facial",
    precoVenda: 180000, // R$ 1.800,00
    custoOperacional: 15000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Labial", quantidade: 1 },
      { nome: "Cânula", quantidade: 1 },
      { nome: "Anestésico", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Preenchimento Facial",
    categoria: "Facial",
    precoVenda: 250000, // R$ 2.500,00
    custoOperacional: 20000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Diamond Bio", quantidade: 1 },
      { nome: "Cânula", quantidade: 1 },
      { nome: "Anestésico", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Peeling Químico",
    categoria: "Facial",
    precoVenda: 55000, // R$ 550,00
    custoOperacional: 10000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Fluido Biorelaxante", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
      { nome: "Gaze", quantidade: 2 },
    ]
  },
  {
    nome: "Microagulhamento Facial",
    categoria: "Facial",
    precoVenda: 65000, // R$ 650,00
    custoOperacional: 15000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Ponteira 5 Agulhas", quantidade: 1 },
      { nome: "Anestésico", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Limpeza de Pele Profunda",
    categoria: "Facial",
    precoVenda: 25000, // R$ 250,00
    custoOperacional: 5000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Sabonete Líquido Pele", quantidade: 1 },
      { nome: "Tônico Pele", quantidade: 1 },
      { nome: "Esfoliante", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Bioestimulador de Colágeno",
    categoria: "Facial",
    precoVenda: 300000, // R$ 3.000,00
    custoOperacional: 25000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Elleva 210 Bio", quantidade: 1 },
      { nome: "Seringa 3ML", quantidade: 2 },
      { nome: "Anestésico", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Fios de PDO (Lifting)",
    categoria: "Facial",
    precoVenda: 400000, // R$ 4.000,00
    custoOperacional: 30000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Fios de PDO", quantidade: 10 },
      { nome: "Anestésico", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
      { nome: "Álcool Suabe", quantidade: 3 },
    ]
  },
  {
    nome: "Skinbooster",
    categoria: "Facial",
    precoVenda: 130000, // R$ 1.300,00
    custoOperacional: 15000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Diamond Bio", quantidade: 1 },
      { nome: "Seringa 3ML", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Peeling de Diamante",
    categoria: "Facial",
    precoVenda: 42500, // R$ 425,00
    custoOperacional: 8000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Ponteira SmartGR", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },

  // CAPILARES
  {
    nome: "Intradermoterapia Capilar",
    categoria: "Capilar",
    precoVenda: 65000, // R$ 650,00
    custoOperacional: 10000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Ativos - Alopecia Masculina", quantidade: 1 },
      { nome: "Agulha 40x13", quantidade: 5 },
      { nome: "Seringa 3ML", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Microagulhamento Capilar",
    categoria: "Capilar",
    precoVenda: 55000, // R$ 550,00
    custoOperacional: 10000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Ponteira Capilar", quantidade: 1 },
      { nome: "Ativos - IM Boom Capilar", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Dutasterida Intradérmica",
    categoria: "Capilar",
    precoVenda: 47500, // R$ 475,00
    custoOperacional: 8000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Dudasterida", quantidade: 1 },
      { nome: "Seringa 3ML", quantidade: 1 },
      { nome: "Agulha 30x13", quantidade: 3 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Protocolo Boom Capilar",
    categoria: "Capilar",
    precoVenda: 85000, // R$ 850,00
    custoOperacional: 12000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Ativos - IM Boom Capilar", quantidade: 1 },
      { nome: "Agulha 40x13", quantidade: 5 },
      { nome: "Seringa 3ML", quantidade: 2 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },

  // CORPORAIS
  {
    nome: "Criolipólise",
    categoria: "Corporal",
    precoVenda: 140000, // R$ 1.400,00
    custoOperacional: 30000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Luvas", quantidade: 1 },
      { nome: "Papel Lençol", quantidade: 2 },
    ]
  },
  {
    nome: "Radiofrequência Corporal",
    categoria: "Corporal",
    precoVenda: 50000, // R$ 500,00
    custoOperacional: 10000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Luvas", quantidade: 1 },
      { nome: "Papel Lençol", quantidade: 1 },
    ]
  },
  {
    nome: "Drenagem Linfática",
    categoria: "Corporal",
    precoVenda: 25000, // R$ 250,00
    custoOperacional: 5000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Luvas", quantidade: 1 },
      { nome: "Creme Emoliente", quantidade: 1 },
      { nome: "Papel Lençol", quantidade: 1 },
    ]
  },
  {
    nome: "Massagem Modeladora",
    categoria: "Corporal",
    precoVenda: 29000, // R$ 290,00
    custoOperacional: 5000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Creme Emoliente", quantidade: 1 },
      { nome: "Papel Lençol", quantidade: 1 },
    ]
  },
  {
    nome: "Intradermoterapia Corporal",
    categoria: "Corporal",
    precoVenda: 65000, // R$ 650,00
    custoOperacional: 12000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Agulha 40x13", quantidade: 10 },
      { nome: "Seringa 10ML", quantidade: 2 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Carboxiterapia",
    categoria: "Corporal",
    precoVenda: 50000, // R$ 500,00
    custoOperacional: 10000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Oxigênio", quantidade: 100 },
      { nome: "Agulha 30x13", quantidade: 5 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Lipocavitação",
    categoria: "Corporal",
    precoVenda: 42500, // R$ 425,00
    custoOperacional: 8000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Luvas", quantidade: 1 },
      { nome: "Papel Lençol", quantidade: 1 },
    ]
  },
  {
    nome: "Endermologia",
    categoria: "Corporal",
    precoVenda: 47500, // R$ 475,00
    custoOperacional: 10000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Luvas", quantidade: 1 },
      { nome: "Papel Lençol", quantidade: 1 },
    ]
  },

  // DEPILAÇÃO
  {
    nome: "Depilação a Laser - Corpo Completo",
    categoria: "Depilação",
    precoVenda: 50000, // R$ 500,00
    custoOperacional: 15000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Depilação a Laser - Facial",
    categoria: "Depilação",
    precoVenda: 16500, // R$ 165,00
    custoOperacional: 5000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Depilação a Laser - Íntima",
    categoria: "Depilação",
    precoVenda: 27500, // R$ 275,00
    custoOperacional: 8000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Luvas", quantidade: 1 },
    ]
  },

  // AVANÇADOS
  {
    nome: "Microagulhamento Microfocado",
    categoria: "Avançado",
    precoVenda: 250000, // R$ 2.500,00
    custoOperacional: 50000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Máquina Lavien (Locação Diária)", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Ultrassom Microfocado",
    categoria: "Avançado",
    precoVenda: 350000, // R$ 3.500,00
    custoOperacional: 70000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Locação Máquina Microfocado", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
  {
    nome: "Laser Fracionado Corporal",
    categoria: "Avançado",
    precoVenda: 175000, // R$ 1.750,00
    custoOperacional: 40000,
    custoInvestimento: 0,
    percentualParceiro: 0,
    percentualImposto: 700,
    insumos: [
      { nome: "Máquina Lavien (Locação Diária)", quantidade: 1 },
      { nome: "Luvas", quantidade: 1 },
    ]
  },
];
```

2. **Modificar a procedure `procedimentos.list`** para incluir auto-seed:

```typescript
list: mentoradoProcedure.query(async ({ ctx }) => {
  const db = getDb();

  // Get all procedures
  let procs = await db
    .select()
    .from(procedimentos)
    .where(eq(procedimentos.mentoradoId, ctx.mentorado.id))
    .orderBy(procedimentos.nome);

  // Auto-seed if empty
  if (procs.length === 0) {
    // Buscar todos os insumos do mentorado
    const insumosDoMentorado = await db
      .select()
      .from(insumos)
      .where(eq(insumos.mentoradoId, ctx.mentorado.id));

    // Criar um mapa de nome -> id para facilitar busca
    const insumoMap = new Map(
      insumosDoMentorado.map(i => [i.nome, i.id])
    );

    // Inserir cada procedimento padrão
    for (const procDefault of DEFAULT_PROCEDIMENTOS) {
      const [novoProcedimento] = await db
        .insert(procedimentos)
        .values({
          mentoradoId: ctx.mentorado.id,
          nome: procDefault.nome,
          precoVenda: procDefault.precoVenda,
          custoOperacional: procDefault.custoOperacional,
          custoInvestimento: procDefault.custoInvestimento,
          percentualParceiro: procDefault.percentualParceiro,
          percentualImposto: procDefault.percentualImposto,
        })
        .returning({ id: procedimentos.id });

      // Vincular insumos
      const insumosParaVincular = procDefault.insumos
        .map(insumoRef => {
          const insumoId = insumoMap.get(insumoRef.nome);
          if (!insumoId) return null;
          return {
            procedimentoId: novoProcedimento.id,
            insumoId: insumoId,
            quantidade: insumoRef.quantidade,
          };
        })
        .filter(Boolean);

      if (insumosParaVincular.length > 0) {
        await db.insert(procedimentoInsumos).values(insumosParaVincular);
      }
    }

    // Re-fetch após seed
    procs = await db
      .select()
      .from(procedimentos)
      .where(eq(procedimentos.mentoradoId, ctx.mentorado.id))
      .orderBy(procedimentos.nome);
  }

  // Get all procedure-insumo relationships with insumo data
  const procInsumos = await db
    .select({
      procedimentoId: procedimentoInsumos.procedimentoId,
      insumoId: procedimentoInsumos.insumoId,
      quantidade: procedimentoInsumos.quantidade,
      insumoNome: insumos.nome,
      insumoValorCompra: insumos.valorCompra,
      insumoRendimento: insumos.rendimento,
    })
    .from(procedimentoInsumos)
    .innerJoin(insumos, eq(procedimentoInsumos.insumoId, insumos.id))
    .innerJoin(procedimentos, eq(procedimentoInsumos.procedimentoId, procedimentos.id))
    .where(eq(procedimentos.mentoradoId, ctx.mentorado.id));

  // Map insumos to procedures
  return procs.map((proc) => ({
    ...proc,
    insumos: procInsumos.filter((pi) => pi.procedimentoId === proc.id),
  }));
}),
```

**Validação:**
- Acessar a página de procedimentos com um novo mentorado
- Verificar se os 30 procedimentos são listados automaticamente
- Verificar se cada procedimento possui os insumos corretos vinculados

**Rollback:**
- Remover o array `DEFAULT_PROCEDIMENTOS`
- Reverter a lógica de auto-seed na procedure `list`

---

### **FASE 2: BACKEND - AJUSTES NOS ROTEADORES**

#### **TAREFA 2.1: Atualizar LeadsRouter**

**Arquivo:** `server/leadsRouter.ts`

**Ações:**

1. **Modificar Zod schema de criação:**

```typescript
// Localizar o schema de create (linha ~153)
create: mentoradoProcedure
  .input(
    z.object({
      // ... outros campos ...
      procedimentosInteresse: z.array(z.number()).optional(), // MUDANÇA AQUI
      // ... outros campos ...
    })
  )
```

2. **Modificar Zod schema de update:**

```typescript
// Localizar o schema de update (linha ~221)
update: mentoradoProcedure
  .input(
    z.object({
      // ... outros campos ...
      procedimentosInteresse: z.array(z.number()).optional(), // MUDANÇA AQUI
      // ... outros campos ...
    })
  )
```

3. **Adicionar validação de existência dos procedimentos:**

```typescript
// Dentro da mutation de create, ANTES do insert:
if (input.procedimentosInteresse && input.procedimentosInteresse.length > 0) {
  // Verificar se todos os IDs existem e pertencem ao mentorado
  const procedimentosExistentes = await db
    .select({ id: procedimentos.id })
    .from(procedimentos)
    .where(
      and(
        eq(procedimentos.mentoradoId, ctx.mentorado.id),
        inArray(procedimentos.id, input.procedimentosInteresse)
      )
    );

  if (procedimentosExistentes.length !== input.procedimentosInteresse.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Um ou mais procedimentos não existem ou não pertencem a você",
    });
  }
}
```

**Validação:**
- Criar um lead passando IDs de procedimentos válidos → deve funcionar
- Criar um lead passando IDs inválidos → deve retornar erro
- Verificar no banco se o array de IDs foi salvo corretamente

**Rollback:**
- Reverter os schemas Zod para `z.array(z.string())`
- Remover a validação de existência

---

#### **TAREFA 2.2: Atualizar CalendarRouter (se aplicável)**

**Arquivo:** `server/calendarRouter.ts` (ou onde eventos são gerenciados)

**Ações:**

1. **Adicionar campo `procedimentoId` no schema de criação de eventos:**

```typescript
createEvent: mentoradoProcedure
  .input(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      start: z.string(), // ISO date
      end: z.string(), // ISO date
      procedimentoId: z.number().optional(), // NOVO CAMPO
      // ... outros campos ...
    })
  )
```

2. **Salvar `procedimentoId` no Google Calendar usando `extendedProperties`:**

```typescript
// Dentro da mutation createEvent:
const event = {
  summary: input.title,
  description: input.description,
  start: { dateTime: input.start },
  end: { dateTime: input.end },
  extendedProperties: {
    private: {
      procedimentoId: input.procedimentoId?.toString() || "",
    },
  },
};

const createdEvent = await calendar.events.insert({
  calendarId: "primary",
  requestBody: event,
});
```

3. **Recuperar `procedimentoId` ao listar eventos:**

```typescript
// Na procedure getEvents, ao mapear eventos:
const events = response.data.items.map(event => ({
  id: event.id,
  title: event.summary,
  start: event.start.dateTime,
  end: event.end.dateTime,
  procedimentoId: event.extendedProperties?.private?.procedimentoId
    ? parseInt(event.extendedProperties.private.procedimentoId)
    : null,
  // ... outros campos ...
}));
```

**Validação:**
- Criar um evento na agenda associando um procedimento
- Listar eventos e verificar se o `procedimentoId` retorna corretamente
- Verificar no Google Calendar se a propriedade foi salva

**Rollback:**
- Remover o campo `procedimentoId` do schema
- Remover a lógica de `extendedProperties`

---

### **FASE 3: FRONTEND - INTERFACE DO USUÁRIO**

#### **TAREFA 3.1: Renomear Navegação**

**Arquivo:** `client/src/components/DashboardLayout.tsx`

**Ações:**

1. Localizar o array `navItems` (linha ~58)
2. Modificar o item de Financeiro:

```typescript
const navItems = [
  // ... outros itens ...
  { 
    href: "/financeiro", 
    label: "Financeiro", 
    icon: TrendingUp,
    subItems: [
      { href: "/financeiro/transacoes", label: "Transações" },
      { href: "/financeiro/categorias", label: "Categorias" },
      { href: "/financeiro/procedimentos", label: "Procedimentos" }, // MUDANÇA AQUI
      { href: "/financeiro/insumos", label: "Insumos" },
    ]
  },
  // ... outros itens ...
];
```

**Validação:**
- A navegação lateral deve exibir "Procedimentos" ao invés de "Precificação"
- O link deve funcionar corretamente

**Rollback:**
- Reverter o label para "Precificação"

---

#### **TAREFA 3.2: Criar Componente ProcedimentoSelector**

**Arquivo:** `client/src/components/shared/ProcedimentoSelector.tsx` (criar novo)

**Ações:**

Criar um componente reutilizável de seleção de procedimentos:

```typescript
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";

interface ProcedimentoSelectorProps {
  value?: number | number[]; // Suporta single ou multiple
  onChange: (value: number | number[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export function ProcedimentoSelector({
  value,
  onChange,
  multiple = false,
  placeholder = "Selecione um procedimento...",
  className,
}: ProcedimentoSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: procedimentos, isLoading } = trpc.procedimentos.procedimentos.list.useQuery();

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (procedimentoId: number) => {
    if (multiple) {
      const newValues = selectedValues.includes(procedimentoId)
        ? selectedValues.filter(id => id !== procedimentoId)
        : [...selectedValues, procedimentoId];
      onChange(newValues);
    } else {
      onChange(procedimentoId);
      setOpen(false);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const proc = procedimentos?.find(p => p.id === selectedValues[0]);
      return proc?.nome || placeholder;
    }
    return `${selectedValues.length} procedimentos selecionados`;
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {getDisplayText()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar procedimento..." />
          <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {procedimentos?.map((proc) => (
              <CommandItem
                key={proc.id}
                value={proc.nome}
                onSelect={() => handleSelect(proc.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedValues.includes(proc.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{proc.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    R$ {(proc.precoVenda / 100).toFixed(2)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Validação:**
- O componente deve renderizar sem erros
- Deve buscar e listar procedimentos via tRPC
- Deve permitir seleção única ou múltipla conforme prop `multiple`

**Rollback:**
- Deletar o arquivo `ProcedimentoSelector.tsx`

---

#### **TAREFA 3.3: Integrar Seletor no CRM (Leads)**

**Arquivo:** `client/src/pages/crm/LeadsPage.tsx` (ou modal de edição)

**Ações:**

1. Importar o componente:
```typescript
import { ProcedimentoSelector } from "@/components/shared/ProcedimentoSelector";
```

2. Localizar o campo de "Procedimentos de Interesse" no formulário

3. Substituir o campo de texto por:
```typescript
<FormField
  control={form.control}
  name="procedimentosInteresse"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Procedimentos de Interesse</FormLabel>
      <FormControl>
        <ProcedimentoSelector
          value={field.value}
          onChange={field.onChange}
          multiple={true}
          placeholder="Selecione os procedimentos..."
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Validação:**
- Ao criar/editar um lead, deve aparecer o seletor de procedimentos
- Deve ser possível selecionar múltiplos procedimentos
- Os IDs devem ser salvos corretamente no backend

**Rollback:**
- Substituir o `ProcedimentoSelector` pelo campo de texto original

---

#### **TAREFA 3.4: Integrar Seletor na Agenda**

**Arquivo:** `client/src/components/agenda/EventFormDialog.tsx`

**Ações:**

1. Importar o componente:
```typescript
import { ProcedimentoSelector } from "@/components/shared/ProcedimentoSelector";
```

2. Adicionar o campo no formulário (após o campo de descrição):
```typescript
<FormField
  control={form.control}
  name="procedimentoId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Procedimento (Opcional)</FormLabel>
      <FormControl>
        <ProcedimentoSelector
          value={field.value}
          onChange={field.onChange}
          multiple={false}
          placeholder="Selecione o procedimento..."
        />
      </FormControl>
      <FormDescription>
        Vincule este agendamento a um procedimento específico
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Validação:**
- Ao criar/editar um evento, deve aparecer o seletor de procedimento
- Deve ser possível selecionar apenas um procedimento
- O ID deve ser salvo no Google Calendar via `extendedProperties`

**Rollback:**
- Remover o campo do formulário

---

#### **TAREFA 3.5: Atualizar Página de Procedimentos**

**Arquivo:** `client/src/pages/Financeiro.tsx` (ou componente específico da aba)

**Ações:**

1. Adicionar uma seção de destaque para procedimentos padrão:

```typescript
<div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
  <h3 className="text-lg font-semibold mb-2">✨ Procedimentos Pré-configurados</h3>
  <p className="text-sm text-muted-foreground">
    Criamos automaticamente 30 procedimentos estéticos padrão para você, com insumos e preços sugeridos.
    Você pode editá-los ou criar novos conforme sua necessidade.
  </p>
</div>
```

2. Adicionar filtro por categoria:

```typescript
const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todas");

const categorias = ["Todas", "Facial", "Capilar", "Corporal", "Depilação", "Avançado"];

const procedimentosFiltrados = procedimentos?.filter(
  p => categoriaFiltro === "Todas" || p.categoria === categoriaFiltro
);

// Renderizar tabs de filtro:
<Tabs value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
  <TabsList>
    {categorias.map(cat => (
      <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
    ))}
  </TabsList>
</Tabs>
```

**Validação:**
- A página deve exibir o banner de procedimentos padrão
- O filtro por categoria deve funcionar corretamente
- Todos os procedimentos devem ser listados com seus insumos

**Rollback:**
- Remover o banner e o filtro de categoria

---

### **FASE 4: VALIDAÇÃO E TESTES**

#### **TAREFA 4.1: Teste de Fluxo Completo**

**Ações:**

1. **Criar novo mentorado de teste:**
   - Acessar a página de procedimentos
   - Verificar se os 30 procedimentos foram criados automaticamente
   - Verificar se cada procedimento possui insumos vinculados

2. **Testar CRM:**
   - Criar um novo lead
   - Selecionar 2-3 procedimentos de interesse usando o seletor
   - Salvar e verificar se os IDs foram salvos no banco

3. **Testar Agenda:**
   - Criar um novo evento
   - Selecionar um procedimento usando o seletor
   - Salvar e verificar se o ID foi salvo no Google Calendar

4. **Testar Sincronização:**
   - Verificar se o lead criado exibe os procedimentos corretos
   - Verificar se o evento criado exibe o procedimento correto
   - Editar um procedimento e verificar se a mudança reflete em todas as páginas

**Validação:**
- Todos os passos devem funcionar sem erros
- Os dados devem estar consistentes entre as páginas

**Rollback:**
- Identificar a tarefa que falhou e executar seu rollback específico

---

#### **TAREFA 4.2: Limpeza de Código**

**Ações:**

1. Remover imports não utilizados
2. Remover `console.log` de debug
3. Remover comentários desnecessários
4. Formatar código com Prettier:
   ```bash
   bun run format
   ```

**Validação:**
- `bun run lint` deve passar sem warnings
- `bun run build` deve compilar sem erros

---

## 🚨 REGRAS IMPORTANTES

1. **NÃO PULE ETAPAS:** Siga a ordem exata das tarefas
2. **VALIDE CADA TAREFA:** Execute os comandos de validação após cada implementação
3. **COMMIT ATÔMICO:** Faça um commit após cada tarefa completada
4. **ROLLBACK PREPARADO:** Se algo falhar, execute o rollback da tarefa antes de tentar novamente
5. **TESTE ANTES DE AVANÇAR:** Não avance para a próxima fase sem validar a anterior

---

## 📦 COMANDOS ÚTEIS

```bash
# Gerar migração do banco
bun run drizzle-kit generate

# Aplicar migração
bun run drizzle-kit migrate

# Compilar projeto
bun run build

# Rodar linter
bun run lint

# Formatar código
bun run format

# Rodar testes
bun test

# Iniciar dev server
bun run dev
```

---

## 📚 ARQUIVOS DE REFERÊNCIA

- **Research:** `/home/ubuntu/neondash/docs/RESEARCH-procedimentos-sync.md`
- **Plan:** `/home/ubuntu/neondash/docs/PLAN-procedimentos-sync.md`
- **Schema:** `/home/ubuntu/neondash/drizzle/schema.ts`
- **Router:** `/home/ubuntu/neondash/server/procedimentosRouter.ts`

---

## ✅ CHECKLIST FINAL

Antes de considerar a implementação completa, verifique:

- [ ] Schema do banco atualizado e migrado
- [ ] Router renomeado de `precificacaoRouter` → `procedimentosRouter`
- [ ] Seed de 30 procedimentos padrão funcionando
- [ ] LeadsRouter aceitando array de IDs
- [ ] CalendarRouter salvando `procedimentoId`
- [ ] Navegação renomeada para "Procedimentos"
- [ ] Componente `ProcedimentoSelector` criado e funcionando
- [ ] Seletor integrado no CRM
- [ ] Seletor integrado na Agenda
- [ ] Página de Procedimentos com filtro por categoria
- [ ] Teste E2E completo executado com sucesso
- [ ] Código limpo e formatado
- [ ] Build sem erros
- [ ] Commits atômicos realizados

---

**BOA IMPLEMENTAÇÃO! 🚀**
