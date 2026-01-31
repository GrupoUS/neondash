# PRP: Unificação Neon Estrutura e Escala em NEON Único

## Metadata

| Campo | Valor |
|-------|-------|
| **Complexity** | L6 — Arquitetura, migração de dados, multi-file |
| **Estimated Time** | 4-6 horas |
| **Parallel Safe** | Parcialmente (AT-001 deve ser executado primeiro) |
| **Risk Level** | Médio (requer migração de dados em produção) |

---

## 1. Objetivo e Contexto

O objetivo desta implementação é **unificar os grupos "Neon Estrutura" e "Neon Escala" em um único grupo denominado "NEON"**. Atualmente, o sistema separa mentorados em duas turmas distintas, cada uma com suas próprias métricas, rankings e visualizações. Esta separação será eliminada, criando uma experiência unificada tanto no banco de dados quanto na interface do usuário.

A mudança impacta múltiplas camadas da aplicação, desde o schema do banco de dados PostgreSQL (via Drizzle ORM), passando pela lógica de negócio no backend (tRPC routers), até os componentes React no frontend. O resultado final será um dashboard consolidado onde todos os mentorados competem em um único ranking e visualizam métricas agregadas.

---

## 2. Análise de Impacto

### 2.1 Arquivos Afetados

| Camada | Arquivo | Tipo de Mudança |
|--------|---------|-----------------|
| **Database** | `drizzle/schema.ts` | Modificar `turmaEnum` para valor único |
| **Database** | `drizzle/0000_nifty_betty_ross.sql` | Referência (não modificar) |
| **Database** | Nova migração | Criar migração para atualizar dados existentes |
| **Backend** | `server/gamificacao.ts` | Remover loop por turmas no cálculo de ranking |
| **Backend** | `server/gamificacaoRouter.ts` | Remover filtro de turma do endpoint |
| **Backend** | `server/mentoradosRouter.ts` | Remover validação de turma nos inputs |
| **Backend** | `server/emailService.ts` | Remover referência a turma no email |
| **Backend** | `server/services/userService.ts` | Remover default de turma |
| **Backend** | `server/seed-playbook.ts` | Unificar módulos do playbook |
| **Backend** | `server/routers/playbook.ts` | Remover filtro de turma |
| **Backend** | `server/_core/context.ts` | Remover default de turma |
| **Frontend** | `client/src/pages/Home.tsx` | Remover abas de turma, unificar dados |
| **Frontend** | `client/src/pages/Admin.tsx` | Remover contadores separados |
| **Frontend** | `client/src/pages/MyDashboard.tsx` | Remover badge de turma |
| **Frontend** | `client/src/pages/VincularEmails.tsx` | Remover display de turma |
| **Frontend** | `client/src/pages/MoltbotPage.tsx` | Remover referência a turma |
| **Frontend** | `client/src/components/dashboard/RankingView.tsx` | Remover filtro de turma |
| **Frontend** | `client/src/components/dashboard/TurmaView.tsx` | Remover ou refatorar completamente |
| **Frontend** | `client/src/components/profile-card.tsx` | Remover prop turma |
| **Frontend** | `client/src/components/admin/*.tsx` | Remover referências a turma |
| **Frontend** | `client/src/lib/data.ts` | Unificar estrutura de dados |

---

## 3. Tarefas Atômicas

### Fase 1: Foundation (Database)

#### AT-001: Criar Migração para Unificar Turma no Banco de Dados

**Prioridade:** Critical  
**Dependências:** Nenhuma  
**Parallel Safe:** Não

**Descrição:** Esta tarefa cria uma migração SQL que atualiza todos os registros existentes para usar um valor único de turma e modifica o enum no schema do Drizzle.

**Arquivos a Modificar:**
1. `drizzle/schema.ts` — Linha 18
2. Criar novo arquivo de migração

**Prompt para Implementação:**

