# Self-Evolving Agent Architecture

## System Overview

The self-evolving agent implements a three-pillar architecture for autonomous improvement:

```mermaid
graph TB
    subgraph "Input Layer"
        U[User Request]
        T[Tool Execution]
        E[Errors/Outcomes]
    end
    
    subgraph "Processing Layer"
        MM[Memory Manager<br/>SQLite + FTS5]
        EE[Evolution Engine<br/>Pattern Analysis]
        CP[Context Preserver<br/>Critical Facts]
        LA[Learning Analyzer<br/>Cross-Project]
    end
    
    subgraph "Storage Layer"
        DB[(memory.db)]
        FS[Brain Directory<br/>Snapshots]
    end
    
    subgraph "Output Layer"
        CI[Context Injection]
        MS[Mutation Suggestions]
        SK[Skill Proposals]
    end
    
    U --> MM
    T --> MM
    E --> EE
    
    MM --> DB
    EE --> DB
    CP --> DB
    CP --> FS
    LA --> DB
    
    DB --> CI
    EE --> MS
    LA --> SK
```

## Component Interaction

### Session Lifecycle

```mermaid
sequenceDiagram
    participant S as Session Start
    participant MM as MemoryManager
    participant EE as EvolutionEngine
    participant CP as ContextPreserver
    participant DB as Database
    participant E as Session End

    S->>MM: load_context(project, task)
    MM->>DB: Query similar sessions
    DB-->>MM: Historical context
    MM-->>S: Inject compressed context
    
    loop Every Tool Call
        S->>MM: store_observation()
        MM->>DB: Insert observation
    end
    
    loop Every 5 Steps
        S->>EE: checkpoint_progress()
        EE->>DB: Analyze patterns
        EE-->>S: Suggestions (if any)
    end
    
    Note over S,CP: Context approaching limit
    S->>CP: flush_critical_facts()
    CP->>DB: Store snapshot
    
    E->>MM: compress_session()
    MM->>DB: Store summary
```

## Data Flow

### Observation Capture

```
Tool Execution
    │
    ▼
┌─────────────────────────────┐
│ store_observation()         │
│ - tool_name                 │
│ - input_data (truncated)    │
│ - output_data (truncated)   │
│ - context_snapshot          │
│ - execution_time_ms         │
│ - success flag              │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ SQLite: observations table  │
│ + FTS5: observations_fts    │
└─────────────────────────────┘
```

### Context Retrieval

```
New Session Start
    │
    ▼
┌─────────────────────────────┐
│ load_context(project, task) │
│                             │
│ 1. Query by project_path    │
│ 2. FTS5 semantic search     │
│ 3. Merge & deduplicate      │
│ 4. Load high-conf learnings │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ Return:                     │
│ - similar_sessions[]        │
│ - relevant_learnings[]      │
│ - suggested_approaches[]    │
└─────────────────────────────┘
```

## Storage Architecture

### SQLite Schema

```
┌──────────────────────────────────────────────────────────────┐
│ sessions                                                      │
├──────────────────────────────────────────────────────────────┤
│ session_id TEXT PK                                           │
│ project_path TEXT NOT NULL                                   │
│ start_time TIMESTAMP                                         │
│ end_time TIMESTAMP                                           │
│ summary TEXT                                                 │
│ token_usage INTEGER                                          │
│ success_score REAL                                           │
└──────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────────────────────────────────────┐
│ observations                                                  │
├──────────────────────────────────────────────────────────────┤
│ observation_id TEXT PK                                       │
│ session_id TEXT FK                                           │
│ timestamp TIMESTAMP                                          │
│ tool_name TEXT                                               │
│ input_data TEXT                                              │
│ output_data TEXT                                             │
│ context_snapshot TEXT                                        │
│ execution_time_ms INTEGER                                    │
│ success BOOLEAN                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ mutations                                                     │
├──────────────────────────────────────────────────────────────┤
│ mutation_id TEXT PK                                          │
│ session_id TEXT FK                                           │
│ inefficiency_type TEXT                                       │
│ mutation_strategy TEXT (JSON)                                │
│ confidence_score REAL                                        │
│ applied BOOLEAN                                              │
│ outcome TEXT                                                 │
│ rollback_data TEXT                                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ learnings                                                     │
├──────────────────────────────────────────────────────────────┤
│ learning_id TEXT PK                                          │
│ pattern_type TEXT                                            │
│ description TEXT                                             │
│ frequency INTEGER                                            │
│ confidence_score REAL                                        │
│ cross_project_refs TEXT (JSON)                               │
│ source_sessions TEXT (JSON)                                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ context_snapshots                                             │
├──────────────────────────────────────────────────────────────┤
│ snapshot_id TEXT PK                                          │
│ session_id TEXT FK                                           │
│ timestamp TIMESTAMP                                          │
│ compressed_context TEXT (JSON)                               │
│ retrieval_priority INTEGER                                   │
│ critical_facts TEXT (JSON)                                   │
└──────────────────────────────────────────────────────────────┘
```

### FTS5 Virtual Tables

Full-text search enabled on:
- `sessions_fts` → summary, task_description
- `observations_fts` → tool_name, context_snapshot
- `learnings_fts` → pattern_type, description

## Integration Points

### Workflow Enhancement

| Workflow | Integration | Trigger |
|----------|-------------|---------|
| `/plan` | Historical context injection | Phase 0.5 |
| `/implement` | Checkpoint progress | Every 5 steps |
| `/debug` | Error pattern lookup | Post-error |

### MCP Tool Hooks (Future)

```python
# Hypothetical integration
@on_tool_execute
def capture_observation(tool_name, input, output, success):
    memory_manager.store_observation(
        session_id=current_session,
        tool_name=tool_name,
        input_data=str(input),
        output_data=str(output),
        success=success
    )
```

## Safety Architecture

```mermaid
graph LR
    M[Mutation Generated]
    C{Confidence > 80%?}
    A{User Approves?}
    R[Rollback Data Saved]
    E[Execute Mutation]
    S[Store Outcome]
    
    M --> C
    C -->|No| D[Discard]
    C -->|Yes| A
    A -->|No| L[Log Rejection]
    A -->|Yes| R
    R --> E
    E --> S
    S --> F[Update Model]
```

### Rate Limiting

- Max 3 mutations per session
- Max recursion depth: 3
- Minimum confidence: 80%

## File System Layout

```
~/.agent/
├── brain/
│   ├── memory.db              # Main SQLite database
│   └── {session-id}/
│       └── context_snapshot.md  # Human-readable snapshot
└── skills/
    └── self-evolving-agent/
        ├── SKILL.md
        ├── scripts/
        │   ├── memory_manager.py
        │   ├── evolution_engine.py
        │   ├── context_preserver.py
        │   └── learning_analyzer.py
        ├── references/
        │   ├── architecture.md
        │   ├── storage_schema.md
        │   └── evolution_strategies.md
        └── assets/
            ├── init_db.sql
            └── config.yaml
```
