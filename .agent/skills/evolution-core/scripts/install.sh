#!/bin/bash

# Instalação de dependências do sistema
echo "Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y python3-pip

# Instalação de pacotes Python
echo "Installing Python packages..."
pip3 install --upgrade pip
pip3 install fastapi uvicorn chromadb pysqlite3-binary requests python-dotenv

echo "Installation complete."