```
Você é um especialista em Drizzle ORM e PostgreSQL. Execute as seguintes modificações no projeto neondash:

1. ABRA o arquivo `drizzle/schema.ts` e localize a linha 18:
   export const turmaEnum = pgEnum("turma", ["neon_estrutura", "neon_escala"]);

2. MODIFIQUE para:
   export const turmaEnum = pgEnum("turma", ["neon"]);

3. CRIE um novo arquivo de migração SQL em `drizzle/migrations/` com timestamp atual (formato: XXXX_unify_turma.sql) contendo:

-- Atualizar todos os mentorados para turma unificada
UPDATE mentorados SET turma = 'neon' WHERE turma IN ('neon_estrutura', 'neon_escala');

-- Atualizar todos os rankings para turma unificada
UPDATE ranking_mensal SET turma = 'neon' WHERE turma IN ('neon_estrutura', 'neon_escala');

-- Atualizar todos os playbook_modules para turma unificada
UPDATE playbook_modules SET turma = 'neon' WHERE turma IN ('neon_estrutura', 'neon_escala');

-- Alterar o enum (PostgreSQL requer recriação)
ALTER TYPE turma RENAME TO turma_old;
CREATE TYPE turma AS ENUM ('neon');
ALTER TABLE mentorados ALTER COLUMN turma TYPE turma USING 'neon'::turma;
ALTER TABLE ranking_mensal ALTER COLUMN turma TYPE turma USING 'neon'::turma;
ALTER TABLE playbook_modules ALTER COLUMN turma TYPE turma USING turma::text::turma;
DROP TYPE turma_old;

4. EXECUTE `bun run db:generate` para gerar o snapshot atualizado.

VALIDAÇÃO:
- Verifique que `drizzle/schema.ts` contém apenas 'neon' no turmaEnum
- Verifique que o arquivo de migração foi criado
- Execute `bun run db:migrate` em ambiente de desenvolvimento para testar
```

**Validação:**
- `grep -n "turmaEnum" drizzle/schema.ts` deve mostrar apenas `["neon"]`
- Arquivo de migração existe em `drizzle/migrations/`
- `bun run db:migrate` executa sem erros

**Rollback:**
```bash
# Reverter schema
git checkout drizzle/schema.ts
# Deletar migração
rm drizzle/migrations/*unify_turma.sql
# Em produção, executar SQL reverso
```

---

### Fase 2: Core (Backend Logic)

#### AT-002: Remover Lógica de Turmas no Cálculo de Gamificação

**Prioridade:** Critical  
**Dependências:** `[AT-001]`  
**Parallel Safe:** Sim (após AT-001)

**Descrição:** O arquivo `server/gamificacao.ts` atualmente itera sobre as duas turmas para calcular rankings separados. Esta lógica deve ser simplificada para processar todos os mentorados em um único ranking.

**Arquivos a Modificar:**
1. `server/gamificacao.ts` — Linhas 305-420

**Prompt para Implementação:**

```
Você é um especialista em TypeScript e lógica de backend. Execute as seguintes modificações no arquivo `server/gamificacao.ts`:

1. LOCALIZE a função `calculateMonthlyRanking` (aproximadamente linha 305).

2. ENCONTRE o código:
   const turmas = ["neon_estrutura", "neon_escala"] as const;
   for (const turma of turmas) {

3. REMOVA o loop de turmas e REFATORE para processar todos os mentorados ativos de uma vez:

   // ANTES (remover):
   const turmas = ["neon_estrutura", "neon_escala"] as const;
   for (const turma of turmas) {
     const mentoradosTurma = await db
       .select()
       .from(mentorados)
       .where(and(eq(mentorados.turma, turma), eq(mentorados.ativo, "sim")));
     // ... resto do código dentro do loop
   }

   // DEPOIS (substituir por):
   const todosmentorados = await db
     .select()
     .from(mentorados)
     .where(eq(mentorados.ativo, "sim"));

   const rankings: {
     mentoradoId: number;
     pontuacao: number;
     bonus: number;
   }[] = [];

   for (const m of todosmentorados) {
     // ... manter a lógica de cálculo de pontuação existente
   }

   // Ordenar por pontuação
   rankings.sort((a, b) => b.pontuacao - a.pontuacao);

   // Deletar rankings existentes do mês (sem filtro de turma)
   await db
     .delete(rankingMensal)
     .where(
       and(
         eq(rankingMensal.ano, ano),
         eq(rankingMensal.mes, mes)
       )
     );

   // Inserir novos rankings com turma fixa 'neon'
   for (let i = 0; i < rankings.length; i++) {
     await db.insert(rankingMensal).values({
       mentoradoId: rankings[i].mentoradoId,
       ano,
       mes,
       turma: "neon",
       posicao: i + 1,
       pontuacaoTotal: rankings[i].pontuacao,
       pontosBonus: rankings[i].bonus,
     });
   }

4. LOCALIZE a função `getRanking` (aproximadamente linha 712) e REMOVA o parâmetro opcional de turma:

   // ANTES:
   turma?: "neon_estrutura" | "neon_escala"

   // DEPOIS:
   // Remover completamente o parâmetro turma

5. ATUALIZE a query dentro de `getRanking` para não filtrar por turma.

VALIDAÇÃO:
- Execute `bun run typecheck` para verificar tipos
- Execute `bun run test` para rodar os testes existentes
```

