# PLAN-codebase-cleanup: Organização e Limpeza do Codebase

> **Goal:** Limpar e organizar o projeto neondash para que a estrutura `client/server/shared` seja soberana, removendo arquivos desnecessários, duplicados, e consolidando documentação.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `clerk-react/` é um projeto standalone de demo com seu próprio `package.json`, não integrado ao projeto principal | 5/5 | Análise direta de `clerk-react/package.json` | Alto - pasta inteira pode ser removida |
| 2 | `components/kokonutui/smooth-drawer.tsx` não possui nenhuma referência no codebase | 5/5 | grep_search por "smooth-drawer" e "kokonutui" | Alto - arquivo não utilizado |
| 3 | `style/` contém mockups de design e análise, não é utilizado pelo código | 5/5 | grep_search + list_dir | Médio - pode ser movido para docs |
| 4 | `prompts/` contém prompts de migração antigos | 5/5 | list_dir | Baixo - documentação histórica |
| 5 | Arquivos de teste na raiz (`test-browser.js`, `test-llm.ts`, `test-llm-integration.ts`) não têm referências | 5/5 | grep_search | Médio - podem ser removidos ou movidos |
| 6 | `check_output.txt` é output de debug temporário | 5/5 | Nome do arquivo | Alto - deve ser removido |
| 7 | Múltiplos arquivos de doc na raiz (`crm-leads-prompt.md`, `design-compliance-check.md`, `ideas.md`, `todo.md`) | 5/5 | grep_search | Médio - devem ser consolidados em docs/ |
| 8 | Pastas de AI config múltiplas (`.claude/`, `.cursor/`, `.opencode/`, `.kilocode/`, `.serena/`, `.agent/`) são válidas para multi-agent support | 4/5 | list_dir | Baixo - manter para suporte multi-agente |
| 9 | Estrutura `client/server/shared` está correta e bem organizada | 5/5 | list_dir de cada pasta | N/A - confirma design atual |
| 10 | `patches/` contém patch para wouter usado pelo package.json | 5/5 | package.json "patchedDependencies" | Alto - DEVE ser mantido |
| 11 | `scripts/` contém scripts de utilidade legítimos | 4/5 | list_dir | Baixo - manter |
| 12 | `drizzle/` contém schema e migrations do banco | 5/5 | Estrutura padrão | N/A - manter |

### Knowledge Gaps & Assumptions

- **Gap:** Não foi verificado se o conteúdo de `style/` tem valor histórico para o design
- **Assumption:** Assume-se que as pastas de AI config são usadas ativamente pelo desenvolvedor para diferentes editores/agentes

### Edge Cases

1. **Imports quebrados:** Alguns arquivos podem ter imports relativos que dependem da estrutura atual
2. **Git history:** Mover arquivos em vez de deletar preserva histórico
3. **Editor config:** Algumas configurações de editor podem referenciar caminhos específicos
4. **CI/CD:** Verificar se .github/workflows usa algum arquivo que será movido
5. **Task.md:** O arquivo `task.md` na raiz é usado pelo sistema agentic e deve permanecer

---

## 1. User Review Required

> [!IMPORTANT]
> **Decisão sobre preservação de conteúdo:**
> Os arquivos em `clerk-react/` serão **permanentemente deletados**. Se houver código de referência importante, favor indicar antes da execução.

> [!WARNING]
> **Arquivos de teste na raiz:**
> `test-browser.js`, `test-llm.ts`, `test-llm-integration.ts` serão removidos. Se algum tiver utilidade futura, indique para mover para `scripts/` em vez de deletar.

---

## 2. Proposed Changes

### Phase 1: Cleanup - Remoção de Arquivos Não Utilizados

#### [DELETE] clerk-react/
Projeto demo standalone não integrado. Contém:
- Próprio `package.json`, `bun.lock`, `tsconfig.json`
- Próprio `src/` com código não utilizado
- Próprio `vite.config.ts`

#### [DELETE] components/
Contém apenas `kokonutui/smooth-drawer.tsx` sem nenhum import no projeto.

#### [DELETE] test-browser.js
Arquivo de teste órfão na raiz sem referências.

#### [DELETE] test-llm.ts
Duplica funcionalidade de `scripts/test-llm.ts`.

#### [DELETE] check_output.txt
Arquivo de debug temporário.

---

### Phase 2: Consolidação de Documentação

#### [MOVE] style/ → docs/archive/design-assets/
Pasta contém mockups e análises de design que são documentação histórica.

#### [MOVE] prompts/ → docs/archive/prompts/
Contém prompts de migração antigos - documentação histórica.

#### [MOVE] crm-leads-prompt.md → docs/archive/
Prompt de desenvolvimento do CRM - documentação histórica.

#### [MOVE] design-compliance-check.md → docs/archive/
Documento de verificação de design - documentação histórica.

#### [MOVE] ideas.md → docs/
Ideias gerais do projeto - documentação ativa.

#### [MOVE] todo.md → docs/
Lista de tarefas gerais - documentação ativa.

---

