FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema (se necessário)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements do diretório Server
COPY Server/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar a estrutura do projeto mantendo o diretório Server
COPY Server/ ./Server/
COPY database/ ./database/

# Adicionar o diretório raiz ao PYTHONPATH
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Criar usuário não-root para segurança
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import sys; sys.exit(0)" || exit 1

# Executar o app.py do diretório Server
WORKDIR /app
CMD ["python", "Server/app.py"]
