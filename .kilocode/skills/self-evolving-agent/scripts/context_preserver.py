#!/usr/bin/env python3
"""
Context Preserver - Pre-Compaction Flush Mechanism

Preserves critical context before summarization to ensure important information
survives context window limits.

Usage:
    python3 context_preserver.py extract --conversation "conversation text"
    python3 context_preserver.py flush --session-id ID --facts "critical facts"
    python3 context_preserver.py load --session-id ID
"""

import argparse
import json
import re
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

DEFAULT_DB_PATH = Path.home() / ".agent" / "brain" / "memory.db"
BRAIN_DIR = Path.home() / ".agent" / "brain"


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    path = db_path or DEFAULT_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def extract_critical_facts(conversation: str) -> dict[str, Any]:
    """
    Extract critical facts from conversation context using pattern matching.
    
    Returns structured critical facts including:
    - Current task state
    - Key decisions made
    - Unresolved issues
    - Important file paths
    - Code references
    """
    facts = {
        "task_state": "",
        "decisions": [],
        "blockers": [],
        "file_paths": [],
        "code_refs": [],
        "key_findings": [],
        "next_steps": []
    }
    
    # Extract file paths
    file_patterns = [
        r'`([/\w\-.]+\.[a-zA-Z]{2,5})`',  # `/path/to/file.ext`
        r'file:///([^\s\)]+)',             # file:///path
        r'(?:view_file|read_file|write_to_file)[^\n]*?([/\w\-.]+\.[a-zA-Z]{2,5})'
    ]
    
    for pattern in file_patterns:
        matches = re.findall(pattern, conversation)
        facts["file_paths"].extend(matches)
    facts["file_paths"] = list(set(facts["file_paths"]))[:20]  # Dedupe, limit
    
    # Extract code references (function/class names)
    code_patterns = [
        r'(?:function|def|class|const|let|var)\s+(\w+)',
        r'`(\w+)\(\)`',  # function calls
        r'`(\w+\.\w+)`'  # method references
    ]
    
    for pattern in code_patterns:
        matches = re.findall(pattern, conversation)
        facts["code_refs"].extend(matches)
    facts["code_refs"] = list(set(facts["code_refs"]))[:30]
    
    # Extract decisions (look for keywords)
    decision_patterns = [
        r'(?:decided|choosing|selected|using|will use|approach:)\s*([^\n.]+)',
        r'(?:solution|fix):\s*([^\n.]+)'
    ]
    
    for pattern in decision_patterns:
        matches = re.findall(pattern, conversation, re.IGNORECASE)
        facts["decisions"].extend(matches[:5])
    
    # Extract blockers/issues
    blocker_patterns = [
        r'(?:error|issue|problem|blocked|failing):\s*([^\n]+)',
        r'(?:TODO|FIXME|BUG):\s*([^\n]+)'
    ]
    
    for pattern in blocker_patterns:
        matches = re.findall(pattern, conversation, re.IGNORECASE)
        facts["blockers"].extend(matches[:5])
    
    # Extract key findings
    finding_patterns = [
        r'(?:found|discovered|noticed|identified):\s*([^\n]+)',
        r'(?:insight|observation):\s*([^\n]+)'
    ]
    
    for pattern in finding_patterns:
        matches = re.findall(pattern, conversation, re.IGNORECASE)
        facts["key_findings"].extend(matches[:5])
    
    return facts


def flush_to_snapshot(
    session_id: str,
    critical_facts: dict[str, Any],
    retrieval_priority: int = 5,
    db_path: Optional[Path] = None
) -> str:
    """
    Store critical facts as a context snapshot.
    
    Also writes a human-readable markdown file for easy inspection.
    """
    snapshot_id = str(uuid4())
    compressed_context = json.dumps(critical_facts)
    
    # Store in database
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO context_snapshots (
            snapshot_id, session_id, compressed_context,
            retrieval_priority, critical_facts
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        snapshot_id,
        session_id,
        compressed_context,
        retrieval_priority,
        json.dumps(critical_facts)
    ))
    
    conn.commit()
    conn.close()
    
    # Write human-readable file
    session_dir = BRAIN_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    
    snapshot_file = session_dir / "context_snapshot.md"
    content = f"""# Context Snapshot
**Session:** {session_id}
**Created:** {datetime.now().isoformat()}
**Priority:** {retrieval_priority}

## Task State
{critical_facts.get('task_state', 'Not captured')}

## Key Decisions
{chr(10).join('- ' + d for d in critical_facts.get('decisions', [])) or 'None recorded'}

## Blockers/Issues
{chr(10).join('- ' + b for b in critical_facts.get('blockers', [])) or 'None recorded'}

## Important Files
{chr(10).join('- `' + f + '`' for f in critical_facts.get('file_paths', [])[:10]) or 'None tracked'}

## Code References
{chr(10).join('- `' + c + '`' for c in critical_facts.get('code_refs', [])[:10]) or 'None tracked'}

## Key Findings
{chr(10).join('- ' + f for f in critical_facts.get('key_findings', [])) or 'None recorded'}

## Next Steps
{chr(10).join('- ' + s for s in critical_facts.get('next_steps', [])) or 'Not specified'}
"""
    
    snapshot_file.write_text(content)
    print(f"✅ Snapshot saved: {snapshot_id[:8]}...")
    return snapshot_id


