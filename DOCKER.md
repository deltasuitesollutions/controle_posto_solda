# 🐳 Guia de Dockerização - Leitor Postos

Este guia explica como executar o projeto completo usando Docker e Docker Compose.

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## 🚀 Início Rápido

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e ajuste as variáveis:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações (especialmente senhas e secrets).

### 2. Iniciar em Desenvolvimento

```bash
docker-compose up --build
```

Isso irá:
- ✅ Subir o PostgreSQL
- ✅ Subir o Backend Flask na porta 8000
- ✅ Subir o Frontend Vite na porta 5173 (com hot-reload)

### 3. Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/api/health

## 🏗️ Estrutura de Arquivos Docker

```
.
├── docker-compose.yml          # Desenvolvimento
├── docker-compose.prod.yml    # Produção
├── .env                       # Variáveis de ambiente (não versionado)
├── env.example                # Exemplo de variáveis
├── Server/
│   ├── Dockerfile            # Backend
│   └── .dockerignore
└── Web/
    ├── Dockerfile             # Frontend (dev)
    ├── Dockerfile.prod        # Frontend (produção)
    ├── nginx.conf             # Configuração Nginx
    └── .dockerignore
```

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
# Iniciar todos os serviços
docker-compose up

# Iniciar em background
docker-compose up -d

# Reconstruir imagens
docker-compose up --build

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Parar e remover volumes (⚠️ apaga dados do banco)
docker-compose down -v
```

### Produção

```bash
# Iniciar em modo produção
docker-compose -f docker-compose.prod.yml up --build -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar
docker-compose -f docker-compose.prod.yml down
```

## 📦 Serviços

### PostgreSQL
- **Container**: `postgres_db`
- **Porta**: 5432 (desenvolvimento)
- **Volume**: `postgres_data`
- **Health Check**: Automático

### Backend (Flask)
- **Container**: `backend_api`
- **Porta**: 8000
- **Health Check**: `/api/health`
- **Dependências**: PostgreSQL

### Frontend (Vite/Nginx)
- **Container**: `frontend_app` (dev) / `frontend_prod` (prod)
- **Porta**: 5173 (dev) / 80 (prod)
- **Dependências**: Backend

## 🌐 Variáveis de Ambiente

### Banco de Dados
```env
POSTGRES_DB=postos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_segura
```

### Backend
```env
FLASK_ENV=development
FLASK_PORT=8000
SECRET_KEY=sua_chave_secreta
DB_HOST=postgres
DB_NAME=postos
DB_USER=postgres
DB_PASSWORD=sua_senha_segura
```

### Frontend
```env
VITE_API_URL=http://localhost:8000
VITE_API_BACKEND_URL=http://backend:8000
```

## 🔒 Segurança em Produção

### Checklist de Produção

- [ ] Alterar todas as senhas padrão no `.env`
- [ ] Gerar `SECRET_KEY` forte (use: `python -c "import secrets; print(secrets.token_hex(32))"`)
- [ ] Configurar `CORS_ORIGINS` com domínios reais
- [ ] Usar `docker-compose.prod.yml` (com Nginx)
- [ ] Não expor porta do PostgreSQL publicamente
- [ ] Configurar SSL/TLS (HTTPS) no Nginx
- [ ] Revisar permissões de volumes
- [ ] Habilitar logs e monitoramento

### Exemplo de SECRET_KEY Segura

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## 🚀 Deploy em Produção

### 1. Preparar Ambiente

```bash
# Copiar e configurar variáveis
cp env.example .env
# Editar .env com valores de produção
```

### 2. Build e Iniciar

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### 3. Verificar Status

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔍 Troubleshooting

### Backend não conecta ao banco

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Ver logs do PostgreSQL
docker-compose logs postgres

# Verificar variáveis de ambiente
docker-compose exec backend env | grep DB_
```

### Frontend não carrega

```bash
# Verificar logs do frontend
docker-compose logs frontend

# Verificar se backend está acessível
curl http://localhost:8000/api/health
```

### Limpar tudo e recomeçar

```bash
# Parar e remover tudo
docker-compose down -v

# Remover imagens
docker-compose down --rmi all

# Limpar cache do Docker
docker system prune -a
```

## 📊 Monitoramento

### Health Checks

Todos os serviços têm health checks configurados:

```bash
# Verificar saúde dos containers
docker-compose ps

# Health check manual do backend
curl http://localhost:8000/api/health
```

### Logs

```bash
# Todos os logs
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 🛠️ Desenvolvimento

### Hot Reload

O frontend tem hot-reload habilitado em desenvolvimento através de volumes:

```yaml
volumes:
  - ./Web:/app
  - /app/node_modules
```

### Acessar Container

```bash
# Backend
docker-compose exec backend bash

# Frontend
docker-compose exec frontend sh

# PostgreSQL
docker-compose exec postgres psql -U postgres -d postos
```

## 📝 Notas Importantes

1. **Volumes**: Os dados do PostgreSQL são persistidos no volume `postgres_data`
2. **Rede**: Todos os serviços estão na mesma rede Docker (`app-network`)
3. **Comunicação Interna**: Use nomes de serviços (ex: `backend`, `postgres`) para comunicação entre containers
4. **Portas**: Em produção, apenas o frontend (porta 80) deve ser exposto publicamente

## 🔄 Atualizações

Para atualizar o projeto:

```bash
# Parar serviços
docker-compose down

# Atualizar código
git pull

# Reconstruir e iniciar
docker-compose up --build -d
```

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Documentation](https://vitejs.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)

