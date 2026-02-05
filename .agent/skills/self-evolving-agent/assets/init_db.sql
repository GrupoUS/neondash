-- Self-Evolving Agent Database Schema
-- SQLite with FTS5 for semantic search

-- Sessions table
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
);

-- Observations table
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
);

-- Mutations table
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
);

-- Learnings table
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
);

-- Context snapshots table
CREATE TABLE IF NOT EXISTS context_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(session_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    compressed_context TEXT,
    retrieval_priority INTEGER DEFAULT 5,
    critical_facts TEXT
);

-- FTS5 virtual tables for semantic search
CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
    session_id,
    summary,
    task_description,
    content='sessions',
    content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
    observation_id,
    tool_name,
    context_snapshot,
    content='observations',
    content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS learnings_fts USING fts5(
    learning_id,
    pattern_type,
    description,
    content='learnings',
    content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS sessions_ai AFTER INSERT ON sessions BEGIN
    INSERT INTO sessions_fts(rowid, session_id, summary, task_description)
    VALUES (new.rowid, new.session_id, new.summary, new.task_description);
END;

CREATE TRIGGER IF NOT EXISTS sessions_au AFTER UPDATE ON sessions BEGIN
    INSERT INTO sessions_fts(sessions_fts, rowid, session_id, summary, task_description)
    VALUES ('delete', old.rowid, old.session_id, old.summary, old.task_description);
    INSERT INTO sessions_fts(rowid, session_id, summary, task_description)
    VALUES (new.rowid, new.session_id, new.summary, new.task_description);
END;

CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
    INSERT INTO observations_fts(rowid, observation_id, tool_name, context_snapshot)
    VALUES (new.rowid, new.observation_id, new.tool_name, new.context_snapshot);
END;

CREATE TRIGGER IF NOT EXISTS learnings_ai AFTER INSERT ON learnings BEGIN
    INSERT INTO learnings_fts(rowid, learning_id, pattern_type, description)
    VALUES (new.rowid, new.learning_id, new.pattern_type, new.description);
END;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_path);
CREATE INDEX IF NOT EXISTS idx_sessions_time ON sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_observations_session ON observations(session_id);
CREATE INDEX IF NOT EXISTS idx_observations_tool ON observations(tool_name);
CREATE INDEX IF NOT EXISTS idx_mutations_session ON mutations(session_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_session ON context_snapshots(session_id);
