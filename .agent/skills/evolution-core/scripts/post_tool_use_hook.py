#!/usr/bin/env python3
"""
Post Tool Use Hook - Simplified Version

Captures tool usage observations and stores them directly via memory_manager.
No external API calls, no HTTP requests.

Usage:
    Called automatically by agent hooks after each tool use.
    Reads tool observation from stdin as JSON.
"""

import json
import os
import sys
from pathlib import Path

# Import memory_manager from same directory
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

try:
    from memory_manager import store_observation, init_database, create_session, DEFAULT_DB_PATH
except ImportError:
    # Fallback if import fails
    def store_observation(*args, **kwargs):
        pass
    def init_database(*args, **kwargs):
        pass
    def create_session(*args, **kwargs):
        return "unknown"
    DEFAULT_DB_PATH = Path.home() / ".agent" / "brain" / "memory.db"


def get_or_create_session_id() -> str:
    """Get session ID from environment or create a new one."""
    session_id = os.getenv("EVOLUTION_SESSION_ID")
    if not session_id:
        # Use conversation ID if available
        session_id = os.getenv("CONVERSATION_ID", "default-session")
    return session_id


def main():
    """Main function - captures tool observation and stores it."""
    try:
        # Ensure database exists (auto-initialize if needed)
        db_dir = DEFAULT_DB_PATH.parent
        if not db_dir.exists():
            db_dir.mkdir(parents=True, exist_ok=True)
        if not DEFAULT_DB_PATH.exists():
            init_database()
        
        # Read observation from stdin
        if sys.stdin.isatty():
            # No stdin data, exit silently
            return
        
        observation = json.load(sys.stdin)
        
        # Extract relevant fields
        tool_name = observation.get("tool_name", "unknown")
        tool_input = observation.get("tool_input", {})
        tool_output = observation.get("tool_output", "")
        
        # Get session ID
        session_id = get_or_create_session_id()
        
        # Store observation
        store_observation(
            session_id=session_id,
            tool_name=tool_name,
            input_data=json.dumps(tool_input) if isinstance(tool_input, dict) else str(tool_input),
            output_data=json.dumps(tool_output) if isinstance(tool_output, (dict, list)) else str(tool_output)[:1000],
            context_snapshot=observation.get("context", ""),
            success=observation.get("success", True)
        )
        
    except json.JSONDecodeError:
        # Invalid JSON input, exit silently
        pass
    except Exception as e:
        # Log error to temp file, don't block agent flow
        error_log = Path("/tmp/evolution_core_hook_error.log")
        with open(error_log, "a") as f:
            f.write(f"Error in post_tool_use_hook: {e}\n")


if __name__ == "__main__":
    main()
