#!/usr/bin/env python3
"""
Evolution Engine - Runtime Analysis and Mutation Generation

Analyzes runtime history to detect inefficiencies and generate improvement mutations.

Usage:
    python3 evolution_engine.py analyze --session-id ID
    python3 evolution_engine.py checkpoint --session-id ID
    python3 evolution_engine.py apply --mutation-id ID [--confirm]
"""

import argparse
import json
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

DEFAULT_DB_PATH = Path.home() / ".agent" / "brain" / "memory.db"
CONFIDENCE_THRESHOLD = 0.8
MAX_MUTATIONS_PER_SESSION = 3


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    path = db_path or DEFAULT_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


class InefficiencyType:
    REDUNDANT_FILE_READS = "redundant_file_reads"
    REPEATED_ERRORS = "repeated_errors"
    CIRCULAR_NAVIGATION = "circular_navigation"
    EXCESSIVE_SEARCHES = "excessive_searches"
    RETRY_WITHOUT_CHANGE = "retry_without_change"


class MutationStrategy:
    CACHE_FILE_CONTENT = "cache_file_content"
    ERROR_PATTERN_LOOKUP = "error_pattern_lookup"
    SMARTER_NAVIGATION = "smarter_navigation"
    TARGETED_SEARCH = "targeted_search"
    VERIFY_BEFORE_RETRY = "verify_before_retry"


def analyze_runtime_history(session_id: str, db_path: Optional[Path] = None) -> dict:
    """Analyze runtime history for a session to detect patterns."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    result = {"tool_frequency": {}, "error_patterns": [], "inefficiencies": [], 
              "performance_metrics": {}, "recommendations": []}
    
    cursor.execute("""
        SELECT * FROM observations WHERE session_id = ? ORDER BY timestamp ASC
    """, (session_id,))
    observations = [dict(row) for row in cursor.fetchall()]
    
    if not observations:
        conn.close()
        return result
    
    # Tool frequency
    result["tool_frequency"] = dict(Counter(obs["tool_name"] for obs in observations))
    
    # Error patterns
    errors = [obs for obs in observations if not obs.get("success", True)]
    if errors:
        result["error_patterns"] = [{"count": len(errors), "tools": list(set(e["tool_name"] for e in errors))}]
    
    # Detect inefficiencies
    inefficiencies = []
    
    # Redundant file reads
    file_reads = [obs for obs in observations if obs["tool_name"] in ("view_file", "read_file")]
    file_counts = Counter(obs.get("input_data", "") for obs in file_reads)
    for path, count in file_counts.items():
        if count > 2 and path:
            inefficiencies.append({
                "type": InefficiencyType.REDUNDANT_FILE_READS,
                "details": f"File '{path}' read {count} times",
                "severity": min(count / 5, 1.0),
                "suggestion": MutationStrategy.CACHE_FILE_CONTENT
            })
    
    # Repeated errors
    error_inputs = Counter(obs.get("input_data", "")[:100] for obs in errors)
    for inp, count in error_inputs.items():
        if count > 1 and inp:
            inefficiencies.append({
                "type": InefficiencyType.REPEATED_ERRORS,
                "details": f"Same operation failed {count} times",
                "severity": min(count / 3, 1.0),
                "suggestion": MutationStrategy.ERROR_PATTERN_LOOKUP
            })
    
    result["inefficiencies"] = inefficiencies
    
    # Performance metrics
    total_time = sum(obs.get("execution_time_ms", 0) or 0 for obs in observations)
    success_rate = sum(1 for obs in observations if obs.get("success", True)) / len(observations)
    result["performance_metrics"] = {
        "total_observations": len(observations),
        "total_execution_time_ms": total_time,
        "success_rate": round(success_rate, 2),
        "error_count": len(errors)
    }
    
    conn.close()
    return result


def generate_mutations(inefficiencies: list, session_id: str) -> list:
    """Generate mutation suggestions based on detected inefficiencies."""
    mutations = []
    
    for ineff in inefficiencies:
        confidence = ineff.get("severity", 0.5)
        if confidence < CONFIDENCE_THRESHOLD:
            continue
        
        mutation = {
            "mutation_id": str(uuid4()),
            "session_id": session_id,
            "inefficiency_type": ineff.get("type"),
            "confidence_score": confidence,
            "mutation_strategy": json.dumps({
                "action": ineff.get("suggestion"),
                "details": ineff.get("details")
            }),
            "applied": False
        }
        mutations.append(mutation)
    
    return mutations[:MAX_MUTATIONS_PER_SESSION]


def checkpoint_progress(session_id: str, step: int = 0, db_path: Optional[Path] = None) -> dict:
    """Checkpoint current progress and check for optimization opportunities."""
    analysis = analyze_runtime_history(session_id, db_path)
    
    result = {
        "checkpoint_step": step,
        "analysis_summary": {
            "total_observations": analysis["performance_metrics"].get("total_observations", 0),
            "success_rate": analysis["performance_metrics"].get("success_rate", 1.0),
            "inefficiency_count": len(analysis["inefficiencies"])
        },
        "suggestions": [i.get("suggestion") for i in analysis["inefficiencies"] if i.get("severity", 0) >= 0.7]
    }
    return result


def store_mutation(mutation: dict, db_path: Optional[Path] = None) -> str:
    """Store a mutation in the database."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO mutations (mutation_id, session_id, inefficiency_type, mutation_strategy,
                               confidence_score, applied, outcome, rollback_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (mutation["mutation_id"], mutation["session_id"], mutation["inefficiency_type"],
          mutation["mutation_strategy"], mutation["confidence_score"], False, None, None))
    conn.commit()
    conn.close()
    return mutation["mutation_id"]


