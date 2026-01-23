@echo off
REM Script de inicialização rápida do projeto (Windows)

echo 🚀 Iniciando Leitor Postos...

REM Verificar se .env existe
if not exist .env (
    echo 📝 Criando arquivo .env a partir do exemplo...
    copy env.example .env
    echo ⚠️  Por favor, edite o arquivo .env com suas configurações antes de continuar!
    echo    Especialmente: senhas, SECRET_KEY e CORS_ORIGINS
    pause
    exit /b 1
)

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando. Por favor, inicie o Docker primeiro.
    pause
    exit /b 1
)

REM Perguntar modo
echo.
echo Escolha o modo:
echo 1) Desenvolvimento (hot-reload, portas expostas)
echo 2) Produção (build otimizado, Nginx)
set /p mode="Digite sua escolha (1 ou 2): "

if "%mode%"=="1" (
    echo 🔧 Iniciando em modo DESENVOLVIMENTO...
    docker-compose up --build
) else if "%mode%"=="2" (
    echo 🏭 Iniciando em modo PRODUÇÃO...
    docker-compose -f docker-compose.prod.yml up --build -d
    echo.
    echo ✅ Serviços iniciados em background!
    echo 📊 Ver logs: docker-compose -f docker-compose.prod.yml logs -f
    echo 🛑 Parar: docker-compose -f docker-compose.prod.yml down
) else (
    echo ❌ Opção inválida!
    pause
    exit /b 1
)

pause

