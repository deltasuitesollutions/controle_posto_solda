-- Script de migração: Adiciona coluna turno na tabela registros_producao
-- Esta coluna armazena o turno específico de cada registro baseado na hora de início

-- ============================================
-- ADICIONAR COLUNA TURNO
-- ============================================
ALTER TABLE registros_producao 
ADD COLUMN IF NOT EXISTS turno TEXT;

-- ============================================
-- CRIAR ÍNDICE PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_registros_producao_turno ON registros_producao(turno);

-- ============================================
-- MIGRAR DADOS EXISTENTES (OPCIONAL)
-- ============================================
-- Calcular turno baseado na hora_inicio dos registros existentes
-- Matutino: 06:00 - 11:59
-- Vespertino: 12:00 - 17:59
-- Noturno: 18:00 - 05:59
UPDATE registros_producao
SET turno = CASE
    WHEN hora_inicio IS NOT NULL THEN
        CASE
            WHEN hora_inicio::time >= '06:00'::time AND hora_inicio::time < '12:00'::time THEN 'matutino'
            WHEN hora_inicio::time >= '12:00'::time AND hora_inicio::time < '18:00'::time THEN 'vespertino'
            ELSE 'noturno'
        END
    WHEN inicio IS NOT NULL THEN
        CASE
            WHEN EXTRACT(HOUR FROM inicio) >= 6 AND EXTRACT(HOUR FROM inicio) < 12 THEN 'matutino'
            WHEN EXTRACT(HOUR FROM inicio) >= 12 AND EXTRACT(HOUR FROM inicio) < 18 THEN 'vespertino'
            ELSE 'noturno'
        END
    ELSE NULL
END
WHERE turno IS NULL;
