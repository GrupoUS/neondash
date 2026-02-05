# 🚀 Guia de Implementação Completo: Evolution Core

Este guia fornece instruções passo a passo para implementar a skill **Evolution Core** em qualquer projeto que utilize um agente de IA compatível com hooks (ex: Claude Code, Manus).

## 📋 Pré-Requisitos

Antes de começar, certifique-se de que você tem:

1.  **Python 3.8+** instalado no sistema.
2.  **Acesso a uma API de LLM** (Perplexity, OpenAI, Gemini, etc.) para a geração de resumos e sínteses.
3.  **Permissões para configurar hooks** no seu agente de IA.
4.  **Permissões para configurar cron jobs** (opcional, mas recomendado para o Loop Composto).

## 🛠️ Etapa 1: Instalação de Dependências

Execute o script de instalação fornecido para configurar o ambiente Python com todas as bibliotecas necessárias:

```bash
bash /path/to/evolution-core/scripts/install.sh
```

Este script instalará:

*   `fastapi` e `uvicorn` para o worker de memória.
*   `chromadb` para a busca vetorial.
*   `pysqlite3-binary` para o banco de dados SQLite.
*   `requests` para a comunicação com APIs.
*   `python-dotenv` para o gerenciamento de variáveis de ambiente.

## 📂 Etapa 2: Configuração do Workspace

Copie os arquivos de template da pasta `assets/` para a raiz do seu workspace (ou para o diretório onde você deseja que o agente armazene sua memória):

```bash
cp -r /path/to/evolution-core/assets/* /home/ubuntu/workspace/
```

Isso criará os seguintes arquivos:

*   `AGENTS.md`: Diretrizes operacionais.
*   `MEMORY.md`: Memória curada de longo prazo.
*   `SOUL.md`: Identidade e princípios do agente.
*   `USER.md`: Contexto sobre você.
*   `HEARTBEAT.md`: Checklist de auto-melhoria.
*   `ONBOARDING.md`: Processo de configuração inicial.

Além disso, crie o diretório para a base de conhecimento:

```bash
mkdir -p /home/ubuntu/workspace/memory/KNOWLEDGE_BASE
```

## 🔑 Etapa 3: Configuração de Variáveis de Ambiente

Crie um arquivo `.env` no diretório `/home/ubuntu/evolution-core/scripts/` com as seguintes variáveis:

```env
# Endpoint da API do seu LLM
LLM_API_ENDPOINT="https://api.perplexity.ai/chat/completions"

# Sua chave de API
SONAR_API_KEY="SUA_CHAVE_API_AQUI"

# Porta para o worker de memória (padrão: 37777)
MEMORY_WORKER_PORT=37777
```

**Importante**: Substitua `SUA_CHAVE_API_AQUI` pela sua chave de API real. Se você estiver usando um provedor diferente do Perplexity, ajuste o `LLM_API_ENDPOINT` de acordo.

## ⚙️ Etapa 4: Configuração dos Hooks

Você precisa adicionar os hooks ao arquivo de configuração do seu agente. A localização e o formato deste arquivo variam de acordo com o agente:

*   **Claude Code**: `~/.claude/settings.json`
*   **Manus**: Geralmente configurado via interface ou arquivo de configuração do projeto.

Adicione a seguinte configuração de hooks (ajuste os caminhos para os scripts):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python3 /home/ubuntu/evolution-core/scripts/post_tool_use_hook.py"
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
            "command": "python3 /home/ubuntu/evolution-core/scripts/heartbeat.py --trigger stop"
          }
        ]
      }
    ]
  }
}
```

**Explicação:**

*   `PostToolUse`: Este hook é acionado após cada uso de ferramenta. Ele captura a observação e a envia para o worker de memória.
*   `Stop`: Este hook é acionado quando o agente termina de responder. Ele executa o checklist de heartbeat.

## 🚀 Etapa 5: Iniciar o Worker de Memória

O worker de memória é um serviço de fundo que gerencia o banco de dados e a API de busca. Inicie-o com o seguinte comando:

```bash
bash /home/ubuntu/evolution-core/scripts/run_worker.sh
```

Você pode verificar se o worker está rodando acessando `http://localhost:37777/docs` no seu navegador. Isso abrirá a documentação interativa da API (gerada automaticamente pelo FastAPI).

Para verificar os logs do worker:

```bash
tail -f /tmp/evolution_core_worker.log
```

## ⏰ Etapa 6: Configurar o Cron Job para Revisão Noturna (Opcional, mas Recomendado)

O processo de **Revisão Noturna** é o que consolida os aprendizados do dia. Configure um cron job para executar o script `nightly_review.py` todas as noites:

```bash
crontab -e
```

Adicione a seguinte linha ao final do arquivo (ajuste o caminho e o horário conforme necessário):

```
30 22 * * * python3 /home/ubuntu/evolution-core/scripts/nightly_review.py
```

Isso executará a revisão noturna todos os dias às 22:30. Salve e feche o editor.

## 🎬 Etapa 7: Primeiro Uso (Onboarding)

Na primeira vez que você iniciar o agente após a instalação, ele detectará o arquivo `ONBOARDING.md` e iniciará o processo de onboarding. Ele fará uma série de perguntas para entender você e seus objetivos. Suas respostas serão usadas para popular os arquivos `USER.md` e `SOUL.md`.

Você pode responder a todas as perguntas de uma vez ou aos poucos. O progresso é salvo no próprio arquivo `ONBOARDING.md`.

## ✅ Etapa 8: Verificação da Instalação

Para verificar se tudo está funcionando corretamente:

1.  **Teste o Worker**: Acesse `http://localhost:37777/docs` e tente fazer uma busca de teste usando o endpoint `/search/`.
2.  **Teste os Hooks**: Peça ao agente para executar uma ferramenta simples (ex: "Liste os arquivos no diretório atual"). Verifique se uma nova observação foi adicionada ao banco de dados (você pode verificar isso fazendo uma busca no worker ou inspecionando o arquivo SQLite em `/home/ubuntu/workspace/.claude-mem/data/sessions.db`).
3.  **Teste o Heartbeat**: Ao final de uma interação, verifique os logs do heartbeat (se houver) ou simplesmente observe se o agente começa a fazer sugestões proativas.

## 🔧 Solução de Problemas

**Problema**: O worker não inicia.

*   **Solução**: Verifique os logs em `/tmp/evolution_core_worker.log`. Certifique-se de que todas as dependências foram instaladas corretamente e que a porta 37777 não está sendo usada por outro serviço.

**Problema**: Os hooks não são acionados.

*   **Solução**: Verifique se o caminho para os scripts está correto no arquivo de configuração de hooks. Certifique-se de que os scripts têm permissões de execução (`chmod +x`).

**Problema**: O LLM não gera resumos.

*   **Solução**: Verifique se a chave de API no arquivo `.env` está correta e se você tem créditos disponíveis na sua conta da API do LLM.

## 🎉 Pronto!

Você configurou com sucesso o **Evolution Core**! Seu agente agora está equipado para aprender com cada interação, melhorar continuamente e agir proativamente para ajudá-lo a alcançar seus objetivos.
