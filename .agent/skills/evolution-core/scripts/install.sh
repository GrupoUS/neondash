#!/bin/bash
# Evolution Core - Installation Script (Simplified)
#
# This script sets up the evolution-core skill.
# No external dependencies required - uses built-in Python sqlite3 module.

set -e

echo "🧬 Evolution Core - Setup"
echo "========================="

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1)
echo "✓ Python: $PYTHON_VERSION"

# Check SQLite support (built into Python)
python3 -c "import sqlite3; print(f'✓ SQLite: {sqlite3.sqlite_version}')"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Initialize database
echo ""
echo "Initializing memory database..."
python3 "$SCRIPT_DIR/memory_manager.py" init

echo ""
echo "✅ Evolution Core installed successfully!"
echo ""
echo "Usage:"
echo "  python3 $SCRIPT_DIR/memory_manager.py --help    # Memory operations"
echo "  python3 $SCRIPT_DIR/heartbeat.py                # Run self-check"
echo "  python3 $SCRIPT_DIR/nightly_review.py           # Generate learnings"
echo ""
echo "Database location: ~/.agent/brain/memory.db"
