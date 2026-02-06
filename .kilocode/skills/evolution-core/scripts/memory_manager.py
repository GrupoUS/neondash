#!/usr/bin/env python3
"""
Memory Manager - Persistent Storage for Self-Evolving Agent

This module provides SQLite + FTS5 (Full-Text Search) based permanent storage
for sessions, observations, mutations, and learnings across all projects.

Usage:
    python3 memory_manager.py init                          # Initialize database
    python3 memory_manager.py load_context --project PATH   # Load historical context
    python3 memory_manager.py store_observation --session-id ID --tool NAME --input DATA --output DATA
    python3 memory_manager.py compress_session --session-id ID --transcript FILE
    python3 memory_manager.py query --text "search query"
"""

import argparse
import hashlib
import json
import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

# Configuration
MAX_RETRIEVAL_LIMIT = 10
TEMPORAL_DECAY_FACTOR = 0.9


def get_project_root() -> Path:
    """
    Detect the project root directory.
    
    Priority order:
    1. EVOLUTION_PROJECT_ROOT environment variable
    2. Walk up directories looking for .git/
    3. Fall back to current working directory
    
    Returns:
        Path to the project root directory
    """
    # Check environment variable first
    env_root = os.getenv("EVOLUTION_PROJECT_ROOT")
    if env_root:
        return Path(env_root)
    
    # Walk up looking for .git directory
    current = Path.cwd()
    for parent in [current, *current.parents]:
        if (parent / ".git").exists():
            return parent
        # Stop at filesystem root
        if parent == parent.parent:
            break
    
    # Fallback to current directory
    return Path.cwd()


def get_default_db_path() -> Path:
    """Get the default database path for the current project."""
    return get_project_root() / ".agent" / "brain" / "memory.db"


# Dynamic default path (project-local)
DEFAULT_DB_PATH = get_default_db_path()


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """Get a connection to the SQLite database."""
    path = db_path or DEFAULT_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def init_database(db_path: Optional[Path] = None) -> None:
    """Initialize the database schema if it doesn't exist."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            project_path TEXT NOT NULL,
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP,
            summary TEXT,
            token_usage INTEGER DEFAULT 0,
            success_score REAL DEFAULT 0.0,
            task_description TEXT,
            conversation_id TEXT
        )
    """)
    
    # Observations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS observations (
            observation_id TEXT PRIMARY KEY,
            session_id TEXT REFERENCES sessions(session_id),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            tool_name TEXT,
            input_data TEXT,
            output_data TEXT,
            context_snapshot TEXT,
            execution_time_ms INTEGER,
            success BOOLEAN DEFAULT TRUE
        )
    """)
    
    # Mutations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mutations (
            mutation_id TEXT PRIMARY KEY,
            session_id TEXT REFERENCES sessions(session_id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            inefficiency_type TEXT,
            mutation_strategy TEXT,
            confidence_score REAL,
            applied BOOLEAN DEFAULT FALSE,
            outcome TEXT,
            rollback_data TEXT
        )
    """)
    
    # Learnings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learnings (
            learning_id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pattern_type TEXT,
            description TEXT,
            frequency INTEGER DEFAULT 1,
            confidence_score REAL DEFAULT 0.5,
            cross_project_refs TEXT,
            source_sessions TEXT
        )
    """)
    
    # Context snapshots table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS context_snapshots (
            snapshot_id TEXT PRIMARY KEY,
            session_id TEXT REFERENCES sessions(session_id),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            compressed_context TEXT,
            retrieval_priority INTEGER DEFAULT 5,
            critical_facts TEXT
        )
    """)
    
    # FTS5 virtual table for semantic search on sessions
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
            session_id,
            summary,
            task_description,
            content='sessions',
            content_rowid='rowid'
        )
    """)
    
    # FTS5 virtual table for observations
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
            observation_id,
            tool_name,
            context_snapshot,
            content='observations',
            content_rowid='rowid'
        )
    """)
    
    # FTS5 virtual table for learnings
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS learnings_fts USING fts5(
            learning_id,
            pattern_type,
            description,
            content='learnings',
            content_rowid='rowid'
        )
    """)
    
    # Triggers to keep FTS in sync
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS sessions_ai AFTER INSERT ON sessions BEGIN
            INSERT INTO sessions_fts(rowid, session_id, summary, task_description)
            VALUES (new.rowid, new.session_id, new.summary, new.task_description);
        END
    """)
    
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS sessions_au AFTER UPDATE ON sessions BEGIN
            INSERT INTO sessions_fts(sessions_fts, rowid, session_id, summary, task_description)
            VALUES ('delete', old.rowid, old.session_id, old.summary, old.task_description);
            INSERT INTO sessions_fts(rowid, session_id, summary, task_description)
            VALUES (new.rowid, new.session_id, new.summary, new.task_description);
        END
    """)
    
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
            INSERT INTO observations_fts(rowid, observation_id, tool_name, context_snapshot)
            VALUES (new.rowid, new.observation_id, new.tool_name, new.context_snapshot);
        END
    """)
    
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS learnings_ai AFTER INSERT ON learnings BEGIN
            INSERT INTO learnings_fts(rowid, learning_id, pattern_type, description)
            VALUES (new.rowid, new.learning_id, new.pattern_type, new.description);
        END
    """)
    
    # Indexes for common queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_path)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_time ON sessions(start_time DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_observations_session ON observations(session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_observations_tool ON observations(tool_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_mutations_session ON mutations(session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_snapshots_session ON context_snapshots(session_id)")
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {db_path or DEFAULT_DB_PATH}")


def create_session(
    project_path: str,
    task_description: str = "",
    conversation_id: str = "",
    db_path: Optional[Path] = None
) -> str:
    """Create a new session and return its ID."""
    session_id = str(uuid4())
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO sessions (session_id, project_path, task_description, conversation_id)
        VALUES (?, ?, ?, ?)
    """, (session_id, project_path, task_description, conversation_id))
    
    conn.commit()
    conn.close()
    return session_id


