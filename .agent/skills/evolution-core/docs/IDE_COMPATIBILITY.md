# 🔌 Guia de Compatibilidade de IDEs

Este documento detalha a compatibilidade e configuração da skill **Evolution Core** com diferentes IDEs de IA.

## 📊 Tabela de Compatibilidade

| IDE | Status | Arquivo de Configuração | Detecção Automática | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Antigravity** | ✅ Suportado | `~/.antigravity/settings.json` | Sim | IDE de próxima geração com suporte completo |
| **Cursor** | ✅ Suportado | `~/.cursor/settings.json` | Sim | Editor popular com IA integrada |
| **Claude Code** | ✅ Suportado | `~/.claude/settings.json` | Sim | Ambiente oficial do Claude |
| **OpenCode** | ✅ Suportado | `~/.opencode/config.json` | Sim | Solução open-source |
| **Kilocode** | ✅ Suportado | `~/.kilocode/settings.json` | Sim | Plataforma colaborativa |
| **Manus** | ✅ Suportado | `~/.manus/settings.json` | Sim | Agente autônomo avançado |

## 🚀 Instalação Rápida

Para qualquer IDE suportada, o processo de instalação é o mesmo:

```bash
# 1. Instalar dependências
bash scripts/install.sh

# 2. Configurar hooks automaticamente
python3 scripts/setup_hooks.py

# 3. Configurar variáveis de ambiente
cp scripts/.env.example scripts/.env
# Edite scripts/.env com suas credenciais

# 4. Iniciar worker de memória
bash scripts/run_worker.sh
```

## 🔧 Detalhes por IDE

### Antigravity

**Localização da Configuração**: `~/.antigravity/settings.json`

**Estrutura de Hooks**:
```json
{
  "hooks": {
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

**Recursos Especiais**: Suporte completo a todos os recursos do Evolution Core.

---

### Cursor

**Localização da Configuração**: `~/.cursor/settings.json`

**Estrutura de Hooks**:
```json
{
  "hooks": {
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

**Recursos Especiais**: Integração nativa com VSCode, suporte a extensões.

---

### Claude Code

**Localização da Configuração**: `~/.claude/settings.json`

**Estrutura de Hooks**:
```json
{
  "hooks": {
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

**Recursos Especiais**: Ambiente oficial do Claude com suporte otimizado.

---

### OpenCode

**Localização da Configuração**: `~/.opencode/config.json`

**Estrutura de Hooks**:
```json
{
  "hooks": {
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

**Recursos Especiais**: Solução open-source totalmente customizável.

---

### Kilocode

**Localização da Configuração**: `~/.kilocode/settings.json`

**Estrutura de Hooks**:
```json
{
  "hooks": {
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

**Recursos Especiais**: Colaboração em tempo real, ideal para equipes.

---

### Manus

**Localização da Configuração**: `~/.manus/settings.json`

**Estrutura de Hooks**:
```json
{
  "hooks": {
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

**Recursos Especiais**: Agente autônomo com capacidades avançadas de raciocínio.

## 🛠️ Configuração Manual

Se o instalador automático não funcionar para sua IDE, você pode configurar manualmente:

1. Localize o arquivo de configuração da sua IDE (veja tabela acima)
2. Adicione a seção de hooks:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "/caminho/absoluto/para/scripts/post_tool_use_hook.py"
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
            "command": "/caminho/absoluto/para/scripts/heartbeat.py --trigger stop"
          }
        ]
      }
    ]
  }
}
```

3. Substitua `/caminho/absoluto/para/` pelo caminho real do projeto
4. Reinicie sua IDE

## 🐛 Solução de Problemas

### Hook não é acionado

1. Verifique se o caminho para os scripts está correto e é absoluto
2. Certifique-se de que os scripts têm permissão de execução: `chmod +x scripts/*.py`
3. Verifique os logs da IDE para mensagens de erro
4. Teste o hook manualmente: `python3 scripts/post_tool_use_hook.py`

### Worker de memória não inicia

1. Verifique se todas as dependências foram instaladas: `pip3 list | grep -E "(fastapi|chromadb)"`
2. Verifique se a porta 37777 não está em uso: `lsof -i :37777`
3. Consulte os logs: `tail -f /tmp/evolution_core_worker.log`

### IDE não detectada pelo instalador

1. Verifique se o diretório de configuração existe (ex: `~/.cursor/`)
2. Se a IDE usa um caminho diferente, abra uma issue no repositório
3. Use a instalação manual como alternativa

## 📝 Adicionando Suporte para Novas IDEs

Para adicionar suporte a uma nova IDE:

1. Edite `scripts/ide_configs.json`
2. Adicione uma nova entrada com o formato:

```json
{
  "nome_da_ide": {
    "name": "Nome Amigável",
    "config_file": "~/caminho/para/config.json",
    "config_path": ["hooks"],
    "hook_format": "command",
    "supported": true
  }
}
```

3. Teste o instalador: `python3 scripts/setup_hooks.py`
4. Abra um Pull Request compartilhando a configuração!

## 🤝 Contribuições

Encontrou um problema ou tem sugestões? Abra uma issue ou PR no repositório!