**Validação:**
- `grep -n "neon_estrutura\|neon_escala" server/gamificacao.ts` não retorna resultados
- `bun run typecheck` passa sem erros
- `bun run test` passa (pode precisar atualizar testes)

---

#### AT-003: Atualizar Routers tRPC para Remover Filtros de Turma

**Prioridade:** Critical  
**Dependências:** `[AT-002]`  
**Parallel Safe:** Sim

**Descrição:** Os routers tRPC expõem endpoints que aceitam turma como parâmetro. Estes devem ser atualizados para não aceitar mais este filtro.

**Arquivos a Modificar:**
1. `server/gamificacaoRouter.ts` — Linha 70
2. `server/mentoradosRouter.ts` — Linhas 62, 170, 218
3. `server/routers/playbook.ts` — Linha 15

**Prompt para Implementação:**

```
Você é um especialista em tRPC e Zod. Execute as seguintes modificações nos routers do backend:

### Arquivo 1: server/gamificacaoRouter.ts

1. LOCALIZE linha 70:
   turma: z.enum(["neon_estrutura", "neon_escala"]).optional(),

2. REMOVA esta linha completamente do schema de input.

3. ATUALIZE a chamada para `Gamificacao.getRanking` removendo o parâmetro turma.

### Arquivo 2: server/mentoradosRouter.ts

1. LOCALIZE linha 62 (dentro de `create`):
   turma: z.enum(["neon_estrutura", "neon_escala"]),

2. SUBSTITUA por:
   turma: z.literal("neon").default("neon"),

3. LOCALIZE linha 170 (dentro de `update`):
   turma: z.enum(["neon_estrutura", "neon_escala"]).optional(),

4. REMOVA esta linha completamente (turma não deve ser editável).

5. LOCALIZE linha 218 (dentro de `createNew`):
   turma: z.enum(["neon_estrutura", "neon_escala"]),

6. SUBSTITUA por:
   turma: z.literal("neon").default("neon"),

### Arquivo 3: server/routers/playbook.ts

1. LOCALIZE linha 15:
   z.object({ turma: z.enum(["neon_estrutura", "neon_escala"]).optional() })

2. REMOVA o objeto de input completamente ou substitua por z.void().

3. ATUALIZE a query para não filtrar por turma.

VALIDAÇÃO:
- Execute `bun run typecheck`
- Teste os endpoints manualmente via Postman ou Thunder Client
```

**Validação:**
- `grep -rn "neon_estrutura\|neon_escala" server/*.ts server/routers/*.ts` não retorna resultados
- `bun run typecheck` passa

---

#### AT-004: Atualizar Serviços Auxiliares do Backend

**Prioridade:** High  
**Dependências:** `[AT-001]`  
**Parallel Safe:** Sim

**Descrição:** Serviços auxiliares como email e contexto de usuário também referenciam turmas e devem ser atualizados.

**Arquivos a Modificar:**
1. `server/emailService.ts` — Linha 51
2. `server/services/userService.ts` — Linhas 95-96
3. `server/_core/context.ts` — Linha 134

