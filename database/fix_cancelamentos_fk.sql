-- Script para corrigir a foreign key da tabela operacoes_canceladas
-- Esta correção é necessária pois a FK com ON DELETE CASCADE estava
-- deletando os cancelamentos quando o registro de produção era removido

-- PROBLEMA: Quando um registro é cancelado:
-- 1. O cancelamento é inserido em operacoes_canceladas com registro_id
-- 2. O registro original é deletado de registros_producao
-- 3. A FK com ON DELETE CASCADE deletava automaticamente o cancelamento!

-- SOLUÇÃO: Remover a foreign key constraint pois o registro original
-- será deletado de qualquer forma após o cancelamento ser salvo

-- 1. Encontrar o nome da constraint de foreign key existente
-- Execute este comando para ver o nome da constraint:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'operacoes_canceladas'::regclass AND confrelid = 'registros_producao'::regclass;

-- 2. Remover a foreign key constraint (substitua pelo nome correto se diferente)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Encontrar o nome da constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'operacoes_canceladas'::regclass 
    AND confrelid = 'registros_producao'::regclass;
    
    -- Se encontrou, remover
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE operacoes_canceladas DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Foreign key constraint % removida com sucesso!', constraint_name;
    ELSE
        RAISE NOTICE 'Nenhuma foreign key constraint encontrada para remover.';
    END IF;
END $$;

-- Verificar se a constraint foi removida
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'operacoes_canceladas'::regclass;
