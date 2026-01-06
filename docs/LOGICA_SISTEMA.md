# Lógica do Sistema de Configuração de Postos

## Visão Geral

O sistema permite que o **líder** configure previamente qual **operador** vai produzir qual **peça** em cada **posto**.
Quando o operador bater o ponto (entrada/saída), o sistema usa automaticamente essas configurações.

---

## Fluxo Completo do Sistema

###  **Configuração pelo Líder** (Prévia)

```
Líder acessa → Seção "Configuração do Líder"
    ↓
Seleciona POSTO (P1, P2 ou P3)
    ↓
Seleciona OPERADOR (ex: João - 12345)
    ↓
Seleciona PEÇA (ex: PROD_A - Produto A)
    ↓
Clica em "Salvar Configuração"
    ↓
Sistema salva no banco: posto_configuracao
```

**Estrutura no Banco de Dados:**
```sql
posto_configuracao
├── posto: "P1"
├── funcionario_matricula: "12345"
├── modelo_codigo: "PROD_A"
└── data_atualizacao: "2024-01-15 10:30:00"
```

---

### **Registro de Entrada pelo Operador**

Quando o operador vai registrar entrada:

```
Operador seleciona apenas o OPERADOR no card do posto
    ↓
Clica em "Registrar Entrada"
    ↓
Sistema busca configuração do posto automaticamente
    ↓
    ├─ Se encontrou configuração:
    │   ├─ Usa a PEÇA configurada pelo líder
    │   └─ Se operador não foi selecionado, usa o da configuração
    │
    └─ Se não encontrou:
        └─ Retorna erro pedindo para configurar
    ↓
Cria registro de produção com:
    ├─ posto: "P1"
    ├─ funcionario_matricula: "12345" (do select ou da config)
    ├─ modelo_codigo: "PROD_A" (da configuração)
    ├─ data: "2024-01-15"
    ├─ hora_inicio: "10:30"
    └─ turno: 1 ou 2 (calculado automaticamente)
```

---

## Código - Como Funciona

### **Backend: Serviço de Produção** (`producao_service.py`)

```python
def registrar_entrada(posto, funcionario_matricula, modelo_codigo=None):
    # 1. Busca a configuração do posto no banco
    config = PostoConfiguracao.buscar_por_posto(posto)
    
    # 2. Se operador não foi informado, usa da configuração
    if not funcionario_matricula and config:
        funcionario_matricula = config.funcionario_matricula
    
    # 3. Se peça não foi informada, usa da configuração
    if not modelo_codigo and config:
        modelo_codigo = config.modelo_codigo
    
    # 4. Valida se tem tudo necessário
    if not funcionario_matricula or not modelo_codigo:
        raise Exception("Falta informação...")
    
    # 5. Cria o registro de produção
    registro = ProducaoRegistro.criar(...)
```

### **Frontend: JavaScript** (`simulator.js`)

```javascript
async function registrarEntrada(posto) {
    // 1. Pega o operador selecionado (ou vazio)
    let funcionarioMatricula = funcionarioSelect.value;
    
    // 2. Busca configuração do posto na API
    const configResponse = await fetch(`/api/posto-configuracao/${posto}`);
    const configData = await configResponse.json();
    
    // 3. Se não selecionou operador, usa da configuração
    if (!funcionarioMatricula && configData.configuracao) {
        funcionarioMatricula = configData.configuracao.funcionario_matricula;
    }
    
    // 4. SEMPRE usa a peça da configuração
    let modeloCodigo = configData.configuracao.modelo_codigo;
    
    // 5. Envia para API registrar entrada
    fetch('/api/producao/entrada', {
        posto: posto,
        funcionario_matricula: funcionarioMatricula,
        modelo_codigo: modeloCodigo  // ← Sempre da configuração!
    });
}
```

---

## Cenários de Uso

### **Cenário 1: Líder configura, operador bate ponto**

1. **Líder**: Configura P1 → Operador: João → Peça: PROD_A
2. **Operador**: Seleciona "João" e clica "Registrar Entrada"
3. **Sistema**: Usa automaticamente PROD_A (da configuração)
4. **Resultado**: Registro criado com João + PROD_A

### **Cenário 2: Líder troca a peça no meio do dia**

1. **Manhã**: Líder configura P1 → Peça: PROD_A
2. **Operador**: Bate entrada → Produz PROD_A
3. **Tarde**: Líder muda configuração P1 → Peça: PROD_B
4. **Operador**: Bate saída (fecha PROD_A) e nova entrada
5. **Sistema**: Usa automaticamente PROD_B (nova configuração)
6. **Resultado**: Novo registro com PROD_B