def apply_mutation(mutation_id: str, confirm: bool = False, db_path: Optional[Path] = None) -> dict:
    """Apply a mutation (with confirmation)."""
    if not confirm:
        return {"success": False, "error": "Use --confirm to apply mutation"}
    
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE mutations SET applied = TRUE, outcome = 'applied' WHERE mutation_id = ?", (mutation_id,))
    conn.commit()
    conn.close()
    return {"success": True, "mutation_id": mutation_id}


def rollback_mutation(mutation_id: str, db_path: Optional[Path] = None) -> dict:
    """Rollback a previously applied mutation."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE mutations SET applied = FALSE, outcome = 'rolled_back' WHERE mutation_id = ?", (mutation_id,))
    conn.commit()
    conn.close()
    return {"success": True, "mutation_id": mutation_id}


def main():
    parser = argparse.ArgumentParser(description="Evolution Engine")
    subparsers = parser.add_subparsers(dest="command")
    
    analyze_p = subparsers.add_parser("analyze")
    analyze_p.add_argument("--session-id", required=True)
    analyze_p.add_argument("--db-path", type=Path)
    
    checkpoint_p = subparsers.add_parser("checkpoint")
    checkpoint_p.add_argument("--session-id", required=True)
    checkpoint_p.add_argument("--step", type=int, default=0)
    checkpoint_p.add_argument("--db-path", type=Path)
    
    apply_p = subparsers.add_parser("apply")
    apply_p.add_argument("--mutation-id", required=True)
    apply_p.add_argument("--confirm", action="store_true")
    apply_p.add_argument("--db-path", type=Path)
    
    rollback_p = subparsers.add_parser("rollback")
    rollback_p.add_argument("--mutation-id", required=True)
    rollback_p.add_argument("--db-path", type=Path)
    
    args = parser.parse_args()
    
    if args.command == "analyze":
        print(json.dumps(analyze_runtime_history(args.session_id, args.db_path), indent=2))
    elif args.command == "checkpoint":
        print(json.dumps(checkpoint_progress(args.session_id, args.step, args.db_path), indent=2))
    elif args.command == "apply":
        print(json.dumps(apply_mutation(args.mutation_id, args.confirm, args.db_path), indent=2))
    elif args.command == "rollback":
        print(json.dumps(rollback_mutation(args.mutation_id, args.db_path), indent=2))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
