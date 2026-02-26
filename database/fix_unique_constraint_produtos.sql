-- Migração: Modifica a constraint UNIQUE em produtos para ser parcial
-- Isso permite ter múltiplos produtos com o mesmo nome, desde que apenas um não esteja deletado
-- Assim, podemos criar novos registros mesmo quando existe um deletado

-- 1. Remover a constraint UNIQUE existente na coluna nome
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Encontrar o nome da constraint UNIQUE
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'produtos'::regclass 
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
    AND (SELECT attname FROM pg_attribute WHERE attrelid = 'produtos'::regclass AND attnum = conkey[1]) = 'nome';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE produtos DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Constraint UNIQUE % removida com sucesso!', constraint_name;
    ELSE
        RAISE NOTICE 'Nenhuma constraint UNIQUE encontrada na coluna nome.';
    END IF;
END $$;

-- 2. Criar um índice único parcial (apenas para registros não deletados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_nome_unique 
ON produtos(nome) 
WHERE COALESCE(deleted, FALSE) = FALSE;

-- Verificar se o índice foi criado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'produtos' 
        AND indexname = 'idx_produtos_nome_unique'
    ) THEN
        RAISE NOTICE 'Índice único parcial criado com sucesso!';
    ELSE
        RAISE NOTICE 'Erro ao criar índice único parcial.';
    END IF;
END $$;
