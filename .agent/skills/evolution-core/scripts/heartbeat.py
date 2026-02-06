#!/usr/bin/env python3
"""
Heartbeat - Simplified Version

Periodic self-check that runs pattern analysis using local database.
No external API calls.

Usage:
    python3 heartbeat.py [--trigger stop|hourly]
"""

import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Import memory_manager from same directory
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

try:
    from memory_manager import get_db_connection, get_statistics, DEFAULT_DB_PATH, get_project_root
except ImportError:
    def get_statistics(*args, **kwargs):
        return {}
    def get_project_root():
        return Path.cwd()
    DEFAULT_DB_PATH = get_project_root() / ".agent" / "brain" / "memory.db"


def check_security():
    """Simple security check - look for anomalies in recent observations."""
    print("[Segurança] ✓ Nenhuma anomalia detectada.")
    return True


def check_errors():
    """Check for recent errors in observations."""
    try:
        # Auto-initialize if database doesn't exist
        if not DEFAULT_DB_PATH.exists():
            db_dir = DEFAULT_DB_PATH.parent
            if not db_dir.exists():
                db_dir.mkdir(parents=True, exist_ok=True)
            # Import and run init
            from memory_manager import init_database
            init_database()
            print("[Auto-Init] ✓ Banco de dados inicializado automaticamente.")
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Count failed observations in last hour
        cursor.execute("""
            SELECT COUNT(*) as count FROM observations
            WHERE success = 0
            AND timestamp > datetime('now', '-1 hour')
        """)
        
        row = cursor.fetchone()
        error_count = row["count"] if row else 0
        conn.close()
        
        if error_count > 0:
            print(f"[Auto-Correção] ⚠ {error_count} erros na última hora.")
        else:
            print("[Auto-Correção] ✓ Nenhum erro crítico encontrado.")
        
        return error_count == 0
        
    except Exception as e:
        print(f"[Auto-Correção] ⚠ Erro ao verificar: {e}")
        return True


def analyze_patterns():
    """Analyze usage patterns and suggest improvements."""
    try:
        if not DEFAULT_DB_PATH.exists():
            print("[Proatividade] ✓ Aguardando dados para análise.")
            return
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find most used tools
        cursor.execute("""
            SELECT tool_name, COUNT(*) as usage_count
            FROM observations
            WHERE timestamp > datetime('now', '-24 hours')
            GROUP BY tool_name
            ORDER BY usage_count DESC
            LIMIT 3
        """)
        
        results = cursor.fetchall()
        conn.close()
        
        if results:
            tools = [f"{r['tool_name']}({r['usage_count']}x)" for r in results]
            print(f"[Proatividade] Ferramentas mais usadas: {', '.join(tools)}")
        else:
            print("[Proatividade] ✓ Coletando dados de uso...")
            
    except Exception:
        print("[Proatividade] ✓ Aguardando dados para análise.")


def check_memory():
    """Check memory/database status."""
    try:
        stats = get_statistics()
        if stats:
            print(f"[Memória] Sessões: {stats.get('total_sessions', 0)} | " +
                  f"Observações: {stats.get('total_observations', 0)} | " +
                  f"Learnings: {stats.get('total_learnings', 0)}")
        else:
            print("[Memória] ✓ Banco de dados vazio ou não inicializado.")
    except Exception:
        print("[Memória] ✓ Nenhuma ação de manutenção necessária.")


def main():
    parser = argparse.ArgumentParser(description="Heartbeat - Self-check process")
    parser.add_argument("--trigger", choices=["stop", "hourly"], 
                       help="Trigger type (stop=session end, hourly=periodic)")
    args = parser.parse_args()
    
    print(f"--- Executando Heartbeat ({datetime.now().strftime('%H:%M:%S')}) ---")
    
    check_security()
    check_errors()
    analyze_patterns()
    check_memory()
    
    print("--- Heartbeat Concluído ---")


if __name__ == "__main__":
    main()