def load_snapshot(
    session_id: str,
    db_path: Optional[Path] = None
) -> Optional[dict[str, Any]]:
    """Load the most recent snapshot for a session."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT snapshot_id, timestamp, compressed_context, retrieval_priority
        FROM context_snapshots
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """, (session_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        "snapshot_id": row["snapshot_id"],
        "timestamp": row["timestamp"],
        "critical_facts": json.loads(row["compressed_context"]),
        "retrieval_priority": row["retrieval_priority"]
    }


def calculate_retrieval_priority(
    snapshot: dict[str, Any],
    current_task: str = ""
) -> int:
    """Calculate retrieval priority based on relevance to current task."""
    base_priority = 5
    facts = snapshot.get("critical_facts", {})
    
    # Boost priority if snapshot has blockers
    if facts.get("blockers"):
        base_priority += 2
    
    # Boost if task keywords match
    if current_task:
        task_words = set(current_task.lower().split())
        snapshot_words = set()
        for key in ["task_state", "decisions", "key_findings"]:
            value = facts.get(key, "")
            if isinstance(value, str):
                snapshot_words.update(value.lower().split())
            elif isinstance(value, list):
                for item in value:
                    snapshot_words.update(str(item).lower().split())
        
        overlap = len(task_words & snapshot_words)
        base_priority += min(overlap, 3)
    
    return min(base_priority, 10)


def get_recent_snapshots(
    project_path: str = "",
    limit: int = 5,
    db_path: Optional[Path] = None
) -> list[dict[str, Any]]:
    """Get recent snapshots, optionally filtered by project."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    if project_path:
        cursor.execute("""
            SELECT cs.*, s.project_path
            FROM context_snapshots cs
            JOIN sessions s ON cs.session_id = s.session_id
            WHERE s.project_path = ?
            ORDER BY cs.timestamp DESC
            LIMIT ?
        """, (project_path, limit))
    else:
        cursor.execute("""
            SELECT * FROM context_snapshots
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "snapshot_id": row["snapshot_id"],
            "session_id": row["session_id"],
            "timestamp": row["timestamp"],
            "priority": row["retrieval_priority"],
            "facts": json.loads(row["compressed_context"])
        })
    
    conn.close()
    return results


def main():
    parser = argparse.ArgumentParser(description="Context Preserver")
    subparsers = parser.add_subparsers(dest="command")
    
    extract_p = subparsers.add_parser("extract", help="Extract critical facts")
    extract_p.add_argument("--conversation", required=True, help="Conversation text")
    
    flush_p = subparsers.add_parser("flush", help="Flush to snapshot")
    flush_p.add_argument("--session-id", required=True)
    flush_p.add_argument("--facts", required=True, help="JSON critical facts")
    flush_p.add_argument("--priority", type=int, default=5)
    flush_p.add_argument("--db-path", type=Path)
    
    load_p = subparsers.add_parser("load", help="Load snapshot")
    load_p.add_argument("--session-id", required=True)
    load_p.add_argument("--db-path", type=Path)
    
    recent_p = subparsers.add_parser("recent", help="Get recent snapshots")
    recent_p.add_argument("--project", default="")
    recent_p.add_argument("--limit", type=int, default=5)
    recent_p.add_argument("--db-path", type=Path)
    
    args = parser.parse_args()
    
    if args.command == "extract":
        facts = extract_critical_facts(args.conversation)
        print(json.dumps(facts, indent=2))
    
    elif args.command == "flush":
        facts = json.loads(args.facts)
        snapshot_id = flush_to_snapshot(args.session_id, facts, args.priority, args.db_path)
        print(json.dumps({"snapshot_id": snapshot_id}))
    
    elif args.command == "load":
        snapshot = load_snapshot(args.session_id, args.db_path)
        print(json.dumps(snapshot, indent=2, default=str))
    
    elif args.command == "recent":
        snapshots = get_recent_snapshots(args.project, args.limit, args.db_path)
        print(json.dumps(snapshots, indent=2, default=str))
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
