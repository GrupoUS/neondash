# 🧬 Evolution Core

**Transforme seu agente de IA em um parceiro que aprende, evolui e antecipa suas necessidades.**

---

## 📖 Visão Geral

**Evolution Core** é uma meta-skill de próxima geração para agentes de IA que combina três arquiteturas de ponta:

*   **Memória Persistente** (inspirada em `claude-mem`): Nunca esqueça uma lição ou contexto.
*   **Aprendizado Sistemático** (inspirada em `capability-evolver`): Melhore automaticamente a partir da experiência.
*   **Comportamento Proativo** (inspirada em `proactive-agent`): Crie valor sem esperar por comandos.

O resultado é um agente que não apenas executa tarefas, mas se torna **mais inteligente e útil a cada interação**.

## ✨ Recursos Principais

| Recurso | Descrição |
| :--- | :--- |
| **🧠 Memória Persistente** | Sistema híbrido (SQLite + ChromaDB) para armazenar e buscar todas as interações. |
| **📊 Busca Semântica** | Encontre informações relevantes usando linguagem natural, não apenas palavras-chave. |
| **🔄 Aprendizado Contínuo** | Protocolo de Ascensão (tempo real) + Loop Composto (revisão noturna) para evolução constante. |
| **💡 Proatividade** | Sistema de Heartbeat e Prompt Reverso para sugerir ações e antecipar necessidades. |
| **🛡️ Segurança Integrada** | Protocolos de segurança para evitar injeção de prompt e ações destrutivas. |
| **⚙️ Fácil Configuração** | Scripts de instalação e templates prontos para uso. |

## 🚀 Quick Start

1.  **Instalar**: `bash scripts/install.sh`
2.  **Copiar Ativos**: `cp -r assets/* /seu/workspace/`
3.  **Configurar Hooks**: Adicione os hooks ao seu arquivo de configuração do agente.
4.  **Iniciar Worker**: `bash scripts/run_worker.sh`
5.  **Configurar Cron**: `(crontab -l ; echo "30 22 * * * python3 /path/to/scripts/nightly_review.py") | crontab -`

Consulte o **[Guia de Implementação Completo](IMPLEMENTATION_GUIDE.md)** para instruções detalhadas.

## 📁 Estrutura do Projeto

```
evolution-core/
├── SKILL.md                    # Documentação principal da skill
├── README.md                   # Este arquivo
├── IMPLEMENTATION_GUIDE.md     # Guia passo a passo de implementação
├── scripts/
│   ├── install.sh              # Script de instalação de dependências
│   ├── worker.py               # Worker de memória (FastAPI)
│   ├── run_worker.sh           # Script para iniciar o worker
│   ├── post_tool_use_hook.py   # Hook para captura de observações
│   ├── heartbeat.py            # Script de heartbeat (auto-melhoria)
│   └── nightly_review.py       # Script de revisão noturna (Loop Composto)
├── assets/
│   ├── AGENTS.md               # Template de diretrizes operacionais
│   ├── MEMORY.md               # Template de memória curada
│   ├── SOUL.md                 # Template de identidade do agente
│   ├── USER.md                 # Template de contexto do usuário
│   ├── HEARTBEAT.md            # Template de checklist de heartbeat
│   └── ONBOARDING.md           # Template de onboarding
└── docs/
    └── ARCHITECTURE.md         # Documentação detalhada da arquitetura
```

## 🧠 Como Funciona

**Evolution Core** opera em um ciclo contínuo de três fases:

1.  **Captura**: Hooks automáticos capturam cada ação e resultado do agente.
2.  **Aprendizado**: Scripts de análise (tempo real e batch) extraem lições e padrões.
3.  **Melhoria**: O conhecimento acumulado é usado para guiar ações futuras e gerar sugestões proativas.

Veja o diagrama de arquitetura completo no **[SKILL.md](SKILL.md)**.

## 🛠️ Tecnologias Utilizadas

*   **Python 3.8+**: Linguagem principal para os scripts.
*   **FastAPI**: Framework web para o worker de memória.
*   **SQLite**: Banco de dados relacional para metadados e logs.
*   **ChromaDB**: Banco de dados vetorial para busca semântica.
*   **LLM API** (Perplexity, OpenAI, Gemini): Para geração de resumos e sínteses.

## 📜 Licença

Distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! Se você tiver ideias para melhorar esta skill, por favor, abra uma issue ou envie um pull request.

## 📧 Suporte

Para dúvidas, sugestões ou relatar problemas, entre em contato através do repositório do projeto.

---

**Construído com ❤️ por Manus AI**
