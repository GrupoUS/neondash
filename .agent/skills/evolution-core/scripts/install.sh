#!/bin/bash

echo "🧬 Evolution Core - Installation Script"
echo "========================================"
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✓ Python 3 detected: $(python3 --version)"
echo ""

# Atualizar sistema (opcional)
echo "📦 Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq python3-pip > /dev/null 2>&1
elif command -v brew &> /dev/null; then
    brew install python3 > /dev/null 2>&1
fi

# Instalar pacotes Python
echo "📚 Installing Python packages..."
pip3 install --upgrade pip --quiet
pip3 install --quiet fastapi uvicorn chromadb pysqlite3-binary requests python-dotenv

if [ $? -eq 0 ]; then
    echo "✅ Python packages installed successfully"
else
    echo "❌ Failed to install Python packages"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Installation complete!"
echo "========================================"
echo ""
echo "📚 Next steps:"
echo "  1. Configure hooks: python3 scripts/setup_hooks.py"
echo "  2. Set up environment: cp scripts/.env.example scripts/.env"
echo "  3. Edit scripts/.env with your API keys"
echo "  4. Start worker: bash scripts/run_worker.sh"
echo "  5. Copy assets: cp -r assets/* /your/workspace/"
echo ""
echo "💡 For detailed instructions, see README.md"
echo ""