### **Cenário 3: Operador não seleciona nada**

1. **Líder**: Configura P1 → Operador: João → Peça: PROD_A
2. **Operador**: Não seleciona nada, apenas clica "Registrar Entrada"
3. **Sistema**: 
   - Usa operador da configuração (João)
   - Usa peça da configuração (PROD_A)
4. **Resultado**: Registro criado automaticamente

---

## Estrutura do Banco de Dados

### **Tabela: `posto_configuracao`**

```sql
CREATE TABLE posto_configuracao (
    id INTEGER PRIMARY KEY,
    posto TEXT UNIQUE NOT NULL,           -- P1, P2, P3
    funcionario_matricula TEXT,            -- 12345 (opcional)
    modelo_codigo TEXT,                    -- PROD_A (obrigatório)
    data_atualizacao DATETIME             -- Quando foi atualizado
);
```

**Exemplo de dados:**
```
| id | posto | funcionario_matricula | modelo_codigo | data_atualizacao        |
|----|-------|----------------------|---------------|-------------------------|
| 1  | P1    | 12345                | PROD_A        | 2024-01-15 10:30:00     |
| 2  | P2    | 45454                | PROD_B        | 2024-01-15 10:35:00     |
| 3  | P3    | NULL                 | PROD_C        | 2024-01-15 10:40:00     |
```

### **Tabela: `producao_registros`** (já existia)

```sql
CREATE TABLE producao_registros (
    id INTEGER PRIMARY KEY,
    posto TEXT NOT NULL,                  -- P1
    funcionario_matricula TEXT,           -- 12345
    modelo_codigo TEXT,                    -- PROD_A (vem da configuração)
    data DATE,                             -- 2024-01-15
    hora_inicio TIME,                      -- 10:30
    hora_fim TIME,                         -- 18:00
    turno INTEGER,                         -- 1 ou 2
    status TEXT                            -- 'em_producao' ou 'finalizado'
);
```

---

## Fluxo de Dados Detalhado

```
┌─────────────────┐
│   FRONTEND      │
│  (Interface)    │
└────────┬────────┘
         │
         │ 1. Líder configura
         ▼
┌─────────────────┐
│   API POST      │
│ /api/posto-     │
│ configuracao/   │
└────────┬────────┘
         │
         │ 2. Salva no banco
         ▼
┌─────────────────┐
│   BANCO DE      │
│   DADOS         │
│ posto_configuracao│
└─────────────────┘

         ═══════════════════════════════

┌─────────────────┐
│   FRONTEND      │
│  Operador bate  │
│  ponto          │
└────────┬────────┘
         │
         │ 3. Busca configuração
         ▼
┌─────────────────┐
│   API GET       │
│ /api/posto-     │
│ configuracao/P1 │
└────────┬────────┘
         │
         │ 4. Retorna config
         ▼
┌─────────────────┐
│   FRONTEND      │
│  Usa peça da    │
│  configuração   │
└────────┬────────┘
         │
         │ 5. Registra entrada
         ▼
┌─────────────────┐
│   API POST      │
│ /api/producao/  │
│ entrada         │
└────────┬────────┘
         │
         │ 6. Backend busca config
         │    (fallback se não veio)
         ▼
┌─────────────────┐
│   BACKEND       │
│  producao_service│
│  .registrar_    │
│  entrada()      │
└────────┬────────┘
         │
         │ 7. Cria registro
         ▼
┌─────────────────┐
│   BANCO DE      │
│   DADOS         │
│ producao_registros│
└─────────────────┘
```

---

## Vantagens desta Abordagem

1. **Flexibilidade**: Líder pode trocar peça a qualquer momento
2. **Automação**: Operador não precisa saber qual peça produzir
3. **Rastreabilidade**: Sempre sabemos qual peça foi produzida
4. **Simplicidade**: Interface mais limpa (sem campo de peça no registro)
5. **Consistência**: Garante que a peça correta seja registrada

---

## Validações e Tratamento de Erros

### **Se não houver configuração:**
- Sistema retorna erro: "Configure a peça para este posto na seção 'Configuração do Líder'!"

### **Se operador não for selecionado e não houver na config:**
- Sistema retorna erro: "Selecione o operador ou configure o posto previamente!"

### **Se tentar registrar entrada sem configuração:**
- Sistema bloqueia e pede para configurar primeiro

---

## Resumo em 3 Passos

1. **Líder configura** → Define operador e peça para cada posto
2. **Operador bate ponto** → Seleciona apenas o operador (ou usa o configurado)
3. **Sistema usa automaticamente** → A peça configurada pelo líder é aplicada

---

**Fim da Documentação**