**Prompt para Implementação:**

```
Você é um especialista em TypeScript. Execute as seguintes modificações nos serviços auxiliares:

### Arquivo 1: server/emailService.ts

1. LOCALIZE linha 51:
   turma === "neon_estrutura" ? "Neon Estrutura" : "Neon Escala";

2. SUBSTITUA por:
   const turmaNome = "NEON";

3. ATUALIZE o template de email para usar apenas "NEON" como nome da turma.

### Arquivo 2: server/services/userService.ts

1. LOCALIZE linhas 95-96:
   (user.public_metadata?.turma as "neon_estrutura" | "neon_escala") ||
   "neon_estrutura";

2. SUBSTITUA por:
   "neon" as const;

### Arquivo 3: server/_core/context.ts

1. LOCALIZE linha 134:
   turma: "neon_estrutura", // Default value

2. SUBSTITUA por:
   turma: "neon", // Turma unificada

VALIDAÇÃO:
- Execute `bun run typecheck`
- Verifique que não há mais referências a "neon_estrutura" ou "neon_escala" nestes arquivos
```

**Validação:**
- `grep -n "neon_estrutura\|neon_escala" server/emailService.ts server/services/userService.ts server/_core/context.ts` não retorna resultados

---

### Fase 3: Integration (Frontend)

#### AT-005: Unificar Página Home e Remover Abas de Turma

**Prioridade:** High  
**Dependências:** `[AT-002, AT-003]`  
**Parallel Safe:** Sim

**Descrição:** A página Home atualmente exibe abas separadas para "Neurônios Estrutura" e "Neurônios Escala". Estas devem ser removidas e substituídas por uma visão unificada.

**Arquivos a Modificar:**
1. `client/src/pages/Home.tsx`

**Prompt para Implementação:**

```
Você é um especialista em React e TypeScript. Execute as seguintes modificações em `client/src/pages/Home.tsx`:

1. LOCALIZE as importações de `analiseData` e ATUALIZE para usar dados unificados:

   // A estrutura de dados será modificada em AT-008, mas prepare o código para:
   const allMentorados = [
     ...Object.entries(analiseData.neon?.analise || {}),
   ];

2. LOCALIZE o array de tabs no `FloatingDockTabsList` (linhas 122-148):

   {
     value: "estrutura",
     label: "Neurônios Estrutura",
     icon: Users,
   },
   {
     value: "escala",
     label: "Neurônios Escala",
     icon: TrendingUp,
   },

3. REMOVA estas duas entradas do array de tabs.

4. LOCALIZE os `FloatingDockTabsContent` para "estrutura" e "escala" (linhas 365-373):

   <FloatingDockTabsContent value="estrutura" className="mt-0">
     <TurmaView type="estrutura" />
   </FloatingDockTabsContent>

   <FloatingDockTabsContent value="escala" className="mt-0">
     <TurmaView type="escala" />
   </FloatingDockTabsContent>

5. SUBSTITUA por uma única aba "Mentorados":

   <FloatingDockTabsContent value="mentorados" className="mt-0">
     <MentoradosUnifiedView />
   </FloatingDockTabsContent>

6. ATUALIZE a lógica de cálculo de `topPerformers`, `faturamentoTotal`, `totalMentorados` e `chartData` para usar dados unificados em vez de concatenar duas fontes.

7. REMOVA os badges "5 Estrutura" e "9 Escala" (linhas 215-220) e substitua por um único contador total.

VALIDAÇÃO:
- Execute `bun run dev` e verifique visualmente que as abas de turma não aparecem mais
- Verifique que os dados agregados estão corretos
```

**Validação:**
- Visualmente, a página Home não exibe mais abas de turma
- `grep -n "estrutura\|escala" client/src/pages/Home.tsx` retorna apenas referências a "infraestrutura" ou similares (não relacionadas a turmas)

---

#### AT-006: Atualizar RankingView para Remover Filtro de Turma

**Prioridade:** High  
**Dependências:** `[AT-003]`  
**Parallel Safe:** Sim

