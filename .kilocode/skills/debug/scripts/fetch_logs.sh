#!/bin/bash
# Debug Skill - Error Log Fetcher
# Aggregates logs from Neon and Railway for error analysis

set -e

echo "📋 Fetching error logs..."
echo ""

# Railway deployment logs (if available)
if command -v railway &> /dev/null; then
    echo "🚂 Railway Logs (errors only):"
    echo "--------------------------------"
    railway logs --filter="level:error" 2>/dev/null || echo "No Railway logs available"
    echo ""
else
    echo "⚠️  Railway CLI not installed"
    echo "   Install: npm install -g @railway/cli"
    echo ""
fi

# Neon database info (if available)
if command -v neonctl &> /dev/null; then
    echo "🐘 Neon Database Status:"
    echo "------------------------"
    neonctl projects list 2>/dev/null || echo "No Neon projects available"
    echo ""
    echo "💡 For slow queries, use MCP tool: mcp_mcp-server-neon_list_slow_queries"
else
    echo "⚠️  Neon CLI not installed"
    echo "   Install: npm install -g neonctl"
    echo ""
fi

echo "✅ Log fetch complete!"
