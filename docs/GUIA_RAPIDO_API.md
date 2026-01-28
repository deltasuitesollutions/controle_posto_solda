# Guia Rápido - Arquitetura API-First

## ✅ O que foi implementado

Sua aplicação já está seguindo a arquitetura API-First corretamente! O frontend **não acessa o banco de dados diretamente**.

## 📋 Checklist de Verificação

Execute o script de verificação para garantir que tudo está correto:

```bash
python scripts/verificar_arquitetura.py
```

## 🎯 Regras Básicas

### Frontend (Web/src/)
- ✅ **USE**: `fetchAPI()` de `src/api/api.ts`
- ❌ **NÃO USE**: Imports de `Server/` ou `database/`
- ❌ **NÃO ADICIONE**: Dependências de banco no `package.json`

### Backend (Server/)
- **Controllers**: Recebem HTTP → Chamam Services → Retornam JSON
- **Services**: Lógica de negócio → Chamam Models
- **Models**: Única camada que acessa o banco

## 📝 Exemplo de Uso

### No Frontend:
```typescript
import { modelosAPI } from '../api/api'

// ✅ CORRETO
const modelos = await modelosAPI.listar()

// ❌ ERRADO
import { Modelo } from '../../../Server/models/modelo'  // NÃO FAÇA ISSO!
```

### Adicionando Novo Endpoint:

1. **Backend**: Criar controller em `Server/controller/`
2. **Backend**: Registrar blueprint em `Server/app.py`
3. **Frontend**: Adicionar função em `Web/src/api/api.ts`
4. **Frontend**: Usar a função no componente

## 🔍 Verificação Automática

O script `scripts/verificar_arquitetura.py` verifica:
- ✅ Frontend não importa backend
- ✅ Frontend não tem dependências de banco
- ✅ Controllers não acessam banco diretamente
- ✅ Services usam models (com alguns avisos aceitáveis)

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `docs/ARQUITETURA_API.md` - Documentação completa
- `scripts/README.md` - Como usar o script de verificação

## ⚠️ Avisos Comuns

Se o script mostrar avisos sobre services acessando banco diretamente:
- Isso é **aceitável** em alguns casos (queries complexas)
- O ideal seria criar models específicos
- O importante é que **controllers** não acessem banco diretamente

## 🚀 Próximos Passos

1. Execute o script de verificação regularmente
2. Ao adicionar novas funcionalidades, siga o padrão existente
3. Se encontrar código que viola a arquitetura, refatore para usar a API

