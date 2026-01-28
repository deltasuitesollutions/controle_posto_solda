-- Migração: Adiciona coluna dispositivo_nome na tabela registros_producao
-- Esta coluna armazena o nome do dispositivo Raspberry diretamente no registro
-- para que não seja necessário buscá-lo através da operação ou posto

-- Adicionar coluna dispositivo_nome se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'registros_producao' 
        AND column_name = 'dispositivo_nome'
    ) THEN
        ALTER TABLE registros_producao ADD COLUMN dispositivo_nome TEXT;
        RAISE NOTICE 'Coluna dispositivo_nome adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna dispositivo_nome já existe';
    END IF;
END $$;

-- Opcional: Atualizar registros existentes com o nome do dispositivo da operação
-- Este UPDATE preenche registros antigos que não têm o dispositivo_nome preenchido
UPDATE registros_producao r
SET dispositivo_nome = (
    SELECT STRING_AGG(DISTINCT ot.toten_nome, ', ')
    FROM operacao_totens ot
    WHERE ot.operacao_id = r.operacao_id
)
WHERE r.dispositivo_nome IS NULL 
AND r.operacao_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM operacao_totens ot WHERE ot.operacao_id = r.operacao_id
);
