# PLAN-evolution-core-local: Memória por Projeto + Alternativas a Hooks

> **Goal:** Modificar a skill `evolution-core` para usar paths locais por projeto e implementar alternativa funcional aos hooks.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Gemini Code Assist **não expõe** hooks post-tool-use nativamente | 5/5 | [Google Docs](https://developers.google.com/gemini-code-assist/docs/agent-mode) | Hooks atuais não funcionam |
| 2 | `watchfiles` (Python) é alternativa leve para monitorar mudanças de arquivos | 4/5 | [East Agile](https://www.eastagile.com/blogs/python-libraries-that-make-ai-agents-more-effective) | Pode substituir hooks |
| 3 | `inotifywait` (Linux) monitora eventos de filesystem em tempo real | 5/5 | [Unix StackExchange](https://unix.stackexchange.com/questions/323901/) | Alternativa bash |
| 4 | HookFlow VS Code Extension oferece hooks event-driven para AI agents | 3/5 | [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=sockethunter.ai-agent-hooks) | Requer instalação externa |
| 5 | `DEFAULT_DB_PATH` está hardcoded em 4 arquivos (15 ocorrências) | 5/5 | grep_search | Fácil de refatorar |

### Knowledge Gaps
- **Gap:** Como detectar automaticamente o diretório raiz do projeto de forma confiável
- **Assumption:** Usa-se `.git/` como marcador de raiz do projeto (fallback para `$PWD`)

### Edge Cases
1. Projeto sem `.git/` → usa diretório atual
2. Script executado de subdiretório → sobe até encontrar `.git/`
3. Múltiplos projetos abertos → cada um tem seu próprio DB
4. Migração de dados do DB global → não automatizada (documentar manual)
5. Permissões de escrita em `.agent/brain/` → falha graceful

---

## 1. User Review Required

> [!IMPORTANT]
> **Breaking Change:** O banco de dados muda de `~/.agent/brain/memory.db` para `{projeto}/.agent/brain/memory.db`.
> Dados existentes no banco global **não serão migrados automaticamente**.

> [!WARNING]
> **Hooks removidos:** A arquitetura de hooks (post_tool_use) será simplificada para CLI manual + opção de daemon watcher.

---

## 2. Proposed Changes

### Component: Path Resolution

#### [MODIFY] [memory_manager.py](file:///home/mauricio/neondash/.agent/skills/evolution-core/scripts/memory_manager.py)

- **Action:** Criar função `get_project_root()` que detecta raiz do projeto
- **Details:** 
  - Sobe diretórios buscando `.git/`
  - Fallback para variável de ambiente `EVOLUTION_PROJECT_ROOT`
  - Último fallback para `os.getcwd()`
- **Action:** Mudar `DEFAULT_DB_PATH` para usar `get_project_root() / ".agent" / "brain" / "memory.db"`

---

#### [MODIFY] [heartbeat.py](file:///home/mauricio/neondash/.agent/skills/evolution-core/scripts/heartbeat.py)

- **Action:** Importar e usar `get_project_root()` de `memory_manager`
- **Details:** Atualizar linhas 22-26 e 39-40

---

#### [MODIFY] [nightly_review.py](file:///home/mauricio/neondash/.agent/skills/evolution-core/scripts/nightly_review.py)

- **Action:** Importar e usar `get_project_root()` de `memory_manager`
- **Details:** Atualizar linhas 23, 29, 35

---

#### [MODIFY] [post_tool_use_hook.py](file:///home/mauricio/neondash/.agent/skills/evolution-core/scripts/post_tool_use_hook.py)

- **Action:** Importar e usar `get_project_root()` de `memory_manager`
- **Details:** Atualizar linhas 23, 32, 48, 51

---

### Component: Documentation

#### [MODIFY] [SKILL.md](file:///home/mauricio/neondash/.agent/skills/evolution-core/SKILL.md)

- **Action:** Atualizar documentação refletindo:
  - Novo path local: `{projeto}/.agent/brain/memory.db`
  - Remover menção a hooks automáticos
  - Documentar uso via CLI manual
  - Adicionar seção "Integração Manual com Workflows"

---

## 3. Atomic Implementation Tasks

### AT-001: Implementar `get_project_root()` ⚡
**Goal:** Criar função de detecção de raiz do projeto
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Criar função `get_project_root()` em `memory_manager.py`
  - **File:** `scripts/memory_manager.py`
  - **Validation:** `python3 -c "from memory_manager import get_project_root; print(get_project_root())"`
- [ ] ST-001.2: Atualizar `DEFAULT_DB_PATH` para usar a nova função
  - **File:** `scripts/memory_manager.py`
  - **Validation:** Verificar se path retornado termina em `.agent/brain/memory.db`
- [ ] ST-001.3: Adicionar suporte a variável de ambiente `EVOLUTION_PROJECT_ROOT`
  - **File:** `scripts/memory_manager.py`
  - **Validation:** `EVOLUTION_PROJECT_ROOT=/tmp python3 memory_manager.py init` cria DB em `/tmp/.agent/brain/`

**Rollback:** `git checkout scripts/memory_manager.py`

---

### AT-002: Atualizar scripts dependentes ⚡
**Goal:** Propagar uso de `get_project_root()` para todos os scripts
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Atualizar imports e paths em `heartbeat.py`
  - **File:** `scripts/heartbeat.py`
  - **Validation:** `python3 heartbeat.py` executa sem erros
- [ ] ST-002.2: Atualizar imports e paths em `nightly_review.py`
  - **File:** `scripts/nightly_review.py`
  - **Validation:** `python3 nightly_review.py --dry-run` executa sem erros
- [ ] ST-002.3: Atualizar imports e paths em `post_tool_use_hook.py`
  - **File:** `scripts/post_tool_use_hook.py`
  - **Validation:** `python3 -m py_compile post_tool_use_hook.py`

**Rollback:** `git checkout scripts/`

---

### AT-003: Testar fluxo completo
**Goal:** Validar que todo o sistema funciona com paths locais
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Inicializar banco local
  - **Validation:** `python3 memory_manager.py init` cria `neondash/.agent/brain/memory.db`
- [ ] ST-003.2: Verificar estatísticas
  - **Validation:** `python3 memory_manager.py stats` retorna JSON válido
- [ ] ST-003.3: Executar heartbeat
  - **Validation:** `python3 heartbeat.py` mostra output formatado corretamente
- [ ] ST-003.4: Verificar que DB global não foi afetado
  - **Validation:** `ls ~/.agent/brain/memory.db` ainda existe (não foi removido)

**Rollback:** N/A (testes apenas)

---

### AT-004: Atualizar documentação
**Goal:** SKILL.md reflete nova arquitetura
**Dependencies:** AT-003

#### Subtasks:
- [ ] ST-004.1: Atualizar seção "Estrutura do Banco de Dados"
  - **File:** `SKILL.md`
  - **Validation:** Path documentado como `.agent/brain/memory.db` (relativo)
- [ ] ST-004.2: Remover/simplificar seção de Hooks
  - **File:** `SKILL.md`
  - **Validation:** Não menciona hooks automáticos como funcionais
- [ ] ST-004.3: Adicionar seção "Uso Manual"
  - **File:** `SKILL.md`
  - **Validation:** Instruções claras de CLI

**Rollback:** `git checkout SKILL.md`

---

## 4. Verification Plan

### Automated Tests

```bash
# Diretório dos scripts
cd /home/mauricio/neondash/.agent/skills/evolution-core/scripts

# 1. Verificar sintaxe de todos os scripts
python3 -m py_compile memory_manager.py heartbeat.py nightly_review.py post_tool_use_hook.py && echo "✅ Syntax OK"

# 2. Testar detecção de raiz do projeto
python3 -c "from memory_manager import get_project_root; r = get_project_root(); print(f'Root: {r}'); assert 'neondash' in str(r)"

# 3. Inicializar banco local (deve criar em neondash/.agent/brain/)
python3 memory_manager.py init

# 4. Verificar que banco foi criado localmente
ls -la /home/mauricio/neondash/.agent/brain/memory.db && echo "✅ DB local criado"

# 5. Testar stats com banco local
python3 memory_manager.py stats

# 6. Testar heartbeat
python3 heartbeat.py

# 7. Testar nightly_review
python3 nightly_review.py --dry-run
```

### Manual Verification
- [ ] Abrir o projeto `neondash` no VS Code
- [ ] Verificar que `.agent/brain/memory.db` existe na raiz do projeto
- [ ] Verificar que `~/.agent/brain/memory.db` (global) não foi modificado

---

## 5. Rollback Plan

```bash
# Reverter todas as mudanças
cd /home/mauricio/neondash/.agent/skills/evolution-core
git checkout scripts/ SKILL.md

# Remover banco local (se quiser voltar ao global)
rm -rf /home/mauricio/neondash/.agent/brain/
```

---

## 6. Future Considerations (Não implementado agora)

> [!NOTE]
> **Alternativas a Hooks para automação futura:**
> 
> 1. **watchfiles daemon** - Background watcher que monitora mudanças
> 2. **Integração com git hooks** - pre-commit/post-commit
> 3. **HookFlow Extension** - Se usar VS Code com mais frequência
> 
> Estas opções podem ser implementadas em uma v2.1 se houver demanda.
