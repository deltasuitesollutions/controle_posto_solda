# Inicialização do Banco de Dados

Este diretório contém o script SQL de inicialização que recria toda a estrutura do banco de dados automaticamente quando o container PostgreSQL é criado pela primeira vez.

## Como Funciona

O arquivo `init_database.sql` é montado automaticamente no diretório `/docker-entrypoint-initdb.d/` do container PostgreSQL. O PostgreSQL executa todos os scripts `.sql` encontrados nesse diretório **apenas quando o banco é criado pela primeira vez** (quando o diretório de dados está vazio).

## Recriar a Estrutura do Banco

Para recriar toda a estrutura do banco de dados do zero, você precisa remover o volume do PostgreSQL e recriar o container:

### Opção 1: Remover apenas o volume do banco

```bash
# Parar os containers
docker-compose down

# Remover o volume do PostgreSQL
docker volume rm leitor_postos_postgres_data

# Subir novamente (o script será executado automaticamente)
docker-compose up -d
```

### Opção 2: Remover tudo e recriar

```bash
# Parar e remover containers, volumes e redes
docker-compose down -v

# Subir novamente
docker-compose up -d
```

### Opção 3: Recriar apenas o serviço PostgreSQL

```bash
# Parar o serviço postgres
docker-compose stop postgres

# Remover o container e volume
docker-compose rm -v postgres

# Subir novamente
docker-compose up -d postgres
```

## O que o Script Faz

O script `init_database.sql` cria:

1. **Todas as tabelas** com a estrutura completa:
   - usuarios
   - linhas, sublinhas
   - produtos, modelos, pecas
   - postos, funcionarios
   - operacoes
   - registros_producao
   - operacoes_canceladas
   - audit_log
   - dispositivos_raspberry
   - tags_temporarias
   - posto_configuracao
   - E todas as tabelas de relacionamento

2. **Índices** para melhor performance

3. **Chaves estrangeiras** para integridade referencial

4. **Usuários iniciais**:
   - `admin` / `admin123` (role: admin)
   - `operador` / `operador123` (role: operador)

⚠️ **IMPORTANTE**: Altere as senhas padrão em produção!

## Notas

- O script usa `CREATE TABLE IF NOT EXISTS`, então é seguro executá-lo múltiplas vezes
- O script usa `ON CONFLICT DO NOTHING` para os usuários iniciais, então não duplicará dados
- Se você precisar modificar a estrutura, edite `init_database.sql` e recrie o volume

## Verificar se o Script Foi Executado

Após subir o container, você pode verificar se as tabelas foram criadas:

```bash
# Entrar no container do PostgreSQL
docker-compose exec postgres psql -U postgres -d ManpowerControl

# Listar todas as tabelas
\dt

# Sair
\q
```
