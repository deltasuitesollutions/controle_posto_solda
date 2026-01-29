-- Script de inicialização do banco de dados
-- Este script cria toda a estrutura do banco de dados do zero

-- ============================================
-- CONFIGURAÇÃO DE TIMEZONE (America/Manaus = UTC-4)
-- ============================================
SET TIME ZONE 'America/Manaus';

-- ============================================
-- TABELAS BASE
-- ============================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    role TEXT DEFAULT 'admin' NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);

-- Tabela de linhas
CREATE TABLE IF NOT EXISTS linhas (
    linha_id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE
);

-- Tabela de sublinhas
CREATE TABLE IF NOT EXISTS sublinhas (
    sublinha_id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    linha_id INTEGER NOT NULL,
    FOREIGN KEY (linha_id) REFERENCES linhas(linha_id) ON DELETE CASCADE,
    UNIQUE(nome, linha_id)
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    produto_id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE
);

-- Tabela de modelos
CREATE TABLE IF NOT EXISTS modelos (
    modelo_id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL
);

-- Tabela de peças
CREATE TABLE IF NOT EXISTS pecas (
    peca_id SERIAL PRIMARY KEY,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL
);

-- Tabela de relacionamento modelo_pecas
CREATE TABLE IF NOT EXISTS modelo_pecas (
    id SERIAL PRIMARY KEY,
    modelo_id INTEGER NOT NULL,
    peca_id INTEGER NOT NULL,
    FOREIGN KEY (modelo_id) REFERENCES modelos(modelo_id) ON DELETE CASCADE,
    FOREIGN KEY (peca_id) REFERENCES pecas(peca_id) ON DELETE CASCADE,
    UNIQUE(modelo_id, peca_id)
);

CREATE INDEX IF NOT EXISTS idx_modelo_pecas_modelo_id ON modelo_pecas(modelo_id);
CREATE INDEX IF NOT EXISTS idx_modelo_pecas_peca_id ON modelo_pecas(peca_id);

-- Tabela de relacionamento produto_modelo
CREATE TABLE IF NOT EXISTS produto_modelo (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER NOT NULL,
    modelo_id INTEGER NOT NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(produto_id) ON DELETE CASCADE,
    FOREIGN KEY (modelo_id) REFERENCES modelos(modelo_id) ON DELETE CASCADE,
    UNIQUE(produto_id, modelo_id)
);

