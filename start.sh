#!/bin/bash

# Script de inicialização rápida do projeto

set -e

echo "🚀 Iniciando Leitor Postos..."

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env a partir do exemplo..."
    cp env.example .env
    echo "⚠️  Por favor, edite o arquivo .env com suas configurações antes de continuar!"
    echo "   Especialmente: senhas, SECRET_KEY e CORS_ORIGINS"
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Perguntar modo
echo ""
echo "Escolha o modo:"
echo "1) Desenvolvimento (hot-reload, portas expostas)"
echo "2) Produção (build otimizado, Nginx)"
read -p "Digite sua escolha (1 ou 2): " mode

if [ "$mode" = "1" ]; then
    echo "🔧 Iniciando em modo DESENVOLVIMENTO..."
    docker-compose up --build
elif [ "$mode" = "2" ]; then
    echo "🏭 Iniciando em modo PRODUÇÃO..."
    docker-compose -f docker-compose.prod.yml up --build -d
    echo ""
    echo "✅ Serviços iniciados em background!"
    echo "📊 Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "🛑 Parar: docker-compose -f docker-compose.prod.yml down"
else
    echo "❌ Opção inválida!"
    exit 1
fi

