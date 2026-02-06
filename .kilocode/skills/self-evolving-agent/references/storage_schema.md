# Storage Schema Reference

## Overview

The self-evolving agent uses SQLite with FTS5 (Full-Text Search) for persistent storage.
All data is stored in `~/.agent/brain/memory.db`.

## Tables

### sessions

Stores metadata about each agent session.

```sql
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    project_path TEXT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    summary TEXT,
    token_usage INTEGER DEFAULT 0,
    success_score REAL DEFAULT 0.0,
    task_description TEXT,
    conversation_id TEXT
);

CREATE INDEX idx_sessions_project ON sessions(project_path);
CREATE INDEX idx_sessions_time ON sessions(start_time DESC);
```

| Column | Type | Description |
|--------|------|-------------|
| session_id | TEXT | UUID primary key |
| project_path | TEXT | Absolute path to project |
| start_time | TIMESTAMP | Session start |
| end_time | TIMESTAMP | Session end (null if active) |
| summary | TEXT | AI-generated session summary |
| token_usage | INTEGER | Approximate tokens used |
| success_score | REAL | 0.0-1.0 success rating |
| task_description | TEXT | Initial task description |
| conversation_id | TEXT | External conversation ID |

### observations

Captures every tool usage during sessions.

```sql
CREATE TABLE observations (
    observation_id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(session_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tool_name TEXT,
    input_data TEXT,
    output_data TEXT,
    context_snapshot TEXT,
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_observations_session ON observations(session_id);
CREATE INDEX idx_observations_tool ON observations(tool_name);
```

| Column | Type | Description |
|--------|------|-------------|
| observation_id | TEXT | UUID primary key |
| session_id | TEXT | Parent session |
| timestamp | TIMESTAMP | When tool was executed |
| tool_name | TEXT | Name of the tool |
| input_data | TEXT | Truncated input (max 10KB) |
| output_data | TEXT | Truncated output (max 10KB) |
| context_snapshot | TEXT | Brief context description |
| execution_time_ms | INTEGER | Execution time |
| success | BOOLEAN | Whether tool succeeded |

### mutations

Stores generated and applied mutations.

```sql
CREATE TABLE mutations (
    mutation_id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(session_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inefficiency_type TEXT,
    mutation_strategy TEXT,
    confidence_score REAL,
    applied BOOLEAN DEFAULT FALSE,
    outcome TEXT,
    rollback_data TEXT
);

CREATE INDEX idx_mutations_session ON mutations(session_id);
```

| Column | Type | Description |
|--------|------|-------------|
| mutation_id | TEXT | UUID primary key |
| session_id | TEXT | Origin session |
| created_at | TIMESTAMP | Creation time |
| inefficiency_type | TEXT | Type of inefficiency detected |
| mutation_strategy | TEXT | JSON strategy object |
| confidence_score | REAL | 0.0-1.0 confidence |
| applied | BOOLEAN | Whether mutation was applied |
| outcome | TEXT | Result after application |
| rollback_data | TEXT | Data needed to rollback |

### learnings

Cross-project patterns and lessons.

```sql
CREATE TABLE learnings (
    learning_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pattern_type TEXT,
    description TEXT,
    frequency INTEGER DEFAULT 1,
    confidence_score REAL DEFAULT 0.5,
    cross_project_refs TEXT,
    source_sessions TEXT
);
```

| Column | Type | Description |
|--------|------|-------------|
| learning_id | TEXT | UUID primary key |
| pattern_type | TEXT | Category of pattern |
| description | TEXT | Human-readable description |
| frequency | INTEGER | How often pattern occurred |
| confidence_score | REAL | 0.0-1.0 confidence |
| cross_project_refs | TEXT | JSON array of project paths |
| source_sessions | TEXT | JSON array of session IDs |

### context_snapshots

Pre-compaction context preservation.

```sql
CREATE TABLE context_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(session_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    compressed_context TEXT,
    retrieval_priority INTEGER DEFAULT 5,
    critical_facts TEXT
);

CREATE INDEX idx_snapshots_session ON context_snapshots(session_id);
```

| Column | Type | Description |
|--------|------|-------------|
| snapshot_id | TEXT | UUID primary key |
| session_id | TEXT | Parent session |
| timestamp | TIMESTAMP | When snapshot was taken |
| compressed_context | TEXT | JSON compressed context |
| retrieval_priority | INTEGER | 1-10 priority score |
| critical_facts | TEXT | JSON critical facts |

## FTS5 Virtual Tables

### sessions_fts

```sql
CREATE VIRTUAL TABLE sessions_fts USING fts5(
    session_id,
    summary,
    task_description,
    content='sessions',
    content_rowid='rowid'
);
```

### observations_fts

```sql
CREATE VIRTUAL TABLE observations_fts USING fts5(
    observation_id,
    tool_name,
    context_snapshot,
    content='observations',
    content_rowid='rowid'
);
```

### learnings_fts

```sql
CREATE VIRTUAL TABLE learnings_fts USING fts5(
    learning_id,
    pattern_type,
    description,
    content='learnings',
    content_rowid='rowid'
);
```

## Triggers

Automatic FTS sync:

```sql
-- Keep sessions_fts in sync
CREATE TRIGGER sessions_ai AFTER INSERT ON sessions BEGIN
    INSERT INTO sessions_fts(rowid, session_id, summary, task_description)
    VALUES (new.rowid, new.session_id, new.summary, new.task_description);
END;

CREATE TRIGGER sessions_au AFTER UPDATE ON sessions BEGIN
    INSERT INTO sessions_fts(sessions_fts, rowid, session_id, summary, task_description)
    VALUES ('delete', old.rowid, old.session_id, old.summary, old.task_description);
    INSERT INTO sessions_fts(rowid, session_id, summary, task_description)
    VALUES (new.rowid, new.session_id, new.summary, new.task_description);
END;
```

## Common Queries

### Find similar sessions

```sql
SELECT * FROM sessions
WHERE session_id IN (
    SELECT session_id FROM sessions_fts
    WHERE sessions_fts MATCH 'authentication error'
    ORDER BY rank
    LIMIT 5
);
```

### Get session success rate

```sql
SELECT 
    project_path,
    AVG(success_score) as avg_success,
    COUNT(*) as session_count
FROM sessions
GROUP BY project_path
ORDER BY avg_success DESC;
```

### Find common error patterns

```sql
SELECT 
    tool_name,
    COUNT(*) as error_count
FROM observations
WHERE success = FALSE
GROUP BY tool_name
HAVING error_count > 5
ORDER BY error_count DESC;
```
