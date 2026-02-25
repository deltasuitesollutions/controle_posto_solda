# Diagrama de Fluxo - Sistema de Configuração

## Fluxo Principal

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURAÇÃO DO LÍDER                      │
│  (Feita uma vez, pode ser alterada a qualquer momento)        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Líder seleciona:                     │
        │  • Posto: P1                          │
        │  • Operador: João (12345)             │
        │  • Peça: PROD_A - Produto A           │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │  Salva no Banco:                      │
        │  posto_configuracao                   │
        │  {                                    │
        │    posto: "P1",                       │
        │    funcionario: "12345",              │
        │    modelo: "PROD_A"                   │
        │  }                                    │
        └───────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│              REGISTRO DE ENTRADA (Operador)                  │
│  (Pode ser feito várias vezes ao longo do dia)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Operador no card do posto:           │
        │  • Seleciona: João (12345)            │
        │  • Clica: "Registrar Entrada"          │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │  Sistema busca configuração:          │
        │  GET /api/posto-configuracao/P1       │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │  Sistema encontra:                   │
        │  {                                    │
        │    posto: "P1",                       │
        │    funcionario: "12345",              │
        │    modelo: "PROD_A"  ← USA ISSO!     │
        │  }                                    │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │  Cria registro de produção:          │
        │  POST /api/producao/entrada           │
        │  {                                    │
        │    posto: "P1",                       │
        │    funcionario: "12345",              │
        │    modelo: "PROD_A" ← Automático!    │
        │    data: "2024-01-15",                │
        │    hora_inicio: "10:30"               │
        │  }                                    │
        └───────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │  Salva no Banco:                      │
        │  producao_registros                   │
        │  {                                    │
        │    posto: "P1",                       │
        │    funcionario: "12345",              │
        │    modelo: "PROD_A",                  │
        │    data: "2024-01-15",                │
        │    hora_inicio: "10:30",              │
        │    status: "em_producao"              │
        │  }                                    │
        └───────────────────────────────────────┘
```

## Cenário: Líder Troca a Peça

```
┌─────────────────────────────────────────────────────────────┐
│  SITUAÇÃO INICIAL                                            │
│  Configuração: P1 → PROD_A                                   │
│  Operador bate entrada → Produz PROD_A                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Líder muda configuração:             │
        │  P1 → PROD_B (nova peça)              │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │  Operador bate saída:                 │
        │  Fecha registro de PROD_A             │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │  Operador bate nova entrada:          │
        │  Sistema busca configuração           │
        │  Encontra: PROD_B ← NOVA PEÇA!        │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │  Cria novo registro:                  │
        │  PROD_B (automaticamente)             │
        └───────────────────────────────────────┘
```

## Estrutura de Dados

```
┌─────────────────────────────────────┐
│  posto_configuracao                  │
│  (1 registro por posto)              │
├─────────────────────────────────────┤
│  P1 → João → PROD_A                  │
│  P2 → Maria → PROD_B                 │
│  P3 → Pedro → PROD_C                 │
└─────────────────────────────────────┘
              │
              │ Usado para
              ▼
┌─────────────────────────────────────┐
│  producao_registros                  │
│  (Múltiplos registros por dia)       │
├─────────────────────────────────────┤
│  P1 → João → PROD_A → 10:30-12:00   │
│  P1 → João → PROD_B → 13:00-18:00   │
│  P2 → Maria → PROD_B → 10:00-18:00  │
└─────────────────────────────────────┘
```

## Pontos-Chave

1. **Configuração é única por posto** - Cada posto (P1, P2, P3) tem uma configuração
2. **Configuração pode ser atualizada** - Líder pode trocar a qualquer momento
3. **Peça vem sempre da configuração** - Operador nunca seleciona a peça
4. **Operador pode ser opcional** - Se não selecionar, usa da configuração
5. **Sistema busca automaticamente** - Tanto no frontend quanto no backend