CREATE INDEX IF NOT EXISTS idx_produto_modelo_produto_id ON produto_modelo(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_modelo_modelo_id ON produto_modelo(modelo_id);

-- Tabela de subprodutos
CREATE TABLE IF NOT EXISTS subprodutos (
    id SERIAL PRIMARY KEY,
    modelo_id INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    descricao TEXT,
    FOREIGN KEY (modelo_id) REFERENCES modelos(modelo_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subprodutos_modelo_id ON subprodutos(modelo_id);

-- Tabela de postos
CREATE TABLE IF NOT EXISTS postos (
    posto_id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    sublinha_id INTEGER NOT NULL,
    toten_id INTEGER NOT NULL,
    FOREIGN KEY (sublinha_id) REFERENCES sublinhas(sublinha_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_postos_sublinha_id ON postos(sublinha_id);

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
    funcionario_id SERIAL PRIMARY KEY,
    tag_id TEXT,
    matricula TEXT NOT NULL,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    turno TEXT
);

CREATE INDEX IF NOT EXISTS idx_funcionarios_tag_id ON funcionarios(tag_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_matricula ON funcionarios(matricula);

-- Tabela de operações
CREATE TABLE IF NOT EXISTS operacoes (
    operacao_id SERIAL PRIMARY KEY,
    codigo_operacao TEXT NOT NULL,
    nome TEXT,
    produto_id INTEGER NOT NULL,
    modelo_id INTEGER NOT NULL,
    sublinha_id INTEGER NOT NULL,
    posto_id INTEGER NOT NULL,
    peca_id INTEGER,
    FOREIGN KEY (produto_id) REFERENCES produtos(produto_id) ON DELETE CASCADE,
    FOREIGN KEY (modelo_id) REFERENCES modelos(modelo_id) ON DELETE CASCADE,
    FOREIGN KEY (sublinha_id) REFERENCES sublinhas(sublinha_id) ON DELETE CASCADE,
    FOREIGN KEY (posto_id) REFERENCES postos(posto_id) ON DELETE CASCADE,
    FOREIGN KEY (peca_id) REFERENCES pecas(peca_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_operacoes_produto_id ON operacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_operacoes_modelo_id ON operacoes(modelo_id);
CREATE INDEX IF NOT EXISTS idx_operacoes_posto_id ON operacoes(posto_id);

-- Tabela de relacionamento operacao_totens
CREATE TABLE IF NOT EXISTS operacao_totens (
    id SERIAL PRIMARY KEY,
    operacao_id INTEGER NOT NULL,
    toten_nome TEXT NOT NULL,
    FOREIGN KEY (operacao_id) REFERENCES operacoes(operacao_id) ON DELETE CASCADE
);

-- Tabela de relacionamento operacao_codigos (códigos por operação)
CREATE TABLE IF NOT EXISTS operacao_codigos (
    id SERIAL PRIMARY KEY,
    operacao_id INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    FOREIGN KEY (operacao_id) REFERENCES operacoes(operacao_id) ON DELETE CASCADE,
    UNIQUE(operacao_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_operacao_codigos_operacao_id ON operacao_codigos(operacao_id);

-- Tabela de relacionamento operacao_pecas
CREATE TABLE IF NOT EXISTS operacao_pecas (
    id SERIAL PRIMARY KEY,
    operacao_id INTEGER NOT NULL,
    peca_id INTEGER NOT NULL,
    FOREIGN KEY (operacao_id) REFERENCES operacoes(operacao_id) ON DELETE CASCADE,
    FOREIGN KEY (peca_id) REFERENCES pecas(peca_id) ON DELETE CASCADE,
    UNIQUE(operacao_id, peca_id)
);

-- Tabela de operações habilitadas (relaciona funcionários com operações)
CREATE TABLE IF NOT EXISTS operacoes_habilitadas (
    funcionario_id INTEGER NOT NULL,
    operacao_id INTEGER NOT NULL,
    data_habilitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    habilitada BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (funcionario_id, operacao_id),
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(funcionario_id) ON DELETE CASCADE,
    FOREIGN KEY (operacao_id) REFERENCES operacoes(operacao_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_operacoes_habilitadas_funcionario_id ON operacoes_habilitadas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_operacoes_habilitadas_operacao_id ON operacoes_habilitadas(operacao_id);

-- Tabela de registros de produção
CREATE TABLE IF NOT EXISTS registros_producao (
    registro_id SERIAL PRIMARY KEY,
    sublinha_id INTEGER,
    posto_id INTEGER NOT NULL,
    funcionario_id INTEGER NOT NULL,
    operacao_id INTEGER,
    modelo_id INTEGER NOT NULL,
    peca_id INTEGER,
    inicio TIMESTAMP,
    fim TIMESTAMP,
    quantidade INTEGER,
    codigo_producao TEXT,
    comentarios TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_inicio DATE,
    hora_inicio TIME,
    mes_ano TEXT,
    dispositivo_nome TEXT,
    FOREIGN KEY (sublinha_id) REFERENCES sublinhas(sublinha_id) ON DELETE SET NULL,
    FOREIGN KEY (posto_id) REFERENCES postos(posto_id) ON DELETE CASCADE,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(funcionario_id) ON DELETE CASCADE,
    FOREIGN KEY (operacao_id) REFERENCES operacoes(operacao_id) ON DELETE SET NULL,
    FOREIGN KEY (modelo_id) REFERENCES modelos(modelo_id) ON DELETE CASCADE,
    FOREIGN KEY (peca_id) REFERENCES pecas(peca_id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION set_registros_producao_datas()
RETURNS TRIGGER AS $$
BEGIN
    -- Usar timezone America/Manaus para extrair data e hora corretamente
    IF NEW.inicio IS NOT NULL THEN
        NEW.data_inicio := (NEW.inicio AT TIME ZONE 'America/Manaus')::DATE;
        NEW.hora_inicio := (NEW.inicio AT TIME ZONE 'America/Manaus')::TIME;
        NEW.mes_ano := TO_CHAR(NEW.inicio AT TIME ZONE 'America/Manaus', 'YYYY-MM');
    END IF;

    NEW.atualizado_em := CURRENT_TIMESTAMP AT TIME ZONE 'America/Manaus';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registros_producao_datas
BEFORE INSERT OR UPDATE ON registros_producao
FOR EACH ROW
EXECUTE FUNCTION set_registros_producao_datas();


CREATE INDEX IF NOT EXISTS idx_registros_posto_id ON registros_producao(posto_id);
CREATE INDEX IF NOT EXISTS idx_registros_funcionario_id ON registros_producao(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_registros_operacao_id ON registros_producao(operacao_id);
CREATE INDEX IF NOT EXISTS idx_registros_modelo_id ON registros_producao(modelo_id);
CREATE INDEX IF NOT EXISTS idx_registros_data_inicio ON registros_producao(data_inicio);
CREATE INDEX IF NOT EXISTS idx_registros_mes_ano ON registros_producao(mes_ano);

-- Tabela de cancelamentos de operações
-- NOTA: registro_id não tem mais FOREIGN KEY pois o registro original é deletado após o cancelamento
CREATE TABLE IF NOT EXISTS operacoes_canceladas (
    id SERIAL PRIMARY KEY,
    registro_id INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    cancelado_por_usuario_id INTEGER,
    data_cancelamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    funcionario_nome TEXT,
    operacao_codigo TEXT,
    operacao_nome TEXT,
    hora_inicio TIMESTAMP,
    FOREIGN KEY (cancelado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_operacoes_canceladas_registro_id ON operacoes_canceladas(registro_id);
CREATE INDEX IF NOT EXISTS idx_operacoes_canceladas_data ON operacoes_canceladas(data_cancelamento);

-- Tabela de audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    acao TEXT NOT NULL,
    entidade TEXT NOT NULL,
    entidade_id INTEGER,
    dados_anteriores JSONB,
    dados_novos JSONB,
    detalhes TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidade ON audit_log(entidade);
CREATE INDEX IF NOT EXISTS idx_audit_log_data_hora ON audit_log(data_hora);

-- Tabela de dispositivos Raspberry (serial + nome editável)
CREATE TABLE IF NOT EXISTS dispositivos_raspberry (
    id SERIAL PRIMARY KEY,
    serial TEXT NOT NULL UNIQUE,
    nome TEXT,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispositivos_serial ON dispositivos_raspberry(serial);

-- Tabela de tags temporárias
CREATE TABLE IF NOT EXISTS tags_temporarias (
    id SERIAL PRIMARY KEY,
    tag_id TEXT NOT NULL,
    funcionario_id INTEGER NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(funcionario_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tags_temporarias_tag_id ON tags_temporarias(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_temporarias_funcionario_id ON tags_temporarias(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_tags_temporarias_ativo ON tags_temporarias(ativo);

-- Tabela de configuração de postos
CREATE TABLE IF NOT EXISTS posto_configuracao (
    id SERIAL PRIMARY KEY,
    posto TEXT NOT NULL UNIQUE,
    funcionario_matricula TEXT,
    modelo_codigo TEXT,
    turno INTEGER,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posto_configuracao_posto ON posto_configuracao(posto);

-- Garantir tabela operacao_codigos (códigos por operação)
CREATE TABLE IF NOT EXISTS operacao_codigos (
    id SERIAL PRIMARY KEY,
    operacao_id INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    FOREIGN KEY (operacao_id) REFERENCES operacoes(operacao_id) ON DELETE CASCADE,
    UNIQUE(operacao_id, codigo)
);
CREATE INDEX IF NOT EXISTS idx_operacao_codigos_operacao_id ON operacao_codigos(operacao_id);

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Criar usuário admin padrão (senha: admin123)
-- Hash SHA-256 de 'admin123'
INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrador', 'admin', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Criar conta de operador (senha: operador123)
-- Hash SHA-256 de 'operador123'
INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
VALUES ('operador', '1725165c9a0b3698a3d01016e0d8205155820b8d7f21835ca64c0f81c728d880', 'Operador RFID', 'operador', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Criar conta do master (senha: master123) - Hash SHA-256 de 'master123'
INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
VALUES ('master', 'e7bc2f973afb8dfaf00fadfb19596741108be08ab4a107c6a799c429b684c64a', 'Master User', 'master', TRUE)
ON CONFLICT (username) DO UPDATE SET
  senha_hash = EXCLUDED.senha_hash,
  nome = EXCLUDED.nome,
  role = EXCLUDED.role,
  ativo = EXCLUDED.ativo,
  data_atualizacao = CURRENT_TIMESTAMP;

-- ============================================
-- CONFIGURAÇÃO PERMANENTE DO TIMEZONE
-- ============================================
-- Configura o timezone padrão do banco para America/Manaus (UTC-4)
-- Isso garante que CURRENT_TIMESTAMP sempre retorne horário de Manaus
ALTER DATABASE postos SET timezone TO 'America/Manaus';