# PLAN-consolidate-evolution-skills: Merge self-evolving-agent into evolution-core

> **Goal:** Eliminar a skill `self-evolving-agent` redundante, mantendo `evolution-core` como a única skill de aprendizado — aplicando KISS e YAGNI.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `self-evolving-agent` **NÃO é referenciado** por nenhum workflow — todos os 4 workflows usam `evolution-core` | 5/5 | grep across `.agent/workflows/` | **CRITICAL** — skill inteira é dead code |
| 2 | `memory_manager.py` do evolution-core (722L) é **superset** do self-evolving-agent (609L), com detecção de projeto local + CLI simplificado | 5/5 | Comparação de outlines e funções | Duplicação total |
| 3 | `evolution_engine.py` (mutações, inefficiency detection) depende de dados que o agente **não captura automaticamente** | 4/5 | Análise do código + fluxo real | Over-engineering |
| 4 | `context_preserver.py` resolve um problema que a **plataforma já resolve** (persistência de contexto entre sessões) | 4/5 | Análise arquitetural | YAGNI |
| 5 | `learning_analyzer.py` (cross-project aggregation) é coberto por `nightly_review.py` do evolution-core na parte prática | 4/5 | Comparação funcional | Duplicação parcial |
| 6 | `heartbeat.py` + `nightly_review.py` cobrem 100% das necessidades práticas de análise de padrões | 5/5 | Fluxo real de uso | evolution-core é suficiente |
| 7 | `config.yaml` e `init_db.sql` são redundantes — valores estão hardcoded nos scripts do evolution-core | 4/5 | Análise de assets | Complexidade desnecessária |

### Knowledge Gaps & Assumptions

- **Assumption:** Nenhum projeto externo ao neondash referencia `self-evolving-agent` (confirmado via grep)
- **Assumption:** A plataforma Gemini gerencia contexto de conversação automaticamente, tornando `context_preserver.py` desnecessário

---

## 1. User Review Required

> [!IMPORTANT]
> **Decisão: Deletar `self-evolving-agent` inteiramente em vez de merge parcial.**
>
> A análise KISS/YAGNI conclui que:
> - `evolution-core` já é a versão simplificada e funcional
> - Os features "únicos" do `self-evolving-agent` são ou over-engineered ou resolvem problemas que a plataforma já resolve
> - Fazer merge de código não-utilizado em um sistema funcional viola KISS
>
> **Nenhum código precisa ser migrado** — `evolution-core` já contém tudo que é utilizado.

---

## 2. Análise Comparativa Detalhada

### Scripts: Overlap Matrix

| Funcionalidade | self-evolving-agent | evolution-core | Veredicto |
|---|---|---|---|
| Session CRUD | `memory_manager.py` | `memory_manager.py` ✅ | **Duplicado** — evolution-core é superset |
| Observation storage | `memory_manager.py` | `memory_manager.py` ✅ | **Duplicado** |
| FTS5 search | `memory_manager.py` | `memory_manager.py` ✅ | **Duplicado** |
| Load historical context | `memory_manager.py` | `memory_manager.py` ✅ | **Duplicado** |
| Store learnings | `memory_manager.py` | `memory_manager.py` ✅ | **Duplicado** |
| CLI simplificado | ❌ | `memory_manager.py` ✅ | evolution-core MELHOR |
| Project root detection | ❌ | `memory_manager.py` ✅ | evolution-core MELHOR |
| Error monitoring | `evolution_engine.py` | `heartbeat.py` ✅ | **Coberto** de forma mais simples |
| Pattern analysis | `evolution_engine.py` | `heartbeat.py` + `nightly_review.py` ✅ | **Coberto** |
| Mutation system | `evolution_engine.py` | ❌ | **YAGNI** — nunca utilizado |
| Context flush | `context_preserver.py` | ❌ | **YAGNI** — plataforma resolve |
| Cross-project aggregation | `learning_analyzer.py` | `nightly_review.py` (subset prático) | **YAGNI** (versão complexa) |
| Daily review | ❌ | `nightly_review.py` ✅ | evolution-core EXCLUSIVO |

### Arquivos a DELETAR (self-evolving-agent/)

```
.agent/skills/self-evolving-agent/           # TODA a pasta
├── SKILL.md                                  # 315 linhas — substituído por evolution-core/SKILL.md
├── scripts/
│   ├── memory_manager.py                     # 609 linhas — duplicado inferior
│   ├── evolution_engine.py                   # 234 linhas — YAGNI (mutations não utilizadas)
│   ├── context_preserver.py                  # 331 linhas — YAGNI (plataforma resolve)
│   └── learning_analyzer.py                  # 395 linhas — coberto por nightly_review.py
├── assets/
│   ├── config.yaml                           # 77 linhas — valores hardcoded nos scripts
│   └── init_db.sql                           # 121 linhas — embedded em init_database()
└── references/
    ├── architecture.md                       # 287 linhas — documentação do skill deletado
    ├── storage_schema.md                     # doc redundante
    └── evolution_strategies.md               # doc redundante
```

**Total removido: ~2,370 linhas de código + ~24,710 linhas de docs = ~51KB**

### Arquivos a MANTER (evolution-core/ — sem alterações)

```
.agent/skills/evolution-core/                # MANTIDO intacto
├── SKILL.md                                  # 128 linhas — já é completo e objetivo
└── scripts/
    ├── memory_manager.py                     # 722 linhas — versão superior
    ├── heartbeat.py                          # 141 linhas — monitoring prático
    └── nightly_review.py                     # 199 linhas — aggregação prática
```

---

## 3. Atomic Implementation Tasks

### AT-001: Deletar skill self-evolving-agent
**Goal:** Remover completamente o diretório da skill não-utilizada
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Deletar o diretório `.agent/skills/self-evolving-agent/` inteiramente
  - **Comando:** `rm -rf .agent/skills/self-evolving-agent/`
  - **Validation:** `ls .agent/skills/self-evolving-agent/` deve retornar "No such file or directory"

**Rollback:** `git checkout -- .agent/skills/self-evolving-agent/`

---

### AT-002: Validar que nenhuma referência quebrou ⚡
**Goal:** Confirmar que nenhum workflow ou configuração referencia o skill deletado
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Grep por "self-evolving-agent" em todo o repositório
  - **Comando:** `grep -r "self-evolving-agent" . --include="*.md" --include="*.py" --include="*.ts" --include="*.yaml" --include="*.yml"`
  - **Validation:** 0 resultados
- [ ] ST-002.2: Verificar que evolution-core continua funcional
  - **Comando:** `python3 .agent/skills/evolution-core/scripts/memory_manager.py stats`
  - **Validation:** Executa sem erro

**Rollback:** `git checkout -- .agent/skills/self-evolving-agent/`

---

## 4. Verification Plan

### Automated Tests
- `grep -r "self-evolving-agent" .` — deve retornar 0 resultados
- `python3 .agent/skills/evolution-core/scripts/memory_manager.py stats` — deve executar com sucesso
- `python3 .agent/skills/evolution-core/scripts/heartbeat.py` — deve executar com sucesso

### Manual Verification
- Confirmar que a listagem de skills no GEMINI.md não menciona `self-evolving-agent`
- Confirmar que os 4 workflows (`/plan`, `/implement`, `/debug`, `/design`) continuam funcionando normalmente

---

## 5. Rollback Plan

```bash
# Se algo der errado, reverter com git:
git checkout -- .agent/skills/self-evolving-agent/
```
