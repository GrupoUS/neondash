# 🧬 Evolution Core

---
name: evolution-core
description: "Motor de auto-evolução para agentes de IA. Memória persistente e aprendizado sistemático usando SQLite+FTS5 - zero dependências externas."
tags: [meta, ai, self-improvement, core, learning, memory]
version: 2.1.0
---

**"Eu aprendo, evoluo e antecipo suas necessidades."**

O **Evolution Core** transforma um agente de IA em um parceiro que aprende continuamente. Usa SQLite com FTS5 - **sem dependências externas**.

## ✨ Arquitetura

```
Tool Usage → memory_manager.py → SQLite+FTS5 → Pattern Analysis → Learnings
```

| Script | Função |
|--------|--------|
| `memory_manager.py` | Core: armazena sessões, observações, queries |
| `heartbeat.py` | Análise periódica de padrões |
| `nightly_review.py` | Agregação de learnings |

---

## 🚀 Quick Start

```bash
# Inicializar (auto-cria .agent/brain/memory.db)
python3 .agent/skills/evolution-core/scripts/memory_manager.py init
```

**Pronto!** Não precisa de workers, API keys ou dependências.

---

## 📦 Comandos CLI

### Simplified (NOVO v2.1)

```bash
# Iniciar sessão de trabalho
python3 memory_manager.py session start -t "descrição da tarefa"

# Capturar qualquer observação (1 argumento!)
python3 memory_manager.py capture "o que aconteceu"

# Finalizar sessão
python3 memory_manager.py session end -s "resumo do trabalho"
```

### Core Commands

```bash
# Ver estatísticas
python3 memory_manager.py stats

# Buscar contexto histórico
python3 memory_manager.py load_context --project "$PWD" --task "descrição"

# Buscar sessões similares
python3 memory_manager.py query --text "search term"
```

### Heartbeat

```bash
python3 heartbeat.py
# Output: [Memória] Sessões: 15 | Observações: 234 | Learnings: 8
```

### Nightly Review

```bash
python3 nightly_review.py          # Revisar último dia
python3 nightly_review.py --days 7 # Últimos 7 dias
python3 nightly_review.py --dry-run # Preview
```

---

## 💾 Estrutura do Banco

> **Local:** `{projeto}/.agent/brain/memory.db`

```
sessions          → Metadados de sessões
observations      → Uso de ferramentas
mutations         → Sugestões de melhoria
learnings         → Padrões aprendidos
*_fts             → Tabelas FTS5 para busca
```

**Detecção de projeto:** `.git/` → `EVOLUTION_PROJECT_ROOT` → `pwd`

---

## 🔧 Integração com Workflows

| Workflow | Hook | Comando |
|----------|------|---------|
| `/plan` | load_context | `python3 memory_manager.py load_context --project "$PWD"` |
| `/debug` | capture bug_fix | `python3 memory_manager.py capture "Fixed: X" -t bug_fix` |
| `/design` | capture pattern | `python3 memory_manager.py capture "Implemented: Y" -t design_pattern` |

---

## 📁 Estrutura

```
evolution-core/
├── SKILL.md                      # Este arquivo
└── scripts/
    ├── memory_manager.py         # Core: SQLite + FTS5
    ├── heartbeat.py              # Self-check periódico
    └── nightly_review.py         # Agregação de learnings
```

---

## 🛡️ Segurança

- **Sem chamadas externas**: Tudo local
- **Fail-safe**: Hooks falham silenciosamente
- **Zero dependências**: Apenas Python stdlib
