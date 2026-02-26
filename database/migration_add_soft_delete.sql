-- Script de migração para adicionar soft delete nas tabelas modelos e produtos
-- Execute este script no banco de dados para adicionar o campo deleted

-- Adicionar campo deleted na tabela modelos
ALTER TABLE modelos 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Adicionar campo deleted na tabela produtos
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_modelos_deleted ON modelos(deleted);
CREATE INDEX IF NOT EXISTS idx_produtos_deleted ON produtos(deleted);

-- Atualizar registros existentes para garantir que não estejam marcados como deletados
UPDATE modelos SET deleted = FALSE WHERE deleted IS NULL;
UPDATE produtos SET deleted = FALSE WHERE deleted IS NULL;
