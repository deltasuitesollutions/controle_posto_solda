-- Script de migração: Adiciona suporte a múltiplos turnos por funcionário
-- Este script cria a tabela funcionarios_turnos e migra os dados existentes

-- ============================================
-- CRIAR TABELA DE RELACIONAMENTO
-- ============================================
CREATE TABLE IF NOT EXISTS funcionarios_turnos (
    funcionario_id INTEGER NOT NULL,
    turno TEXT NOT NULL,
    PRIMARY KEY (funcionario_id, turno),
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(funcionario_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_funcionarios_turnos_funcionario_id ON funcionarios_turnos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_turnos_turno ON funcionarios_turnos(turno);

-- ============================================
-- MIGRAR DADOS EXISTENTES
-- ============================================
-- Migra os turnos existentes do campo 'turno' para a nova tabela
INSERT INTO funcionarios_turnos (funcionario_id, turno)
SELECT funcionario_id, turno
FROM funcionarios
WHERE turno IS NOT NULL 
  AND turno != ''
  AND NOT EXISTS (
    SELECT 1 FROM funcionarios_turnos ft 
    WHERE ft.funcionario_id = funcionarios.funcionario_id 
    AND ft.turno = funcionarios.turno
  );

-- ============================================
-- NOTA: O campo 'turno' na tabela funcionarios será mantido
-- por compatibilidade, mas não será mais usado para novos cadastros
-- ============================================
