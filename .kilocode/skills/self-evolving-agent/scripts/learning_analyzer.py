#!/usr/bin/env python3
"""
Learning Analyzer - Cross-Project Pattern Analysis

Aggregates patterns across all projects to identify common workflows,
error patterns, and suggest skill creation or AGENTS.md updates.

Usage:
    python3 learning_analyzer.py aggregate --scan-path /home/user
    python3 learning_analyzer.py patterns
    python3 learning_analyzer.py suggest-skill --pattern-id ID
    python3 learning_analyzer.py suggest-agents-update
"""

import argparse
import json
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

DEFAULT_DB_PATH = Path.home() / ".agent" / "brain" / "memory.db"


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    path = db_path or DEFAULT_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def aggregate_patterns(
    scan_path: str = "",
    db_path: Optional[Path] = None
) -> dict[str, Any]:
    """
    Aggregate patterns across all sessions.
    
    Returns:
        Dictionary with:
        - common_workflows: Frequently used tool sequences
        - error_patterns: Common failure modes and solutions
        - tool_preferences: Most effective tool combinations
        - success_metrics: Success rates by pattern
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    result = {
        "common_workflows": [],
        "error_patterns": [],
        "tool_preferences": {},
        "success_metrics": {},
        "projects_analyzed": 0
    }
    
    # Get all sessions, optionally filtered by path
    if scan_path:
        cursor.execute("""
            SELECT session_id, project_path, success_score
            FROM sessions
            WHERE project_path LIKE ?
        """, (f"{scan_path}%",))
    else:
        cursor.execute("SELECT session_id, project_path, success_score FROM sessions")
    
    sessions = [dict(row) for row in cursor.fetchall()]
    result["projects_analyzed"] = len(set(s["project_path"] for s in sessions))
    
    # Analyze tool sequences across sessions
    workflow_counts = Counter()
    tool_counts = Counter()
    
    for session in sessions:
        cursor.execute("""
            SELECT tool_name, success FROM observations
            WHERE session_id = ?
            ORDER BY timestamp
        """, (session["session_id"],))
        
        tools = [row["tool_name"] for row in cursor.fetchall()]
        tool_counts.update(tools)
        
        # Extract 3-step workflows
        for i in range(len(tools) - 2):
            workflow = f"{tools[i]} -> {tools[i+1]} -> {tools[i+2]}"
            workflow_counts[workflow] += 1
    
    result["common_workflows"] = [
        {"workflow": w, "frequency": c}
        for w, c in workflow_counts.most_common(10)
    ]
    
    result["tool_preferences"] = dict(tool_counts.most_common(20))
    
    # Analyze error patterns
    cursor.execute("""
        SELECT tool_name, input_data, COUNT(*) as count
        FROM observations
        WHERE success = FALSE
        GROUP BY tool_name, input_data
        HAVING count > 1
        ORDER BY count DESC
        LIMIT 10
    """)
    
    result["error_patterns"] = [
        {"tool": row["tool_name"], "input": row["input_data"][:100], "count": row["count"]}
        for row in cursor.fetchall()
    ]
    
    # Calculate success metrics by tool
    cursor.execute("""
        SELECT tool_name,
               COUNT(*) as total,
               SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes
        FROM observations
        GROUP BY tool_name
    """)
    
    for row in cursor.fetchall():
        if row["total"] > 5:  # Only include tools with significant usage
            result["success_metrics"][row["tool_name"]] = {
                "total": row["total"],
                "success_rate": round(row["successes"] / row["total"], 2)
            }
    
    conn.close()
    return result


def identify_common_workflows(db_path: Optional[Path] = None) -> list[dict]:
    """Extract frequently used workflow sequences."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Get tool sequences per session
    cursor.execute("SELECT DISTINCT session_id FROM sessions")
    sessions = [row["session_id"] for row in cursor.fetchall()]
    
    sequences = []
    for session_id in sessions:
        cursor.execute("""
            SELECT tool_name FROM observations
            WHERE session_id = ?
            ORDER BY timestamp
            LIMIT 20
        """, (session_id,))
        tools = [row["tool_name"] for row in cursor.fetchall()]
        if len(tools) >= 3:
            sequences.append(tools)
    
    # Find common subsequences
    workflow_counts = Counter()
    for seq in sequences:
        for length in [3, 4, 5]:
            for i in range(len(seq) - length + 1):
                subseq = tuple(seq[i:i+length])
                workflow_counts[subseq] += 1
    
    conn.close()
    
    return [
        {"sequence": list(seq), "frequency": count}
        for seq, count in workflow_counts.most_common(10)
        if count > 2
    ]