**Descrição:** O componente RankingView possui um dropdown para filtrar por turma que deve ser removido.

**Arquivos a Modificar:**
1. `client/src/components/dashboard/RankingView.tsx`

**Prompt para Implementação:**

```
Você é um especialista em React e TypeScript. Execute as seguintes modificações em `client/src/components/dashboard/RankingView.tsx`:

1. LOCALIZE o state de turma (linha 24-26):

   const [turma, setTurma] = useState<
     "neon_estrutura" | "neon_escala" | "todas"
   >("todas");

2. REMOVA completamente este state.

3. LOCALIZE a query tRPC (linhas 28-32):

   const { data: ranking, isLoading } = trpc.gamificacao.ranking.useQuery({
     ano: selectedYear,
     mes: selectedMonth,
     turma: turma === "todas" ? undefined : turma,
   });

4. SIMPLIFIQUE para:

   const { data: ranking, isLoading } = trpc.gamificacao.ranking.useQuery({
     ano: selectedYear,
     mes: selectedMonth,
   });

5. LOCALIZE o Select de turma (linhas 77-90) e REMOVA completamente:

   <Select
     value={turma}
     onValueChange={v => setTurma(v as typeof turma)}
   >
     ...
   </Select>

6. LOCALIZE os Badges de turma nos cards do podium (linhas 155-162) e REMOVA:

   <Badge
     variant="outline"
     className="text-xs mb-2 bg-white/50 backdrop-blur-sm"
   >
     {item.mentorado.turma === "neon_estrutura"
       ? "Estrutura"
       : "Escala"}
   </Badge>

7. LOCALIZE a exibição de turma na lista completa (linhas 224-228) e REMOVA:

   <p className="text-sm text-slate-500">
     {item.mentorado.turma === "neon_estrutura"
       ? "Neon Estrutura"
       : "Neon Escala"}
   </p>

VALIDAÇÃO:
- Execute `bun run dev` e verifique que o filtro de turma não aparece mais
- Verifique que o ranking exibe todos os mentorados em uma única lista
```

**Validação:**
- `grep -n "neon_estrutura\|neon_escala" client/src/components/dashboard/RankingView.tsx` não retorna resultados

---

#### AT-007: Atualizar Componentes Administrativos

**Prioridade:** Medium  
**Dependências:** `[AT-003]`  
**Parallel Safe:** Sim

**Descrição:** Os componentes administrativos exibem contadores e badges de turma que devem ser removidos.

**Arquivos a Modificar:**
1. `client/src/pages/Admin.tsx`
2. `client/src/pages/VincularEmails.tsx`
3. `client/src/components/admin/AdminOverview.tsx`
4. `client/src/components/admin/MenteeManagementView.tsx`
5. `client/src/components/admin/LinkEmailsView.tsx`

**Prompt para Implementação:**

```
Você é um especialista em React. Execute as seguintes modificações nos componentes administrativos:

### Arquivo 1: client/src/pages/Admin.tsx

1. LOCALIZE linhas 36-39:
   const estruturaCount =
     mentorados?.filter((m: any) => m.turma === "neon_estrutura").length || 0;
   const escalaCount =
     mentorados?.filter((m: any) => m.turma === "neon_escala").length || 0;

2. SUBSTITUA por:
   const totalCount = mentorados?.length || 0;

3. LOCALIZE linhas 70-73 (badges de contagem) e SUBSTITUA por um único contador:
   <span className="bg-neon-gold/20 text-neon-blue-dark px-2 py-0.5 rounded-full font-medium">
     {totalCount} Mentorados
   </span>

4. LOCALIZE linhas 147-154 (exibição de turma na tabela) e REMOVA completamente a coluna de turma.

### Arquivo 2: client/src/pages/VincularEmails.tsx

1. LOCALIZE linhas 102-106 e 164-166 que exibem badges de turma e REMOVA.

### Arquivo 3: client/src/components/admin/AdminOverview.tsx

1. BUSQUE por referências a "estrutura" ou "escala" e REMOVA.

### Arquivo 4: client/src/components/admin/MenteeManagementView.tsx

1. BUSQUE por referências a "estrutura" ou "escala" e REMOVA.

### Arquivo 5: client/src/components/admin/LinkEmailsView.tsx

1. BUSQUE por referências a "estrutura" ou "escala" e REMOVA.

VALIDAÇÃO:
- Execute `bun run dev` e navegue até a área administrativa
- Verifique que não há mais referências visuais a turmas separadas
```

