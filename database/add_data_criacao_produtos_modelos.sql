-- Script para adicionar campo data_criacao nas tabelas produtos e modelos
-- Este script adiciona o campo data_criacao se ele não existir

-- Adicionar data_criacao na tabela produtos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'produtos' 
        AND column_name = 'data_criacao'
    ) THEN
        ALTER TABLE produtos 
        ADD COLUMN data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Atualizar registros existentes com a data atual
        UPDATE produtos 
        SET data_criacao = CURRENT_TIMESTAMP 
        WHERE data_criacao IS NULL;
    END IF;
END $$;

-- Adicionar data_criacao na tabela modelos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'modelos' 
        AND column_name = 'data_criacao'
    ) THEN
        ALTER TABLE modelos 
        ADD COLUMN data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Atualizar registros existentes com a data atual
        UPDATE modelos 
        SET data_criacao = CURRENT_TIMESTAMP 
        WHERE data_criacao IS NULL;
    END IF;
END $$;
