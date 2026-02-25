# Arquitetura API-First

## Visão Geral

Este projeto segue uma arquitetura **API-First**, onde o frontend (site) **NUNCA** acessa o banco de dados diretamente. Todas as comunicações passam exclusivamente pela API REST.

## Fluxo de Dados

```
┌─────────────┐         HTTP/REST          ┌─────────────┐         SQL          ┌─────────────┐
│   Frontend  │ ──────────────────────────> │     API     │ ──────────────────> │   Database  │
│   (React)   │ <────────────────────────── │  (Flask)    │ <────────────────── │ (PostgreSQL)│
└─────────────┘         JSON Response      └─────────────┘      Query Results  └─────────────┘
```

## Estrutura de Camadas

### 1. Frontend (Web/)
- **Localização**: `Web/src/`
- **Responsabilidade**: Interface do usuário e interação
- **Comunicação**: Apenas via HTTP para `http://localhost:8000/api`
- **Arquivo principal**: `Web/src/api/api.ts`

**Regras:**
- ❌ **NÃO** pode importar modelos do backend
- ❌ **NÃO** pode ter dependências de banco de dados (psycopg2, sqlalchemy, etc.)
- ❌ **NÃO** pode fazer queries SQL diretas
- ✅ **DEVE** usar apenas `fetchAPI()` do arquivo `api.ts`
- ✅ **DEVE** fazer todas as requisições via HTTP

### 2. API (Server/)
A API é dividida em 3 camadas:

#### 2.1 Controllers (`Server/controller/`)
- **Responsabilidade**: Receber requisições HTTP e retornar respostas JSON
- **Exemplo**: `modelos_controller.py`, `funcionarios_controller.py`
- **Regras:**
  - Recebe dados via `request.get_json()`
  - Chama services para lógica de negócio
  - Retorna JSON via `jsonify()`
  - **NÃO** acessa o banco diretamente

#### 2.2 Services (`Server/services/`)
- **Responsabilidade**: Lógica de negócio e orquestração
- **Exemplo**: `modelos_service.py`, `funcionarios_service.py`
- **Regras:**
  - Contém a lógica de negócio
  - Chama models para acesso a dados
  - **NÃO** acessa o banco diretamente (usa models)

#### 2.3 Models (`Server/models/`)
- **Responsabilidade**: Acesso ao banco de dados
- **Exemplo**: `modelo.py`, `funcionario.py`
- **Regras:**
  - Única camada que acessa o banco de dados
  - Usa `DatabaseConnection` para queries
  - Retorna objetos Python ou dicionários

## Exemplo de Fluxo Completo

### Frontend → API → Database

**1. Frontend faz requisição:**
```typescript
// Web/src/api/api.ts
export const modelosAPI = {
  listar: () => fetchAPI('/modelos'),
  criar: (data) => fetchAPI('/modelos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}
```

**2. Controller recebe e valida:**
```python
# Server/controller/modelos_controller.py
@modelos_bp.route('', methods=['GET'])
def listar_modelos():
    modelos = modelos_service.listar_modelos()
    return jsonify(modelos)
```

**3. Service aplica lógica de negócio:**
```python
# Server/services/modelos_service.py
def listar_modelos():
    modelos = Modelo.listar_todos()
    # Processar dados...
    return resultado
```

**4. Model acessa o banco:**
```python
# Server/models/modelo.py
@classmethod
def listar_todos(cls):
    query = "SELECT * FROM modelos"
    resultados = DatabaseConnection.execute_query(query, fetch_all=True)
    # Converter para objetos...
    return modelos
```

## Configuração da API

### URL Base
- **Desenvolvimento**: `http://localhost:8000/api`
- **Produção**: Configurar via variável de ambiente

### Headers
Todas as requisições incluem:
- `Content-Type: application/json`
- `X-User-Id`: ID do usuário autenticado (quando disponível)

### Autenticação
- Login via `/api/usuarios/login`
- Token/sessão gerenciado pelo backend
- Frontend armazena informações do usuário no `localStorage`

## Verificações de Segurança

### ✅ Checklist Frontend
- [ ] Não há imports de `Server/` ou `database/`
- [ ] Não há dependências de banco no `package.json`
- [ ] Todas as chamadas usam `fetchAPI()` de `api.ts`
- [ ] Não há queries SQL no código TypeScript/React

### ✅ Checklist Backend
- [ ] Controllers não acessam banco diretamente
- [ ] Services não acessam banco diretamente (usam models)
- [ ] Apenas models usam `DatabaseConnection`
- [ ] Todas as rotas estão registradas em `app.py`

## Benefícios desta Arquitetura

1. **Segurança**: Frontend não tem acesso direto ao banco
2. **Manutenibilidade**: Lógica centralizada na API
3. **Escalabilidade**: Fácil adicionar novos clientes (mobile, desktop)
4. **Testabilidade**: Cada camada pode ser testada independentemente
5. **Validação**: Validações centralizadas na API

## Troubleshooting

### Erro: "Cannot find module 'Server'"
- **Causa**: Frontend tentando importar código do backend
- **Solução**: Usar API HTTP ao invés de imports diretos

### Erro: "Module not found: 'psycopg2'"
- **Causa**: Dependência de banco no frontend
- **Solução**: Remover dependência e usar API

### Dados não aparecem
- **Causa**: API não está rodando ou endpoint incorreto
- **Solução**: Verificar se `http://localhost:8000/api` está acessível

## Manutenção

Ao adicionar novas funcionalidades:

1. **Novo endpoint?**
   - Criar controller em `Server/controller/`
   - Registrar blueprint em `app.py`
   - Adicionar função em `Web/src/api/api.ts`

2. **Nova tabela?**
   - Criar model em `Server/models/`
   - Criar service em `Server/services/`
   - Criar controller em `Server/controller/`
   - Adicionar API client no frontend

3. **Nova página?**
   - Criar componente em `Web/src/Pages/`
   - Usar funções de `api.ts`
   - **NUNCA** importar models do backend