**Validação:**
- `grep -rn "neon_estrutura\|neon_escala" client/src/pages/Admin.tsx client/src/pages/VincularEmails.tsx client/src/components/admin/` não retorna resultados

---

#### AT-008: Atualizar Outros Componentes de Frontend

**Prioridade:** Medium  
**Dependências:** `[AT-003]`  
**Parallel Safe:** Sim

**Descrição:** Componentes adicionais como profile-card, MyDashboard e MoltbotPage também referenciam turmas.

**Arquivos a Modificar:**
1. `client/src/components/profile-card.tsx`
2. `client/src/pages/MyDashboard.tsx`
3. `client/src/pages/MoltbotPage.tsx`

**Prompt para Implementação:**

```
Você é um especialista em React e TypeScript. Execute as seguintes modificações:

### Arquivo 1: client/src/components/profile-card.tsx

1. LOCALIZE a interface de props (linha 20):
   turma?: "neon_estrutura" | "neon_escala";

2. REMOVA esta prop completamente.

3. LOCALIZE a lógica de gradiente baseada em turma (linhas 46-52) e SIMPLIFIQUE para um único gradiente padrão:
   const gradientClass = "bg-gradient-to-r from-purple-500 to-pink-500";

4. LOCALIZE o Badge de turma (linhas 103-107) e REMOVA completamente.

### Arquivo 2: client/src/pages/MyDashboard.tsx

1. LOCALIZE linha 252:
   {currentMentorado?.turma === "neon_estrutura"

2. REMOVA toda a lógica condicional de turma e substitua por um texto fixo ou remova o badge completamente.

### Arquivo 3: client/src/pages/MoltbotPage.tsx

1. LOCALIZE linhas 67 e 85 que verificam turma e REMOVA as condicionais.

VALIDAÇÃO:
- Execute `bun run typecheck` para verificar que não há erros de tipo
- Verifique visualmente que os componentes renderizam corretamente
```

**Validação:**
- `grep -rn "neon_estrutura\|neon_escala" client/src/components/profile-card.tsx client/src/pages/MyDashboard.tsx client/src/pages/MoltbotPage.tsx` não retorna resultados

---

### Fase 4: Polish (Data & Seeding)

#### AT-009: Unificar Dados Estáticos em data.ts

**Prioridade:** Medium  
**Dependências:** `[AT-005]`  
**Parallel Safe:** Sim

**Descrição:** O arquivo `client/src/lib/data.ts` contém dados mockados separados por turma que devem ser unificados.

**Arquivos a Modificar:**
1. `client/src/lib/data.ts`

**Prompt para Implementação:**

```
Você é um especialista em TypeScript. Execute as seguintes modificações em `client/src/lib/data.ts`:

1. LOCALIZE a interface `AnaliseCompleta` (linhas 49-52):

   export interface AnaliseCompleta {
     neon_estrutura: GrupoAnalise;
     neon_escala: GrupoAnalise;
   }

2. SUBSTITUA por:

   export interface AnaliseCompleta {
     neon: GrupoAnalise;
   }

3. LOCALIZE o objeto `analiseData` (linha 54 em diante) e UNIFIQUE os dados:

   export const analiseData: AnaliseCompleta = {
     neon: {
       analise: {
         // Combinar todos os mentorados de ambas as turmas anteriores
         ...dadosNeonEstrutura,
         ...dadosNeonEscala,
       },
       ranking: [
         // Combinar e reordenar por score
         ...rankingCombinado,
       ],
       benchmarks: {
         meta_faturamento: 20000, // Média entre 16000 e 30000
         posts_feed_min: 10,
         stories_min: 44,
         procedimentos_min: 8,
         leads_min: 50,
       },
     },
   };

4. REMOVA a propriedade `bonus_estrutura` dos detalhes dos mentorados (não faz mais sentido com turma única).

5. RECALCULE o ranking combinado ordenando todos os mentorados por score.

VALIDAÇÃO:
- Execute `bun run typecheck`
- Verifique que os imports em outros arquivos não quebram
```

