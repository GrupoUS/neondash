#!/usr/bin/env python3

import sys
import json
import requests
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def get_llm_summary(observation: dict) -> tuple[str, str]:
    """Gera um título e resumo semântico para uma observação usando um LLM."""
    api_key = os.getenv("SONAR_API_KEY")
    endpoint = os.getenv("LLM_API_ENDPOINT", "https://api.perplexity.ai/chat/completions")

    if not api_key:
        return "Erro: Chave de API não encontrada", ""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Prepara o conteúdo para o prompt
    content = f"""Tool: {observation.get('tool_name')}\nInput: {json.dumps(observation.get('tool_input', {}))}\nOutput: {json.dumps(observation.get('tool_output', ''))}"""

    prompt = f"""Analise a seguinte observação de uso de ferramenta e gere um título conciso (máx 5 palavras) e um resumo semântico (máx 2 frases) do que foi feito. O output deve ser um JSON com as chaves 'title' e 'summary'.\n\nObservação:\n{content}"""

    data = {
        "model": "sonar-small-chat",
        "messages": [
            {"role": "system", "content": "Você é um especialista em sumarizar logs de ferramentas de IA."},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        summary_content = json.loads(result['choices'][0]['message']['content'])
        return summary_content.get("title", "Título não gerado"), summary_content.get("summary", "Resumo não gerado")
    except Exception as e:
        return f"Erro ao gerar resumo: {e}", str(e)

def main():
    """Função principal do hook."""
    try:
        # Lê a observação do stdin
        observation = json.load(sys.stdin)

        # Gera título e resumo
        title, summary = get_llm_summary(observation)

        # Adiciona o resumo à observação
        observation['semantic_summary'] = summary
        observation['title'] = title

        # Envia para o worker de memória
        worker_port = os.getenv("MEMORY_WORKER_PORT", 37777)
        worker_url = f"http://localhost:{worker_port}/observations/"
        
        requests.post(worker_url, json=observation)

    except Exception as e:
        # Em caso de erro, não bloqueia o fluxo, apenas loga
        with open("/tmp/evolution_core_hook_error.log", "a") as f:
            f.write(f"Error in post_tool_use_hook: {e}\n")
        sys.exit(0)

if __name__ == "__main__":
    main()
