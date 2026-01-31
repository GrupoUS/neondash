# Task: Unificação de Turmas (Neon Estrutura/Escala -> Neon)

## Phase 1: Database & Schema

- [x] AT-001: Criar Migração para Unificar Turma no Banco de Dados
  - [x] Alterar enum `turma` para apenas "neon"
  - [x] Atualizar dados existentes (neon_estrutura/escala -> neon)
  - [x] Executar migrations

## Phase 2: Backend Logic

- [x] AT-002: Remover Lógica de Turmas no Cálculo de Gamificação
  - [x] Remover filtros condicionais em `gamificacao.ts`
  - [x] Atualizar testes unitários (`gamificacao.test.ts`)
- [x] AT-003: Atualizar Routers tRPC
  - [x] Remover validação de inputs legados em `mentoradosRouter.ts`
  - [x] Simplificar "comparativeStats" para query única
- [x] AT-004: Atualizar Serviços Auxiliares
  - [x] Remover lógica de email formatada em `emailService.ts`
  - [x] Atualizar scripts de seed (`seed-playbook.ts`, `seed-dezembro.mjs`)

## Phase 3: Frontend Integration

- [x] AT-005: Unificar Página Home
  - [x] Verificar fusão de dados em `Home.tsx`
  - [x] Confirmar remoção de abas de turma
- [x] AT-006: Atualizar RankingView
  - [x] Remover filtros visuais redundantes em `RankingView.tsx`
  - [x] Simplificar exibição de badges ("Neon")

## Phase 4: Validation

- [x] AT-007: Validar Types & Build
  - [x] `bun run check` (TypeScript)
  - [x] `bun run build` (Vite + Server)
- [x] AT-008: Limpeza Final
  - [x] Remover código morto identificado