def suggest_skill_creation(pattern_type: str, db_path: Optional[Path] = None) -> dict:
    """Suggest creating a new skill based on repeated patterns."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM learnings
        WHERE pattern_type = ?
        ORDER BY frequency DESC
        LIMIT 1
    """, (pattern_type,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {"suggestion": None, "reason": "Pattern not found"}
    
    learning = dict(row)
    
    if learning["frequency"] < 3 or learning["confidence_score"] < 0.7:
        return {
            "suggestion": None,
            "reason": "Pattern not frequent or confident enough",
            "frequency": learning["frequency"],
            "confidence": learning["confidence_score"]
        }
    
    return {
        "suggestion": {
            "skill_name": pattern_type.lower().replace(" ", "-"),
            "description": learning["description"],
            "based_on": {
                "frequency": learning["frequency"],
                "confidence": learning["confidence_score"],
                "sources": json.loads(learning.get("source_sessions", "[]"))
            }
        },
        "template": f"""---
name: {pattern_type.lower().replace(" ", "-")}
description: {learning["description"]}
---

# {pattern_type}

This skill was auto-suggested based on {learning["frequency"]} occurrences 
with {learning["confidence_score"]:.0%} confidence.

## When to Use

[Describe activation triggers]

## Workflow

[Document the workflow steps]

## Examples

[Provide usage examples]
"""
    }


def propose_agents_md_updates(db_path: Optional[Path] = None) -> list[dict]:
    """Propose updates to AGENTS.md based on learned patterns."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    proposals = []
    
    # Find high-confidence learnings
    cursor.execute("""
        SELECT pattern_type, description, frequency, confidence_score
        FROM learnings
        WHERE confidence_score >= 0.8 AND frequency >= 5
        ORDER BY frequency DESC
        LIMIT 5
    """)
    
    for row in cursor.fetchall():
        proposals.append({
            "type": "add_rule",
            "pattern": row["pattern_type"],
            "description": row["description"],
            "evidence": {
                "frequency": row["frequency"],
                "confidence": row["confidence_score"]
            },
            "suggestion": f"Add rule for '{row['pattern_type']}': {row['description'][:100]}"
        })
    
    # Find common error patterns
    cursor.execute("""
        SELECT tool_name, COUNT(*) as error_count
        FROM observations
        WHERE success = FALSE
        GROUP BY tool_name
        HAVING error_count >= 10
        ORDER BY error_count DESC
        LIMIT 3
    """)
    
    for row in cursor.fetchall():
        proposals.append({
            "type": "add_warning",
            "tool": row["tool_name"],
            "error_count": row["error_count"],
            "suggestion": f"Add caution for '{row['tool_name']}' - {row['error_count']} recorded failures"
        })
    
    conn.close()
    return proposals


def store_learning(
    pattern_type: str,
    description: str,
    source_sessions: list[str],
    confidence: float = 0.5,
    db_path: Optional[Path] = None
) -> str:
    """Store a new learning pattern."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Check if pattern already exists
    cursor.execute("""
        SELECT learning_id, frequency FROM learnings
        WHERE pattern_type = ?
    """, (pattern_type,))
    
    existing = cursor.fetchone()
    
    if existing:
        # Update existing
        cursor.execute("""
            UPDATE learnings
            SET frequency = frequency + 1,
                confidence_score = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE learning_id = ?
        """, (confidence, existing["learning_id"]))
        learning_id = existing["learning_id"]
    else:
        # Insert new
        learning_id = str(uuid4())
        cursor.execute("""
            INSERT INTO learnings (learning_id, pattern_type, description,
                                   confidence_score, source_sessions)
            VALUES (?, ?, ?, ?, ?)
        """, (learning_id, pattern_type, description, confidence, json.dumps(source_sessions)))
    
    conn.commit()
    conn.close()
    return learning_id


def get_all_learnings(db_path: Optional[Path] = None) -> list[dict]:
    """Get all stored learnings."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT learning_id, pattern_type, description, frequency,
               confidence_score, created_at, updated_at
        FROM learnings
        ORDER BY frequency DESC, confidence_score DESC
    """)
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return results


def main():
    parser = argparse.ArgumentParser(description="Learning Analyzer")
    subparsers = parser.add_subparsers(dest="command")
    
    agg_p = subparsers.add_parser("aggregate", help="Aggregate patterns")
    agg_p.add_argument("--scan-path", default="")
    agg_p.add_argument("--db-path", type=Path)
    
    patterns_p = subparsers.add_parser("patterns", help="List learned patterns")
    patterns_p.add_argument("--db-path", type=Path)
    
    workflows_p = subparsers.add_parser("workflows", help="Identify common workflows")
    workflows_p.add_argument("--db-path", type=Path)
    
    skill_p = subparsers.add_parser("suggest-skill", help="Suggest skill creation")
    skill_p.add_argument("--pattern", required=True)
    skill_p.add_argument("--db-path", type=Path)
    
    agents_p = subparsers.add_parser("suggest-agents-update", help="Suggest AGENTS.md updates")
    agents_p.add_argument("--db-path", type=Path)
    
    args = parser.parse_args()
    
    if args.command == "aggregate":
        result = aggregate_patterns(args.scan_path, args.db_path)
        print(json.dumps(result, indent=2))
    
    elif args.command == "patterns":
        learnings = get_all_learnings(args.db_path)
        print(json.dumps(learnings, indent=2, default=str))
    
    elif args.command == "workflows":
        workflows = identify_common_workflows(args.db_path)
        print(json.dumps(workflows, indent=2))
    
    elif args.command == "suggest-skill":
        suggestion = suggest_skill_creation(args.pattern, args.db_path)
        print(json.dumps(suggestion, indent=2))
    
    elif args.command == "suggest-agents-update":
        proposals = propose_agents_md_updates(args.db_path)
        print(json.dumps(proposals, indent=2))
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