def load_context(
    project_path: str,
    task_description: str = "",
    limit: int = 5,
    db_path: Optional[Path] = None
) -> dict[str, Any]:
    """
    Load relevant historical context for a project/task combination.
    
    Returns:
        Dictionary with:
        - similar_sessions: List of relevant past sessions
        - relevant_learnings: Applicable patterns and lessons
        - suggested_approaches: Proven strategies from history
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    result = {
        "similar_sessions": [],
        "relevant_learnings": [],
        "suggested_approaches": [],
        "context_injected": False
    }
    
    # Find sessions from the same project
    cursor.execute("""
        SELECT session_id, task_description, summary, start_time, success_score
        FROM sessions
        WHERE project_path = ?
        ORDER BY start_time DESC
        LIMIT ?
    """, (project_path, limit))
    
    project_sessions = [dict(row) for row in cursor.fetchall()]
    result["similar_sessions"].extend(project_sessions)
    
    # If task description provided, search for semantically similar sessions
    if task_description:
        cursor.execute("""
            SELECT session_id, task_description, summary, start_time, success_score
            FROM sessions
            WHERE session_id IN (
                SELECT session_id FROM sessions_fts
                WHERE sessions_fts MATCH ?
                ORDER BY rank
                LIMIT ?
            )
        """, (task_description, limit))
        
        semantic_sessions = [dict(row) for row in cursor.fetchall()]
        
        # Merge and deduplicate
        seen_ids = {s["session_id"] for s in result["similar_sessions"]}
        for session in semantic_sessions:
            if session["session_id"] not in seen_ids:
                result["similar_sessions"].append(session)
    
    # Load relevant learnings
    if task_description:
        cursor.execute("""
            SELECT learning_id, pattern_type, description, frequency, confidence_score
            FROM learnings
            WHERE learning_id IN (
                SELECT learning_id FROM learnings_fts
                WHERE learnings_fts MATCH ?
                ORDER BY rank
                LIMIT ?
            )
            ORDER BY confidence_score DESC, frequency DESC
        """, (task_description, limit))
        
        result["relevant_learnings"] = [dict(row) for row in cursor.fetchall()]
    
    # Load high-confidence learnings regardless of task
    cursor.execute("""
        SELECT learning_id, pattern_type, description, frequency, confidence_score
        FROM learnings
        WHERE confidence_score >= 0.8
        ORDER BY frequency DESC, confidence_score DESC
        LIMIT ?
    """, (limit,))
    
    high_confidence = [dict(row) for row in cursor.fetchall()]
    seen_learning_ids = {l["learning_id"] for l in result["relevant_learnings"]}
    for learning in high_confidence:
        if learning["learning_id"] not in seen_learning_ids:
            result["relevant_learnings"].append(learning)
    
    # Generate suggested approaches from successful sessions
    cursor.execute("""
        SELECT DISTINCT summary
        FROM sessions
        WHERE project_path = ? AND success_score >= 0.7 AND summary IS NOT NULL
        ORDER BY success_score DESC
        LIMIT 3
    """, (project_path,))
    
    result["suggested_approaches"] = [row["summary"] for row in cursor.fetchall()]
    result["context_injected"] = bool(result["similar_sessions"] or result["relevant_learnings"])
    
    conn.close()
    return result


def store_observation(
    session_id: str,
    tool_name: str,
    input_data: str,
    output_data: str,
    context_snapshot: str = "",
    execution_time_ms: int = 0,
    success: bool = True,
    db_path: Optional[Path] = None
) -> str:
    """Store a tool usage observation."""
    observation_id = str(uuid4())
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Truncate large data to prevent database bloat
    max_data_size = 10000  # 10KB per field
    input_truncated = input_data[:max_data_size] if len(input_data) > max_data_size else input_data
    output_truncated = output_data[:max_data_size] if len(output_data) > max_data_size else output_data
    
    cursor.execute("""
        INSERT INTO observations (
            observation_id, session_id, tool_name, input_data, output_data,
            context_snapshot, execution_time_ms, success
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        observation_id, session_id, tool_name, input_truncated, output_truncated,
        context_snapshot, execution_time_ms, success
    ))
    
    conn.commit()
    conn.close()
    return observation_id


