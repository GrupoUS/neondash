# Plano de Migração: Wouter para TanStack Router

**Complexidade:** L9 (Migração de sistema, multi-serviço)
**Tempo Estimado:** 20 horas (2-3 dias)

## 🎯 Objetivo

Migrar o sistema de roteamento do projeto `neondash` de **Wouter** para **TanStack Router**, integrando-o completamente com **TanStack Query** para aproveitar features avançadas como type-safety, file-based routing, loaders de dados e cache otimizado.

## 🔬 Pesquisa e Descobertas

A pesquisa completa está documentada em `docs/research-findings.md`. Os pontos principais são:

- **Wouter:** Atualmente em uso, leve, mas sem os recursos modernos de type-safety e data loading.
- **TanStack Router:** Oferece type-safety, file-based routing, loaders, e integração profunda com TanStack Query.
- **TanStack Query:** Já está instalado e configurado, mas pode ser otimizado com `staleTime`, `gcTime` e query keys padronizadas.
- **Estrutura do Projeto:** O roteamento está centralizado em `App.tsx`, com 21 páginas e 19 componentes usando `wouter`.

## 📋 Plano de Ação: Tarefas Atômicas (Atomic Tasks)

O plano segue a metodologia R.P.I.V (Research → Plan → Implement → Validate), com cada tarefa sendo atômica, validável e com um plano de rollback.

### Fase 1: Setup e Configuração Inicial (⚡ PARALLEL-SAFE)

| ID | Tarefa | Validação | Rollback |
|---|---|---|---|
| **AT-001** | Instalar dependências | `bun install` bem-sucedido | `bun uninstall @tanstack/react-router @tanstack/router-plugin @tanstack/react-router-devtools` |
| **AT-002** | Configurar Vite Plugin | `vite.config.ts` atualizado e build funcionando | Reverter `vite.config.ts` |
| **AT-003** | Criar `tsr.config.json` | Arquivo criado no diretório raiz | Deletar `tsr.config.json` |
| **AT-004** | Criar setup do router (`client/src/router.tsx`) | Arquivo criado com a configuração inicial | Deletar `client/src/router.tsx` |
| **AT-005** | Atualizar `main.tsx` com `RouterProvider` | App renderiza sem erros com o novo provider | Reverter `main.tsx` para usar `<App />` |

### Fase 2: Migração da Estrutura Core

| ID | Tarefa | Validação | Rollback |
|---|---|---|---|
| **AT-006** | Criar layout raiz (`client/src/routes/__root.tsx`) | Layout base renderiza corretamente | Deletar `__root.tsx` |
| **AT-007** | Criar layout do dashboard (`client/src/routes/_dashboard.tsx`) | Layout do dashboard (sidebar, etc.) renderiza | Deletar `_dashboard.tsx` |
| **AT-008** | Implementar guards de autenticação e onboarding | Redirecionamentos funcionam como esperado | Remover lógica de `beforeLoad` dos layouts |

### Fase 3: Migração de Páginas e Componentes

Esta fase consiste em migrar todas as 21 páginas e 19 componentes. As tarefas podem ser paralelizadas.

| ID | Tarefa | Validação | Rollback |
|---|---|---|---|
| **AT-009** | Migrar `LandingPage` para `client/src/routes/index.tsx` | Página renderiza em `/` | Reverter para a rota em `App.tsx` |
| **AT-010** | Migrar `MentorshipStart` para `client/src/routes/comece-aqui.tsx` | Página renderiza em `/comece-aqui` | Reverter para a rota em `App.tsx` |
| ... | *(Tarefas AT-011 a AT-029 para as 19 páginas restantes)* | ... | ... |
| **AT-030** | Refatorar `DashboardLayout.tsx` para usar TanStack Router | Componente renderiza sem erros de roteamento | Reverter imports e hooks para `wouter` |
| **AT-031** | Refatorar `MenteeManagementView.tsx` | Componente renderiza sem erros de roteamento | Reverter imports e hooks para `wouter` |
| ... | *(Tarefas AT-032 a AT-048 para os 17 componentes restantes)* | ... | ... |

### Fase 4: Integração e Otimização com TanStack Query

| ID | Tarefa | Validação | Rollback |
|---|---|---|---|
| **AT-049** | Implementar `loader` em rotas com data fetching | Dados são pré-carregados e disponíveis no componente | Remover a função `loader` da rota |
| **AT-050** | Refatorar componentes para usar `useSuspenseQuery` | Componentes consomem dados do cache do loader | Voltar a usar `useQuery` com `enabled` |
| **AT-051** | Otimizar `QueryClient` com `staleTime` e `gcTime` | Configurações aplicadas no `router.tsx` | Remover `defaultOptions` do `QueryClient` |
| **AT-052** | Criar e implementar query keys padronizadas | Arquivo `queryKeys.ts` criado e usado nas queries | Substituir `queryKeys` por strings manuais |

### Fase 5: Limpeza e Validação Final

| ID | Tarefa | Validação | Rollback |
|---|---|---|---|
| **AT-053** | Remover `wouter` das dependências | `bun uninstall wouter` bem-sucedido | `bun add wouter` |
| **AT-054** | Deletar `client/src/App.tsx` | Projeto compila e funciona sem o arquivo | Restaurar `App.tsx` do git |
| **AT-055** | Executar checklist de validação final | Todos os itens do checklist de validação passam | Analisar e corrigir os pontos que falharam |

## ✅ Checklist de Validação Pós-Migração

- [ ] Todas as rotas estão acessíveis e renderizam corretamente.
- [ ] A navegação entre páginas via `<Link>` funciona.
- [ ] Parâmetros de rota (e.g., `/admin/call-preparation/:mentoradoId`) são lidos corretamente.
- [ ] Query params (e.g., na página de Leads) são lidos e atualizados corretamente.
- [ ] O redirecionamento de usuários não autenticados para a página de login está funcionando.
- [ ] O `onboarding guard` está ativo e redirecionando usuários não-admins que não completaram o onboarding.
- [ ] O lazy loading das páginas continua funcional.
- [ ] As queries do tRPC estão sendo executadas corretamente dentro dos `loaders` das rotas.
- [ ] As configurações de `staleTime` e `gcTime` estão otimizando o cache do TanStack Query.
- [ ] Os DevTools do TanStack Router estão ativos e funcionando em ambiente de desenvolvimento.
- [ ] O projeto compila sem erros de TypeScript (`bun run check`).
- [ ] Todos os testes unitários e de integração estão passando (`bun test`).
- [ ] O build de produção é gerado com sucesso (`bun run build`).
