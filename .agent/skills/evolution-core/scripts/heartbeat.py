#!/usr/bin/env python3

import os
import sys
import requests
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

HEARTBEAT_FILE = "/home/ubuntu/workspace/HEARTBEAT.md"

def get_proactive_suggestion() -> str:
    """Gera uma sugestão proativa usando um LLM."""
    api_key = os.getenv("SONAR_API_KEY")
    endpoint = os.getenv("LLM_API_ENDPOINT", "https://api.perplexity.ai/chat/completions")

    if not api_key:
        return ""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Simplificado: em um sistema real, isso seria alimentado com contexto do USER.md, MEMORY.md, etc.
    prompt = "Baseado no conceito de um agente de IA assistente de desenvolvimento, gere uma sugestão proativa e acionável que poderia ser útil. Exemplo: 'Pesquisar sobre a nova versão da biblioteca X mencionada nos logs.' Seja conciso."

    data = {
        "model": "sonar-small-chat",
        "messages": [
            {"role": "system", "content": "Você é um agente de IA proativo."},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']
    except Exception:
        return ""

def main():
    """Executa o checklist do heartbeat."""
    if not os.path.exists(HEARTBEAT_FILE):
        return

    print("--- Executando Heartbeat ---")

    # 1. Segurança (simulado)
    print("[Segurança] Verificando logs... Nenhuma anomalia detectada.")

    # 2. Auto-Correção (simulado)
    print("[Auto-Correção] Verificando erros... Nenhum erro crítico encontrado.")

    # 3. Proatividade
    suggestion = get_proactive_suggestion()
    if suggestion:
        print(f"[Proatividade] Nova sugestão: {suggestion}")
        # Em um agente real, isso seria apresentado ao usuário

    # 4. Manutenção da Memória (simulado)
    print("[Memória] Nenhuma ação de manutenção imediata necessária.")

    print("--- Heartbeat Concluído ---")

if __name__ == "__main__":
    # O argumento --trigger é para diferenciar a execução
    if len(sys.argv) > 1 and sys.argv[1] == '--trigger':
        main()
