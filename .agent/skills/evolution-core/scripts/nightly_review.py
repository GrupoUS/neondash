#!/usr/bin/env python3

import sqlite3
import os
import json
from datetime import datetime, timedelta
import requests
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

DB_FILE = "/home/ubuntu/workspace/.claude-mem/data/sessions.db"
MEMORY_FILE = "/home/ubuntu/workspace/MEMORY.md"

def get_llm_synthesis(observations: list) -> str:
    """Gera uma síntese de alto nível das observações do dia usando um LLM."""
    api_key = os.getenv("SONAR_API_KEY")
    endpoint = os.getenv("LLM_API_ENDPOINT", "https://api.perplexity.ai/chat/completions")

    if not api_key or not observations:
        return ""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    content = "\n".join([f"- {obs['title']}: {obs['semantic_summary']}" for obs in observations])

    prompt = f"""Analise a lista de observações de um agente de IA de hoje. Extraia 3 a 5 aprendizados chave, padrões de sucesso, ou 'gotchas' a serem evitados. Formate como uma lista de pontos. Seja conciso e foque em conhecimento acionável.

Observações do Dia:
{content}

Síntese dos Aprendizados:"""

    data = {
        "model": "sonar-small-chat",
        "messages": [
            {"role": "system", "content": "Você é um especialista em analisar o comportamento de agentes de IA e extrair lições valiosas."},
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
    """Executa o processo de revisão noturna."""
    yesterday = datetime.now() - timedelta(days=1)
    yesterday_str = yesterday.strftime('%Y-%m-%d')

    # 1. Coletar observações do dia anterior do SQLite
    observations = []
    try:
        with sqlite3.connect(DB_FILE) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT title, semantic_summary FROM observations WHERE date(timestamp) = ?", (yesterday_str,)
            )
            observations = [dict(row) for row in cursor.fetchall()]
    except sqlite3.Error:
        # Se o banco de dados não existir ou estiver vazio, não faz nada
        return

    if not observations:
        return

    # 2. Gerar síntese com LLM
    synthesis = get_llm_synthesis(observations)

    if not synthesis:
        return

    # 3. Anexar ao MEMORY.md
    try:
        with open(MEMORY_FILE, "a") as f:
            f.write(f"\n\n## Aprendizados de {yesterday_str}\n\n")
            f.write(synthesis)
            f.write("\n")
    except FileNotFoundError:
        # Se o arquivo não existir, cria com o conteúdo
        with open(MEMORY_FILE, "w") as f:
            f.write(f"# Long-Term Memory\n\n## Aprendizados de {yesterday_str}\n\n")
            f.write(synthesis)
            f.write("\n")

    # 4. (Opcional) Fazer commit no Git
    # os.system("cd /home/ubuntu/workspace && git add MEMORY.md && git commit -m 'feat(memory): compound daily review'")

if __name__ == "__main__":
    main()
