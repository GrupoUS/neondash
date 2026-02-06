# PLAN-evolution-automation: Automatizar Evolution Core

> **Goal:** Fazer a skill evolution-core funcionar automaticamente sem intervenção humana

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Nenhum hook automático no Gemini Antigravity | 5/5 | Research anterior | Critical |
| 2 | CLI atual requer muitos argumentos | 5/5 | memory_manager.py | High |
| 3 | Workflows `/plan` e `/implement` já mencionam integration | 4/5 | Código | Medium |
| 4 | GEMINI.md rules são seguidas pelo agente | 5/5 | Comportamento observado | High |
| 5 | SQLite+FTS5 funciona corretamente | 5/5 | Testes anteriores | Medium |

### Knowledge Gaps
- **Gap:** Não sabemos se o agente vai executar comandos inline automaticamente
- **Assumption:** Regras no GEMINI.md serão seguidas

---

## 1. User Review Required

> [!IMPORTANT]
> **Esta implementação depende de regras no GEMINI.md que o agente deve seguir.**
> Se o agente não executar os comandos, a automação não funcionará.
> Alternativa: usar `watchfiles` como daemon em background (mais complexo).

---

## 2. Proposed Changes

### Phase 1: Simplificar CLI

#### [MODIFY] [memory_manager.py](file:///home/mauricio/neondash/.agent/skills/evolution-core/scripts/memory_manager.py)
- **Action:** Adicionar comandos simplificados `session` e `capture`
- **Details:** 
  - `session start --task "descrição"` - Inicia sessão e salva ID em `.agent/brain/.current_session`
  - `session end --summary "resumo"` - Finaliza sessão
  - `capture "descrição"` - Captura observação na sessão ativa (1 argumento apenas!)

---

### Phase 2: Atualizar GEMINI.md

#### [MODIFY] [GEMINI.md](file:///home/mauricio/neondash/GEMINI.md)
- **Action:** Adicionar regras mandatórias de memory capture
- **Details:** 
  ```yaml
  ## 🧠 Evolution Memory Protocol (AUTOMATIC)
  
  | Trigger | Comando |
  |---------|---------|
  | Início de task | `python3 .agent/skills/evolution-core/scripts/memory_manager.py session start --task "$TASK"` |
  | Cada 5 tool calls | `python3 .agent/skills/evolution-core/scripts/heartbeat.py` |
  | Fim de task (notify_user) | `python3 .agent/skills/evolution-core/scripts/memory_manager.py session end --summary "$SUMMARY"` |
  ```

---

### Phase 3: Atualizar SKILL.md

#### [MODIFY] [SKILL.md](file:///home/mauricio/neondash/.agent/skills/evolution-core/SKILL.md)
- **Action:** Documentar os novos comandos e fluxo automático

---

## 3. Atomic Implementation Tasks

### AT-001: Adicionar comandos simplificados ao CLI
**Goal:** Tornar a captura de memória trivial (1 comando, 1 argumento)

#### Subtasks:
- [ ] ST-001.1: Adicionar `session start` command
  - **File:** `memory_manager.py`
  - **Validation:** `python3 memory_manager.py session start --task "test" && cat .agent/brain/.current_session`
- [ ] ST-001.2: Adicionar `session end` command  
  - **File:** `memory_manager.py`
  - **Validation:** `python3 memory_manager.py session end --summary "test complete"`
- [ ] ST-001.3: Adicionar `capture` command
  - **File:** `memory_manager.py`
  - **Validation:** `python3 memory_manager.py capture "test observation"`

**Rollback:** `git checkout memory_manager.py`

---

### AT-002: Atualizar GEMINI.md com regras de automação
**Goal:** Fazer o agente executar os comandos automaticamente
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Criar seção "Evolution Memory Protocol" no GEMINI.md
  - **File:** `GEMINI.md`
  - **Validation:** Buscar "Evolution Memory Protocol" no arquivo
- [ ] ST-002.2: Adicionar regras mandatórias com triggers
  - **File:** `GEMINI.md`  
  - **Validation:** Verificar tabela de triggers presente

**Rollback:** Remover seção adicionada

---

### AT-003: Testar fluxo completo end-to-end
**Goal:** Validar que tudo funciona junto
**Dependencies:** AT-001, AT-002

#### Subtasks:
- [ ] ST-003.1: Iniciar sessão de teste
  - **Validation:** Session ID criado em `.agent/brain/.current_session`
- [ ] ST-003.2: Executar múltiplos captures
  - **Validation:** `python3 memory_manager.py stats` mostra observações
- [ ] ST-003.3: Executar heartbeat
  - **Validation:** Output sem erros, mostra dados
- [ ] ST-003.4: Finalizar sessão
  - **Validation:** Sessão aparece como finalizada no DB

**Rollback:** N/A (apenas leitura)

---

### AT-004: Atualizar documentação
**Goal:** Documentar o novo fluxo automático
**Dependencies:** AT-003

#### Subtasks:
- [ ] ST-004.1: Atualizar SKILL.md com novos comandos
  - **File:** `SKILL.md`
  - **Validation:** Comandos documentados

**Rollback:** `git checkout SKILL.md`

---

## 4. Verification Plan

### Automated Tests
```bash
# Syntax check
python3 -m py_compile memory_manager.py

# Functional tests
python3 memory_manager.py session start --task "verificação automática"
python3 memory_manager.py capture "primeiro teste"
python3 memory_manager.py capture "segundo teste"
python3 memory_manager.py stats  # Deve mostrar 2+ observações
python3 heartbeat.py             # Deve rodar sem erros
python3 memory_manager.py session end --summary "teste concluído"
```

### Manual Verification
1. Verificar arquivo `.agent/brain/.current_session` criado
2. Verificar `memory.db` tem dados via `sqlite3 .agent/brain/memory.db "SELECT COUNT(*) FROM observations"`
3. Verificar GEMINI.md contém as novas regras

---

## 5. Rollback Plan

```bash
cd /home/mauricio/neondash
git checkout .agent/skills/evolution-core/scripts/memory_manager.py
git checkout .agent/skills/evolution-core/SKILL.md
git checkout GEMINI.md
```
