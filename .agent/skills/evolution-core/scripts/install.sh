#!/bin/bash
# Evolution Core - Installation Script (Simplified)
#
# This script sets up the evolution-core skill.
# No external dependencies required - uses built-in Python sqlite3 module.

set -e

echo "🧬 Evolution Core - Setup"
echo "========================="

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1)
echo "✓ Python: $PYTHON_VERSION"

# Check SQLite support (built into Python)
python3 -c "import sqlite3; print(f'✓ SQLite: {sqlite3.sqlite_version}')"

# Initialize database
echo ""
echo "📦 Initializing memory database..."
python3 "$SCRIPT_DIR/memory_manager.py" init

# Verify all scripts work
echo ""
echo "🔍 Verifying scripts..."
python3 "$SCRIPT_DIR/memory_manager.py" stats > /dev/null && echo "  ✓ memory_manager.py"
python3 "$SCRIPT_DIR/heartbeat.py" --help > /dev/null 2>&1 && echo "  ✓ heartbeat.py"
python3 "$SCRIPT_DIR/nightly_review.py" --help > /dev/null 2>&1 && echo "  ✓ nightly_review.py"
python3 "$SCRIPT_DIR/setup_hooks.py" --help > /dev/null 2>&1 && echo "  ✓ setup_hooks.py"

echo ""
echo "✅ Evolution Core installed successfully!"
echo ""
echo "Database: ~/.agent/brain/memory.db"
echo ""

# Ask about hook installation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Would you like to install IDE hooks? [y/N]"
read -r INSTALL_HOOKS

if [[ "$INSTALL_HOOKS" =~ ^[Yy]$ ]]; then
    echo ""
    python3 "$SCRIPT_DIR/setup_hooks.py"
else
    echo ""
    echo "📌 To install hooks later, run:"
    echo "   python3 $SCRIPT_DIR/setup_hooks.py"
fi

echo ""
echo "🚀 Quick Commands:"
echo "   python3 $SCRIPT_DIR/memory_manager.py stats    # View stats"
echo "   python3 $SCRIPT_DIR/heartbeat.py               # Self-check"
echo "   python3 $SCRIPT_DIR/nightly_review.py          # Daily review"
