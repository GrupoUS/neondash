# 🧬 Evolution Core

**Transforme seu agente de IA em um parceiro que aprende, evolui e antecipa suas necessidades.**

---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/)

**Evolution Core** é uma meta-skill de próxima geração para agentes de IA que unifica três arquiteturas de ponta em um sistema coeso e pronto para produção. Ele foi projetado para dar ao seu agente uma memória persistente, a capacidade de aprender sistematicamente e o poder de agir proativamente.

## ✨ Filosofia

O agente de IA moderno não deve ser uma ferramenta passiva. Deve ser um parceiro ativo que cresce com você. Esta skill é construída sobre três pilares fundamentais:

1.  **Nunca Esqueça**: Cada interação, sucesso ou falha é capturada e armazenada para referência futura.
2.  **Aprenda Continuamente**: A informação armazenada é processada para extrair lições, corrigir erros e melhorar o comportamento.
3.  **Aja Proativamente**: O conhecimento acumulado é usado para antecipar necessidades e sugerir ações de alto valor.

## 🚀 Recursos Principais

| Recurso | Descrição |
| :--- | :--- |
| **🧠 Memória Persistente** | Sistema híbrido (SQLite para metadados + ChromaDB para vetores) que armazena todas as interações. |
| **📊 Busca Semântica** | Encontre informações relevantes usando linguagem natural, não apenas palavras-chave. |
| **🔄 Aprendizado Contínuo** | Protocolo de Ascensão (correção em tempo real) e Loop Composto (revisão noturna) para evolução constante. |
| **💡 Proatividade Inteligente** | Sistema de Heartbeat e Prompt Reverso para sugerir ações e antecipar necessidades do usuário. |
| **🛡️ Segurança por Design** | Protocolos integrados para evitar injeção de prompt e ações destrutivas. |
| **⚙️ Instalação Simplificada** | Scripts de instalação e templates prontos para uso imediato. |

---

## 📚 Guia de Instalação e Uso

### 📋 Pré-Requisitos

- **Python 3.8+** e `pip`.
- Acesso a uma **API de LLM** (ex: Perplexity, OpenAI, Gemini) com uma chave de API válida.
- Uma das seguintes **IDEs de IA** instalada:
  - **Antigravity** - IDE de IA de próxima geração
  - **Cursor** - Editor de código com IA integrada
  - **Claude Code** - Ambiente de desenvolvimento Claude
  - **OpenCode** - IDE open-source com IA
  - **Kilocode** - Plataforma de desenvolvimento colaborativo
  - **Manus** - Agente de IA autônomo
- Permissão para configurar **cron jobs** (recomendado).

### 🛠️ Etapa 1: Instalação de Dependências

Execute o script de instalação para configurar o ambiente Python:

```bash
bash ./scripts/install.sh
```

### 📂 Etapa 2: Configuração do Workspace

Copie os templates da pasta `assets/` para o diretório principal do seu agente (o `workspace`):

```bash
# Exemplo: se seu workspace estiver em /home/ubuntu/my-agent-workspace
cp -r ./assets/* /home/ubuntu/my-agent-workspace/

# Crie também o diretório para a base de conhecimento
mkdir -p /home/ubuntu/my-agent-workspace/memory/KNOWLEDGE_BASE
```

### 🔑 Etapa 3: Variáveis de Ambiente

Crie um arquivo `.env` dentro da pasta `scripts/` e adicione suas credenciais:

```env
# scripts/.env

# Endpoint da API do seu LLM
LLM_API_ENDPOINT="https://api.perplexity.ai/chat/completions"

# Sua chave de API
SONAR_API_KEY="SUA_CHAVE_API_AQUI"

# Porta para o worker de memória (padrão: 37777)
MEMORY_WORKER_PORT=37777
```

### ⚙️ Etapa 4: Configuração dos Hooks (Instalador Automático)

Use o instalador universal que detecta automaticamente sua IDE e configura os hooks:

```bash
python3 ./scripts/setup_hooks.py
```

O instalador irá:
1. 🔍 Detectar automaticamente quais IDEs estão instaladas
2. 📋 Apresentar opções de configuração
3. 💾 Fazer backup das configurações existentes
4. ⚙️ Instalar os hooks nos arquivos de configuração corretos

**IDEs Suportadas:**
- Antigravity (`~/.antigravity/settings.json`)
- Cursor (`~/.cursor/settings.json`)
- Claude Code (`~/.claude/settings.json`)
- OpenCode (`~/.opencode/config.json`)
- Kilocode (`~/.kilocode/settings.json`)
- Manus (`~/.manus/settings.json`)

#### Instalação Manual (Opcional)

Se preferir configurar manualmente, adicione ao arquivo de configuração da sua IDE:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/your/project/scripts/post_tool_use_hook.py"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/your/project/scripts/heartbeat.py --trigger stop"
          }
        ]
      }
    ]
  }
}
```

### 🚀 Etapa 5: Iniciar o Worker de Memória

O worker é o serviço de fundo que gerencia a memória. Inicie-o com o script fornecido:

```bash
bash ./scripts/run_worker.sh
```

- **Verificar Status**: `tail -f /tmp/evolution_core_worker.log`
- **API Docs**: Acesse `http://localhost:37777/docs` no seu navegador.

### ⏰ Etapa 6: Agendar a Revisão Noturna (Cron Job)

Para que o agente aprenda com as experiências do dia, configure o Loop Composto:

```bash
# Abre o editor de cron
crontab -e

# Adicione esta linha (ajuste o caminho e o horário)
30 22 * * * python3 /path/to/your/project/scripts/nightly_review.py
```

### 🎬 Etapa 7: Onboarding

Na primeira vez que você usar o agente, ele iniciará o processo de onboarding, guiando você através de uma série de perguntas para personalizar a experiência. Suas respostas irão popular os arquivos `USER.md` e `SOUL.md`.

---

## 🏗️ Arquitetura

Para um mergulho profundo na arquitetura, componentes e fluxos de dados, consulte o **[Documento de Arquitetura](./docs/ARCHITECTURE.md)**.

## 📁 Estrutura do Repositório

```
.
├── README.md                   # Este guia
├── LICENSE                     # Licença MIT
├── SKILL.md                    # Documentação detalhada da skill
├── IMPLEMENTATION_GUIDE.md     # Guia de implementação alternativo
├── scripts/                    # Todos os scripts de backend e hooks
├── assets/                     # Templates de configuração (AGENTS.md, etc.)
└── docs/
    └── ARCHITECTURE.md         # Documentação técnica da arquitetura
```

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue para relatar bugs ou sugerir novos recursos.

## 📜 Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
