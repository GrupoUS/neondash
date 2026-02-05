#!/usr/bin/env python3

import os
import chromadb
import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

# --- Configuração do Banco de Dados ---
DB_FILE = "/home/ubuntu/workspace/.claude-mem/data/sessions.db"
CHROMA_PATH = "/home/ubuntu/workspace/.claude-mem/data/chroma"

# Garante que os diretórios existam
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
os.makedirs(CHROMA_PATH, exist_ok=True)

# Conexão com o ChromaDB
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="observations")

# Conexão com o SQLite
def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# Criação da tabela de observações
with get_db_connection() as conn:
    conn.execute('''
        CREATE TABLE IF NOT EXISTS observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            title TEXT,
            semantic_summary TEXT,
            observation_json TEXT NOT NULL
        )
    ''')
    conn.commit()

# --- Modelos de Dados ---
class Observation(BaseModel):
    session_id: str
    title: str
    semantic_summary: str
    tool_name: str
    tool_input: Dict[str, Any]
    tool_output: Any

# --- API ---
app = FastAPI()

@app.post("/observations/", status_code=201)
def add_observation(obs: Observation):
    try:
        observation_json = obs.json()

        # Armazena no SQLite
        with get_db_connection() as conn:
            cursor = conn.execute(
                "INSERT INTO observations (session_id, title, semantic_summary, observation_json) VALUES (?, ?, ?, ?)",
                (obs.session_id, obs.title, obs.semantic_summary, observation_json)
            )
            obs_id = cursor.lastrowid
            conn.commit()

        # Armazena no ChromaDB
        collection.add(
            documents=[obs.semantic_summary],
            metadatas=[{"session_id": obs.session_id, "title": obs.title}],
            ids=[str(obs_id)]
        )
        return {"status": "success", "id": obs_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search/")
def search_observations(query: str, n_results: int = 5):
    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/observations/{obs_id}")
def get_observation(obs_id: int):
    try:
        with get_db_connection() as conn:
            obs = conn.execute("SELECT observation_json FROM observations WHERE id = ?", (obs_id,)).fetchone()
        if obs is None:
            raise HTTPException(status_code=404, detail="Observation not found")
        return json.loads(obs['observation_json'])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("MEMORY_WORKER_PORT", 37777))
    uvicorn.run(app, host="0.0.0.0", port=port)