### Phase 3: Consolidação de Scripts

#### [MOVE] test-llm-integration.ts → scripts/
Script de integração LLM pertence à pasta de scripts.

---

### Phase 4: Manutenção

#### [MODIFY] [.gitignore](file:///Users/mauricio/Projetos/neondash/.gitignore)
- Adicionar `check_output.txt` para evitar commits futuros de arquivos de debug

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Cada tarefa DEVE ser validada antes de prosseguir para a próxima.

### AT-001: Criar Branch de Backup
**Goal:** Garantir rollback seguro
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Criar branch de backup
  - **Command:** `git checkout -b backup/pre-cleanup`
  - **Validation:** `git branch --show-current` retorna `backup/pre-cleanup`
- [ ] ST-001.2: Voltar para branch principal
  - **Command:** `git checkout main` (ou branch atual)
  - **Validation:** `git branch --show-current` confirma branch correta

**Rollback:** N/A - é a própria preparação de rollback

---

### AT-002: Remover Arquivos Não Utilizados ⚡
**Goal:** Limpar arquivos sem uso no codebase
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Remover pasta `clerk-react/`
  - **Command:** `rm -rf clerk-react/`
  - **Validation:** `ls -la clerk-react/` retorna "No such file or directory"
- [ ] ST-002.2: Remover pasta `components/`
  - **Command:** `rm -rf components/`
  - **Validation:** `ls -la components/` retorna "No such file or directory"
- [ ] ST-002.3: Remover `test-browser.js`
  - **Command:** `rm test-browser.js`
  - **Validation:** `ls test-browser.js` retorna "No such file or directory"
- [ ] ST-002.4: Remover `test-llm.ts`
  - **Command:** `rm test-llm.ts`
  - **Validation:** `ls test-llm.ts` retorna "No such file or directory"
- [ ] ST-002.5: Remover `check_output.txt`
  - **Command:** `rm check_output.txt`
  - **Validation:** `ls check_output.txt` retorna "No such file or directory"

**Rollback:** `git checkout backup/pre-cleanup -- clerk-react/ components/ test-browser.js test-llm.ts check_output.txt`

---

### AT-003: Consolidar Documentação ⚡
**Goal:** Mover documentação dispersa para `docs/`
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-003.1: Criar estrutura de arquivamento
  - **Command:** `mkdir -p docs/archive/prompts`
  - **Validation:** `ls -la docs/archive/prompts/` retorna diretório vazio
- [ ] ST-003.2: Mover `style/` para docs
  - **Command:** `mv style/ docs/archive/design-assets/`
  - **Validation:** `ls -la docs/archive/design-assets/` mostra conteúdo de style
- [ ] ST-003.3: Mover arquivos de `prompts/`
  - **Command:** `mv prompts/* docs/archive/prompts/ && rmdir prompts/`
  - **Validation:** `ls docs/archive/prompts/` mostra arquivos movidos
- [ ] ST-003.4: Mover `crm-leads-prompt.md`
  - **Command:** `mv crm-leads-prompt.md docs/archive/`
  - **Validation:** `ls docs/archive/crm-leads-prompt.md` existe
- [ ] ST-003.5: Mover `design-compliance-check.md`
  - **Command:** `mv design-compliance-check.md docs/archive/`
  - **Validation:** `ls docs/archive/design-compliance-check.md` existe
- [ ] ST-003.6: Mover `ideas.md`
  - **Command:** `mv ideas.md docs/`
  - **Validation:** `ls docs/ideas.md` existe
- [ ] ST-003.7: Mover `todo.md`
  - **Command:** `mv todo.md docs/`
  - **Validation:** `ls docs/todo.md` existe

**Rollback:** `git checkout backup/pre-cleanup -- style/ prompts/ crm-leads-prompt.md design-compliance-check.md ideas.md todo.md`

---

### AT-004: Consolidar Scripts ⚡
**Goal:** Mover scripts dispersos para `scripts/`
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-004.1: Mover `test-llm-integration.ts`
  - **Command:** `mv test-llm-integration.ts scripts/`
  - **Validation:** `ls scripts/test-llm-integration.ts` existe

**Rollback:** `git checkout backup/pre-cleanup -- test-llm-integration.ts`

---

### AT-005: Validar Integridade do Sistema
**Goal:** Confirmar que o sistema funciona após as mudanças
**Dependencies:** AT-002, AT-003, AT-004

#### Subtasks:
- [ ] ST-005.1: Verificar TypeScript
  - **Command:** `bun run check`
  - **Validation:** Retorna 0 errors
- [ ] ST-005.2: Verificar Lint
  - **Command:** `bun run lint:check`
  - **Validation:** Retorna sem erros críticos
- [ ] ST-005.3: Rodar testes
  - **Command:** `bun test`
  - **Validation:** Todos os testes passam
- [ ] ST-005.4: Verificar servidor de desenvolvimento
  - **Command:** `bun dev` (iniciar e verificar se responde)
  - **Validation:** Servidor inicia sem erros, acessível em localhost