def compress_session(
    session_id: str,
    summary: str,
    success_score: float = 0.5,
    token_usage: int = 0,
    db_path: Optional[Path] = None
) -> None:
    """
    Compress and finalize a session with AI-generated summary.
    
    Args:
        session_id: The session to compress
        summary: AI-generated summary of the session
        success_score: 0.0-1.0 score of session success
        token_usage: Approximate token count used
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE sessions
        SET end_time = CURRENT_TIMESTAMP,
            summary = ?,
            success_score = ?,
            token_usage = ?
        WHERE session_id = ?
    """, (summary, success_score, token_usage, session_id))
    
    conn.commit()
    conn.close()
    print(f"✅ Session {session_id[:8]}... compressed")


def query_similar_sessions(
    query_text: str,
    limit: int = 5,
    db_path: Optional[Path] = None
) -> list[dict[str, Any]]:
    """
    Query for sessions similar to the given text using FTS5.
    
    Args:
        query_text: Natural language query
        limit: Maximum results to return
        
    Returns:
        List of matching sessions with relevance info
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Clean query for FTS5
    clean_query = " ".join(query_text.split())
    
    cursor.execute("""
        SELECT s.session_id, s.project_path, s.task_description, s.summary,
               s.start_time, s.success_score, s.token_usage
        FROM sessions s
        WHERE s.session_id IN (
            SELECT session_id FROM sessions_fts
            WHERE sessions_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        )
        ORDER BY s.start_time DESC
    """, (clean_query, limit))
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return results


def get_session_observations(
    session_id: str,
    db_path: Optional[Path] = None
) -> list[dict[str, Any]]:
    """Get all observations for a session."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT observation_id, timestamp, tool_name, input_data, output_data,
               context_snapshot, execution_time_ms, success
        FROM observations
        WHERE session_id = ?
        ORDER BY timestamp ASC
    """, (session_id,))
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return results


def store_learning(
    pattern_type: str,
    description: str,
    source_sessions: list[str],
    confidence_score: float = 0.5,
    cross_project_refs: list[str] = None,
    db_path: Optional[Path] = None
) -> str:
    """Store a new learning pattern."""
    learning_id = str(uuid4())
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO learnings (
            learning_id, pattern_type, description, confidence_score,
            cross_project_refs, source_sessions
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        learning_id,
        pattern_type,
        description,
        confidence_score,
        json.dumps(cross_project_refs or []),
        json.dumps(source_sessions)
    ))
    
    conn.commit()
    conn.close()
    return learning_id


def update_learning_frequency(
    learning_id: str,
    increment: int = 1,
    db_path: Optional[Path] = None
) -> None:
    """Increment the frequency of a learning pattern."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE learnings
        SET frequency = frequency + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE learning_id = ?
    """, (increment, learning_id))
    
    conn.commit()
    conn.close()


def get_statistics(db_path: Optional[Path] = None) -> dict[str, Any]:
    """Get database statistics."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    stats = {}
    
    cursor.execute("SELECT COUNT(*) as count FROM sessions")
    stats["total_sessions"] = cursor.fetchone()["count"]
    
    cursor.execute("SELECT COUNT(*) as count FROM observations")
    stats["total_observations"] = cursor.fetchone()["count"]
    
    cursor.execute("SELECT COUNT(*) as count FROM mutations")
    stats["total_mutations"] = cursor.fetchone()["count"]
    
    cursor.execute("SELECT COUNT(*) as count FROM learnings")
    stats["total_learnings"] = cursor.fetchone()["count"]
    
    cursor.execute("SELECT COUNT(DISTINCT project_path) as count FROM sessions")
    stats["unique_projects"] = cursor.fetchone()["count"]
    
    cursor.execute("SELECT AVG(success_score) as avg FROM sessions WHERE success_score > 0")
    row = cursor.fetchone()
    stats["avg_success_score"] = round(row["avg"], 2) if row["avg"] else 0
    
    conn.close()
    return stats