**Validação:**
- `grep -n "neon_estrutura\|neon_escala" client/src/lib/data.ts` não retorna resultados
- `bun run typecheck` passa

---

#### AT-010: Atualizar Script de Seeding do Playbook

**Prioridade:** Low  
**Dependências:** `[AT-001]`  
**Parallel Safe:** Sim

**Descrição:** O script de seeding cria módulos separados por turma que devem ser unificados.

**Arquivos a Modificar:**
1. `server/seed-playbook.ts`

**Prompt para Implementação:**

```
Você é um especialista em TypeScript e Drizzle ORM. Execute as seguintes modificações em `server/seed-playbook.ts`:

1. LOCALIZE todas as referências a `turma: "neon_estrutura"` e `turma: "neon_escala"`.

2. SUBSTITUA todas por `turma: "neon"`.

3. CONSIDERE unificar módulos duplicados (ex: se houver "Fase 1" para ambas as turmas, manter apenas uma).

4. EXEMPLO de estrutura final:

   const [mod1] = await db
     .insert(playbookModules)
     .values({
       title: "Fase 1: Onboarding e Diagnóstico",
       description: "Primeiros passos na metodologia NEON.",
       order: 1,
       turma: "neon", // Turma unificada
     })
     .returning();

VALIDAÇÃO:
- Execute `bun run seed:playbook` em ambiente de desenvolvimento
- Verifique no banco de dados que os módulos foram criados com turma "neon"
```

**Validação:**
- `grep -n "neon_estrutura\|neon_escala" server/seed-playbook.ts` não retorna resultados

---

### Fase 5: Validation

#### AT-011: Refatorar ou Remover TurmaView

**Prioridade:** Medium  
**Dependências:** `[AT-005, AT-009]`  
**Parallel Safe:** Sim

**Descrição:** O componente TurmaView foi projetado para exibir dados de uma turma específica. Com a unificação, ele deve ser refatorado para uma visão geral ou removido.

**Arquivos a Modificar:**
1. `client/src/components/dashboard/TurmaView.tsx`

**Prompt para Implementação:**

```
Você é um especialista em React. Execute uma das seguintes opções para `client/src/components/dashboard/TurmaView.tsx`:

### Opção A: Refatorar para MentoradosUnifiedView

1. RENOMEIE o arquivo para `MentoradosUnifiedView.tsx`.

2. REMOVA a prop `type` da interface.

3. ATUALIZE para usar `analiseData.neon` diretamente:

   export function MentoradosUnifiedView() {
     const data = analiseData.neon;
     // ... resto da lógica
   }

4. REMOVA toda lógica condicional baseada em tipo de turma.

5. ATUALIZE o título para "Visão Geral NEON".

### Opção B: Remover Completamente

1. DELETE o arquivo `TurmaView.tsx`.

2. ATUALIZE `client/src/pages/Home.tsx` para não importar este componente.

3. CRIE uma nova seção inline em Home.tsx para exibir os mentorados.

VALIDAÇÃO:
- Execute `bun run dev` e verifique que a aplicação carrega sem erros
- Verifique que os dados dos mentorados são exibidos corretamente
```

**Validação:**
- Aplicação carrega sem erros
- Dados de mentorados são exibidos em uma visão unificada

---

#### AT-012: Limpeza Final e Validação Completa

**Prioridade:** Low  
**Dependências:** `[AT-001 até AT-011]`  
**Parallel Safe:** Não

**Descrição:** Realizar uma busca global para garantir que todas as referências foram removidas e executar testes completos.

**Prompt para Implementação:**