**Rollback:** `git checkout backup/pre-cleanup`

---

### AT-006: Atualizar Configurações
**Goal:** Atualizar arquivos de configuração para refletir mudanças
**Dependencies:** AT-005

#### Subtasks:
- [ ] ST-006.1: Atualizar `.gitignore`
  - **File:** `.gitignore`
  - **Action:** Adicionar `check_output.txt` e outros arquivos temporários
  - **Validation:** `grep check_output.txt .gitignore` encontra a linha
- [ ] ST-006.2: Commit das mudanças
  - **Command:** `git add -A && git commit -m "chore: organize codebase structure - cleanup unused files and consolidate docs"`
  - **Validation:** Commit criado com sucesso

**Rollback:** `git reset HEAD~1` e então `git checkout backup/pre-cleanup`

---

## 4. Verification Plan

### Automated Tests
```bash
# TypeScript validation
bun run check

# Code linting
bun run lint:check

# Unit tests
bun test
```

### Manual Verification
1. **Verificar servidor:** Executar `bun dev` e confirmar que:
   - Servidor inicia sem erros
   - Página carrega em `http://localhost:3000`
   - Nenhum erro 404 de imports quebrados no console

2. **Verificar estrutura limpa:**
   ```bash
   ls -la | grep -E "(clerk|components|style|prompts|ideas|todo|test-browser|test-llm|check_output)"
   ```
   Deve retornar vazio (nenhum desses arquivos/pastas na raiz)

3. **Verificar consolidação:**
   ```bash
   ls docs/archive/
   ls docs/ideas.md docs/todo.md
   ls scripts/test-llm-integration.ts
   ```
   Todos devem existir

---

## 5. Rollback Plan

### Rollback Completo
```bash
# Voltar para branch de backup
git checkout backup/pre-cleanup

# OU, se já commitou, reverter
git revert HEAD

# OU, reset hard para estado anterior
git reset --hard backup/pre-cleanup
```

### Rollback Parcial (por tarefa)
Cada AT-00X possui seu próprio comando de rollback na seção "Rollback" da tarefa.

---

## 6. Estrutura Final Esperada

```
neondash/
├── .agent/                 # AI config (Gemini) - MANTIDO
├── .claude/                # AI config (Claude) - MANTIDO
├── .cursor/                # AI config (Cursor) - MANTIDO
├── .github/                # GitHub workflows - MANTIDO
├── .kilocode/              # AI config (Kilocode) - MANTIDO
├── .opencode/              # AI config (OpenCode) - MANTIDO
├── .serena/                # AI config (Serena) - MANTIDO
├── .vscode/                # VS Code config - MANTIDO
├── client/                 # Frontend React - MANTIDO
│   └── src/
│       ├── components/     # UI components
│       ├── hooks/          # Custom hooks
│       ├── lib/            # Utilities
│       └── pages/          # Route pages
├── docs/                   # Documentação - CONSOLIDADO
│   ├── archive/            # Docs arquivados
│   │   ├── design-assets/  # (ex-style/)
│   │   ├── prompts/        # (ex-prompts/)
│   │   ├── crm-leads-prompt.md
│   │   └── design-compliance-check.md
│   ├── ideas.md            # (movido da raiz)
│   ├── todo.md             # (movido da raiz)
│   └── PLAN-*.md           # Planos de implementação
├── drizzle/                # Database schema - MANTIDO
├── patches/                # Dependency patches - MANTIDO
├── scripts/                # Utility scripts - EXPANDIDO
│   ├── debug-llm.ts
│   ├── migrate-whatsapp-provider.ts
│   ├── test-llm.ts
│   └── test-llm-integration.ts  # (movido da raiz)
├── server/                 # Backend Express/tRPC - MANTIDO
│   ├── _core/
│   ├── routers/
│   ├── services/
│   └── *.ts
├── shared/                 # Shared types/utils - MANTIDO
├── AGENTS.md              # AI agent rules
├── GEMINI.md              # Gemini rules
├── README.md              # Project readme
├── package.json           # Dependencies
├── task.md                # Agentic task tracking - MANTIDO
└── [configs]              # Various config files
```

---

## 7. Resumo de Mudanças

| Ação | Antes | Depois |
|------|-------|--------|
| DELETE | `clerk-react/` (16 arquivos) | - |
| DELETE | `components/` (1 arquivo) | - |
| DELETE | `test-browser.js` | - |
| DELETE | `test-llm.ts` | - |
| DELETE | `check_output.txt` | - |
| MOVE | `style/` | `docs/archive/design-assets/` |
| MOVE | `prompts/` | `docs/archive/prompts/` |
| MOVE | `crm-leads-prompt.md` | `docs/archive/` |
| MOVE | `design-compliance-check.md` | `docs/archive/` |
| MOVE | `ideas.md` | `docs/` |
| MOVE | `todo.md` | `docs/` |
| MOVE | `test-llm-integration.ts` | `scripts/` |

**Total:** 5 pastas/arquivos deletados, 7 movidos, ~20+ arquivos afetados
