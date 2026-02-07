# 🧬 Evolution Core

---
name: evolution-core
description: "Motor de auto-evolução para agentes de IA. Memória persistente e aprendizado sistemático usando SQLite+FTS5 - zero dependências externas."
tags: [meta, ai, self-improvement, core, learning, memory]
version: 3.0.0
---

**"Eu aprendo, evoluo e antecipo suas necessidades."**

O **Evolution Core** transforma um agente de IA em um parceiro que aprende continuamente. Usa SQLite com FTS5 — **sem dependências externas**.

---

## ✨ Arquitetura

```
Session Start → load_context → Execute (capture observations) → Heartbeat → Session End → Nightly Review
```

| Script | Função |
|--------|--------|
| `memory_manager.py` | Core: sessões, observações, learnings, queries FTS5 |
| `heartbeat.py` | Análise periódica de padrões + error monitoring |
| `nightly_review.py` | Agregação diária de learnings |

---

## 🔄 Ativação Automática

| Trigger | Ação | Comando |
|---------|------|---------|
| **Início de sessão** | Carregar contexto histórico | `memory_manager.py load_context` |
| **Post-Error** | Capturar bug fix para aprendizado futuro | `memory_manager.py capture "Fixed: X" -t bug_fix` |
| **Fase de Planning** | Revisar decisões e resultados passados | `memory_manager.py load_context --task "descrição"` |
| **A cada 5 tarefas** | Checkpoint de progresso e padrões | `heartbeat.py` |
| **Fim de sessão** | Comprimir e salvar resumo | `memory_manager.py session end -s "resumo"` |

---

## 🚀 Quick Start

```bash
# Inicializar (auto-cria .agent/brain/memory.db)
python3 .agent/skills/evolution-core/scripts/memory_manager.py init
```

**Pronto!** Não precisa de workers, API keys ou dependências.

---

## 📦 Comandos CLI

### Sessão de Trabalho

```bash
# Iniciar sessão
python3 memory_manager.py session start -t "descrição da tarefa"

# Capturar observação (1 argumento!)
python3 memory_manager.py capture "o que aconteceu"

# Finalizar sessão
python3 memory_manager.py session end -s "resumo do trabalho"
```

### Consulta e Estatísticas

```bash
python3 memory_manager.py stats                                    # Ver estatísticas
python3 memory_manager.py load_context --project "$PWD" --task "X" # Contexto histórico
python3 memory_manager.py query --text "search term"               # Buscar sessões
```

### Análise Periódica

```bash
python3 heartbeat.py                   # Health check + padrões
python3 nightly_review.py              # Revisar último dia
python3 nightly_review.py --days 7     # Últimos 7 dias
python3 nightly_review.py --dry-run    # Preview sem salvar
```

---

## 💾 Estrutura do Banco

> **Local:** `{projeto}/.agent/brain/memory.db`

| Tabela | Conteúdo |
|--------|----------|
| `sessions` | Metadados de sessões (projeto, tarefa, score, resumo) |
| `observations` | Uso de ferramentas (tool, input, output, success) |
| `mutations` | Sugestões de melhoria |
| `learnings` | Padrões aprendidos (tipo, descrição, frequência, confiança) |
| `context_snapshots` | Snapshots de contexto crítico |
| `*_fts` | Tabelas FTS5 para busca semântica |

**Detecção de projeto:** `.git/` → `EVOLUTION_PROJECT_ROOT` → `pwd`

---

## 🔧 Integração com Workflows

| Workflow | Hook | Comando |
|----------|------|---------|
| `/plan` | load_context | `python3 memory_manager.py load_context --project "$PWD"` |
| `/implement` | session + heartbeat | `session start` → `capture` por tarefa → `heartbeat` a cada 5 |
| `/debug` | capture bug_fix | `python3 memory_manager.py capture "Fixed: X" -t bug_fix` |
| `/design` | capture pattern | `python3 memory_manager.py capture "Implemented: Y" -t design_pattern` |

---

## 📁 Estrutura

```
evolution-core/
├── SKILL.md                      # Este arquivo
└── scripts/
    ├── memory_manager.py         # Core: SQLite + FTS5 (722 linhas)
    ├── heartbeat.py              # Health check + pattern analysis
    └── nightly_review.py         # Agregação diária de learnings
```

---

## 🛡️ Segurança

- **Sem chamadas externas**: Tudo local, zero network
- **Fail-safe**: Todos os hooks falham silenciosamente (try/except)
- **Zero dependências**: Apenas Python stdlib (sqlite3, json, argparse)
- **Auto-init**: DB criado automaticamente na primeira operação
- **Truncamento**: Input/output limitados a 10KB para evitar bloat