```
Você é um especialista em qualidade de código. Execute as seguintes verificações finais:

1. BUSCA GLOBAL por referências remanescentes:
   grep -rn "neon_estrutura\|neon_escala\|Neon Estrutura\|Neon Escala" --include="*.ts" --include="*.tsx" --include="*.sql" --include="*.json" .

2. IGNORE resultados em:
   - node_modules/
   - .git/
   - Arquivos de snapshot antigos (se não forem mais necessários)

3. PARA cada resultado encontrado, avalie se:
   - É código ativo que precisa ser atualizado
   - É um arquivo de histórico/backup que pode ser ignorado
   - É um teste que precisa ser atualizado

4. EXECUTE os comandos de validação:
   bun run typecheck
   bun run lint
   bun run test
   bun run build

5. CORRIJA quaisquer erros encontrados.

6. ATUALIZE o arquivo `drizzle/meta/0000_snapshot.json` se necessário (geralmente gerado automaticamente).

VALIDAÇÃO:
- Todos os comandos de validação passam sem erros
- A busca global não retorna resultados em código ativo
- A aplicação funciona corretamente em ambiente de desenvolvimento
```

**Validação:**
- `bun run typecheck` — 0 erros
- `bun run lint` — 0 warnings
- `bun run test` — Todos os testes passam
- `bun run build` — Build completa com sucesso

---

## 4. Diagrama de Dependências

```
AT-001 (Database Migration)
    │
    ├──► AT-002 (Backend Gamificação)
    │        │
    │        └──► AT-003 (tRPC Routers)
    │                 │
    │                 ├──► AT-005 (Home.tsx)
    │                 │        │
    │                 │        └──► AT-011 (TurmaView)
    │                 │
    │                 ├──► AT-006 (RankingView)
    │                 │
    │                 ├──► AT-007 (Admin Components)
    │                 │
    │                 └──► AT-008 (Other Components)
    │
    ├──► AT-004 (Backend Services)
    │
    ├──► AT-009 (data.ts) ──► AT-011
    │
    └──► AT-010 (Seed Playbook)

AT-012 (Final Validation) ◄── Todas as tarefas anteriores
```

---

## 5. Considerações de Rollback

Em caso de problemas em produção, o rollback deve seguir a ordem inversa:

1. **Frontend:** Reverter commits dos componentes React
2. **Backend:** Reverter commits dos routers e serviços
3. **Database:** Executar migração reversa (recriar enum com valores antigos e atualizar dados)

**Script de Rollback do Banco de Dados:**

```sql
-- Reverter enum de turma
ALTER TYPE turma RENAME TO turma_new;
CREATE TYPE turma AS ENUM ('neon_estrutura', 'neon_escala');

-- Atribuir turma baseado em critério (ex: metaFaturamento)
UPDATE mentorados 
SET turma = CASE 
  WHEN meta_faturamento <= 20000 THEN 'neon_estrutura'::turma 
  ELSE 'neon_escala'::turma 
END;

-- Atualizar ranking_mensal de forma similar
UPDATE ranking_mensal SET turma = 'neon_estrutura'::turma;

-- Limpar tipo temporário
DROP TYPE turma_new;
```

---

## 6. Checklist de Validação Final

| Item | Comando/Ação | Status |
|------|--------------|--------|
| TypeScript compila | `bun run typecheck` | ⬜ |
| Lint passa | `bun run lint` | ⬜ |
| Testes passam | `bun run test` | ⬜ |
| Build completa | `bun run build` | ⬜ |
| Busca global limpa | `grep -rn "neon_estrutura\|neon_escala"` | ⬜ |
| Migração testada em dev | Manual | ⬜ |
| UI funciona corretamente | Manual | ⬜ |
| Ranking unificado funciona | Manual | ⬜ |
| Área admin funciona | Manual | ⬜ |

---

## 7. Próximos Passos

Após a aprovação deste plano:

1. Execute `/implement` para iniciar a implementação
2. Ou modifique o plano conforme necessário
3. Considere criar um branch `feature/unify-neon` para as mudanças

---

**Autor:** Manus AI  
**Data:** 31 de Janeiro de 2026  
**Versão:** 1.0