def main():
    parser = argparse.ArgumentParser(description="Memory Manager for Self-Evolving Agent")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Init command
    init_parser = subparsers.add_parser("init", help="Initialize the database")
    init_parser.add_argument("--db-path", type=Path, help="Database path")
    
    # Load context command
    load_parser = subparsers.add_parser("load_context", help="Load historical context")
    load_parser.add_argument("--project", required=True, help="Project path")
    load_parser.add_argument("--task", default="", help="Task description")
    load_parser.add_argument("--limit", type=int, default=5, help="Result limit")
    load_parser.add_argument("--db-path", type=Path, help="Database path")
    
    # Store observation command
    store_parser = subparsers.add_parser("store_observation", help="Store a tool observation")
    store_parser.add_argument("--session-id", required=True, help="Session ID")
    store_parser.add_argument("--tool", required=True, help="Tool name")
    store_parser.add_argument("--input", required=True, help="Input data")
    store_parser.add_argument("--output", required=True, help="Output data")
    store_parser.add_argument("--context", default="", help="Context snapshot")
    store_parser.add_argument("--db-path", type=Path, help="Database path")
    
    # Compress session command
    compress_parser = subparsers.add_parser("compress_session", help="Compress and finalize a session")
    compress_parser.add_argument("--session-id", required=True, help="Session ID")
    compress_parser.add_argument("--summary", required=True, help="Session summary")
    compress_parser.add_argument("--score", type=float, default=0.5, help="Success score 0-1")
    compress_parser.add_argument("--tokens", type=int, default=0, help="Token usage")
    compress_parser.add_argument("--db-path", type=Path, help="Database path")
    
    # Query command
    query_parser = subparsers.add_parser("query", help="Query similar sessions")
    query_parser.add_argument("--text", required=True, help="Query text")
    query_parser.add_argument("--limit", type=int, default=5, help="Result limit")
    query_parser.add_argument("--db-path", type=Path, help="Database path")
    
    # Stats command
    stats_parser = subparsers.add_parser("stats", help="Show database statistics")
    stats_parser.add_argument("--db-path", type=Path, help="Database path")
    
    # === SIMPLIFIED COMMANDS ===
    
    # Session command (start/end)
    session_parser = subparsers.add_parser("session", help="Manage active session")
    session_sub = session_parser.add_subparsers(dest="session_action")
    
    session_start = session_sub.add_parser("start", help="Start a new session")
    session_start.add_argument("--task", "-t", required=True, help="Task description")
    
    session_end = session_sub.add_parser("end", help="End current session")
    session_end.add_argument("--summary", "-s", required=True, help="Session summary")
    session_end.add_argument("--score", type=float, default=0.8, help="Success score 0-1")
    
    # Capture command (simplest - just a description)
    capture_parser = subparsers.add_parser("capture", help="Quick capture observation")
    capture_parser.add_argument("description", help="What happened (e.g., 'fixed auth bug in login.tsx')")
    capture_parser.add_argument("--tool", "-t", default="agent_action", help="Tool/action name")
    
    args = parser.parse_args()
    
    # Session file for tracking active session
    session_file = DEFAULT_DB_PATH.parent / ".current_session"
    
    if args.command == "init":
        init_database(args.db_path)
    
    elif args.command == "load_context":
        context = load_context(args.project, args.task, args.limit, args.db_path)
        print(json.dumps(context, indent=2, default=str))
    
    elif args.command == "store_observation":
        obs_id = store_observation(
            args.session_id, args.tool, args.input, args.output,
            args.context, db_path=args.db_path
        )
        print(f"✅ Observation stored: {obs_id}")
    
    elif args.command == "compress_session":
        compress_session(args.session_id, args.summary, args.score, args.tokens, args.db_path)
    
    elif args.command == "query":
        results = query_similar_sessions(args.text, args.limit, args.db_path)
        print(json.dumps(results, indent=2, default=str))
    
    elif args.command == "stats":
        stats = get_statistics(args.db_path)
        print(json.dumps(stats, indent=2))
    
    elif args.command == "session":
        if args.session_action == "start":
            # Auto-init if needed
            if not DEFAULT_DB_PATH.exists():
                init_database()
            # Create session
            session_id = create_session(
                project_path=str(get_project_root()),
                task_description=args.task
            )
            # Save session ID to file
            session_file.write_text(session_id)
            print(f"✅ Session started: {session_id}")
            print(f"   Task: {args.task}")
            print(f"   Saved to: {session_file}")
            
        elif args.session_action == "end":
            if session_file.exists():
                session_id = session_file.read_text().strip()
                compress_session(session_id, args.summary, args.score, 0)
                session_file.unlink()  # Remove session file
                print(f"✅ Session ended: {session_id}")
                print(f"   Summary: {args.summary}")
            else:
                print("⚠️ No active session found")
    
    elif args.command == "capture":
        # Auto-init if needed
        if not DEFAULT_DB_PATH.exists():
            init_database()
        
        # Get or create session
        if session_file.exists():
            session_id = session_file.read_text().strip()
        else:
            # Auto-create session
            session_id = create_session(
                project_path=str(get_project_root()),
                task_description="Auto-session"
            )
            session_file.write_text(session_id)
            print(f"📝 Auto-created session: {session_id}")
        
        # Store observation
        obs_id = store_observation(
            session_id=session_id,
            tool_name=args.tool,
            input_data=args.description,
            output_data="captured",
            context_snapshot=""
        )
        print(f"✅ Captured: {args.description}")
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

