# Scripts de Verificação

## verificar_arquitetura.py

Script que verifica se a arquitetura API-First está sendo respeitada.

### O que verifica:

1. **Frontend (Web/src/)**:
   - ❌ Não deve importar código do backend (`Server/`, `database/`)
   - ❌ Não deve ter dependências de banco de dados
   - ❌ Não deve executar queries SQL
   - ✅ Deve usar `fetchAPI()` para comunicação

2. **Controllers (Server/controller/)**:
   - ⚠️ Não devem acessar banco diretamente (devem usar services)

3. **Services (Server/services/)**:
   - ⚠️ Não devem acessar banco diretamente (devem usar models)

4. **package.json**:
   - ❌ Não deve ter dependências de banco (psycopg2, sqlalchemy, etc.)

### Como usar:

```bash
# Na raiz do projeto
python scripts/verificar_arquitetura.py
```

### Saída:

- ✅ **Verde**: Tudo correto
- ⚠️ **Amarelo**: Avisos (não críticos, mas devem ser revisados)
- ❌ **Vermelho**: Erros críticos que violam a arquitetura

### Exemplo de saída:

```
🔍 VERIFICAÇÃO DE ARQUITETURA API-FIRST
======================================================================

📱 Verificando Frontend (Web/src/)...
  ✅ Nenhum acesso direto ao banco encontrado no frontend

📦 Verificando package.json do frontend...
  ✅ Nenhuma dependência de banco encontrada

🎮 Verificando Controllers (Server/controller/)...
  ✅ Controllers não acessam banco diretamente

⚙️  Verificando Services (Server/services/)...
  ✅ Services não acessam banco diretamente (usam models)

🔌 Verificando uso de API no frontend...
  ✅ Arquivos estão usando a API corretamente

======================================================================
📊 RESUMO
======================================================================
  ❌ Erros críticos: 0
  ⚠️  Avisos: 0

  ✅ Arquitetura API-First está correta!
```

### Integração com CI/CD:

Você pode adicionar este script ao seu pipeline de CI/CD:

```yaml
# .github/workflows/verify-architecture.yml
- name: Verificar Arquitetura
  run: python scripts/verificar_arquitetura.py
```

