#!/usr/bin/env python3
"""
Nightly Review - Simplified Version

Aggregates daily observations and generates learnings using SQL analysis.
No external API calls.

Usage:
    python3 nightly_review.py [--days N]
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Import memory_manager from same directory
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

try:
    from memory_manager import get_db_connection, store_learning, DEFAULT_DB_PATH, get_project_root
except ImportError:
    def get_db_connection(*args, **kwargs):
        return None
    def store_learning(*args, **kwargs):
        return None
    def get_project_root():
        return Path.cwd()
    DEFAULT_DB_PATH = get_project_root() / ".agent" / "brain" / "memory.db"


def get_daily_observations(days: int = 1) -> list:
    """Get observations from the last N days."""
    try:
        if not DEFAULT_DB_PATH.exists():
            return []
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT o.tool_name, o.context_snapshot, o.success, o.timestamp,
                   s.project_path, s.task_description
            FROM observations o
            LEFT JOIN sessions s ON o.session_id = s.session_id
            WHERE o.timestamp > datetime('now', ?)
            ORDER BY o.timestamp DESC
        """, (f'-{days} days',))
        
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results
        
    except Exception:
        return []


def analyze_tool_patterns(observations: list) -> list:
    """Analyze tool usage patterns."""
    patterns = []
    
    # Count tool usage
    tool_counts = {}
    for obs in observations:
        tool = obs.get("tool_name", "unknown")
        tool_counts[tool] = tool_counts.get(tool, 0) + 1
    
    # Find most used tools
    sorted_tools = sorted(tool_counts.items(), key=lambda x: x[1], reverse=True)
    if sorted_tools:
        top_tools = sorted_tools[:5]
        patterns.append({
            "type": "tool_usage",
            "description": f"Ferramentas mais usadas: {', '.join([f'{t}({c}x)' for t, c in top_tools])}"
        })
    
    return patterns


def analyze_error_patterns(observations: list) -> list:
    """Analyze error patterns."""
    patterns = []
    
    failures = [obs for obs in observations if not obs.get("success", True)]
    
    if failures:
        # Group by tool
        error_tools = {}
        for f in failures:
            tool = f.get("tool_name", "unknown")
            error_tools[tool] = error_tools.get(tool, 0) + 1
        
        if error_tools:
            patterns.append({
                "type": "error_pattern",
                "description": f"Ferramentas com erros: {', '.join([f'{t}({c}x)' for t, c in error_tools.items()])}"
            })
    
    return patterns


def analyze_project_patterns(observations: list) -> list:
    """Analyze project-specific patterns."""
    patterns = []
    
    # Group by project
    project_counts = {}
    for obs in observations:
        project = obs.get("project_path", "unknown")
        if project:
            project_counts[project] = project_counts.get(project, 0) + 1
    
    if project_counts:
        patterns.append({
            "type": "project_activity",
            "description": f"Projetos ativos: {len(project_counts)}"
        })
    
    return patterns


def save_learnings(patterns: list, source_date: str):
    """Save patterns as learnings."""
    for pattern in patterns:
        try:
            store_learning(
                pattern_type=pattern["type"],
                description=f"[{source_date}] {pattern['description']}",
                source_sessions=[],
                confidence_score=0.5
            )
        except Exception:
            pass


def append_to_memory_file(patterns: list, date_str: str):
    """Append learnings to MEMORY.md file."""
    memory_file = Path.home() / "workspace" / "MEMORY.md"
    
    # Try project-local first
    project_memory = Path.cwd() / "MEMORY.md"
    if project_memory.exists():
        memory_file = project_memory
    
    if not patterns:
        return
    
    content = f"\n\n## Aprendizados de {date_str}\n\n"
    for p in patterns:
        content += f"- **{p['type']}**: {p['description']}\n"
    
    try:
        with open(memory_file, "a") as f:
            f.write(content)
        print(f"✓ Aprendizados salvos em {memory_file}")
    except Exception:
        print("⚠ Não foi possível salvar em MEMORY.md")


def main():
    parser = argparse.ArgumentParser(description="Nightly Review - Aggregate daily learnings")
    parser.add_argument("--days", type=int, default=1, help="Days to analyze (default: 1)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving")
    args = parser.parse_args()
    
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    print(f"--- Revisão Noturna ({yesterday}) ---")
    
    # Get observations
    observations = get_daily_observations(args.days)
    print(f"Observações encontradas: {len(observations)}")
    
    if not observations:
        print("Nenhuma observação para analisar.")
        return
    
    # Analyze patterns
    patterns = []
    patterns.extend(analyze_tool_patterns(observations))
    patterns.extend(analyze_error_patterns(observations))
    patterns.extend(analyze_project_patterns(observations))
    
    # Display patterns
    print("\n📊 Padrões identificados:")
    for p in patterns:
        print(f"  - [{p['type']}] {p['description']}")
    
    if not args.dry_run and patterns:
        save_learnings(patterns, yesterday)
        append_to_memory_file(patterns, yesterday)
    
    print("\n--- Revisão Concluída ---")


if __name__ == "__main__":
    main()
