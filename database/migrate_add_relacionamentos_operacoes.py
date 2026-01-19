"""
Script de migração para criar tabelas de relacionamento para operações
Permite múltiplos totens, peças e códigos por operação
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_tabelas_relacionamento_operacoes():
    """Cria as tabelas de relacionamento para operações"""
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '5432')),
        'database': os.getenv('DB_NAME', 'ManpowerControl'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '')
    }
    
    try:
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            database=db_config['database'],
            user=db_config['user'],
            password=db_config['password']
        )
        cursor = conn.cursor()
        
        # Criar tabela operacao_totens
        print("Criando tabela 'operacao_totens'...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS operacao_totens (
                id SERIAL PRIMARY KEY,
                operacao_id INTEGER NOT NULL,
                toten_nome TEXT NOT NULL,
                CONSTRAINT fk_operacao_totens_operacao 
                    FOREIGN KEY (operacao_id) 
                    REFERENCES operacoes(operacao_id) 
                    ON DELETE CASCADE
            )
        ''')
        
        # Criar tabela operacao_pecas
        print("Criando tabela 'operacao_pecas'...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS operacao_pecas (
                id SERIAL PRIMARY KEY,
                operacao_id INTEGER NOT NULL,
                peca_id INTEGER NOT NULL,
                CONSTRAINT fk_operacao_pecas_operacao 
                    FOREIGN KEY (operacao_id) 
                    REFERENCES operacoes(operacao_id) 
                    ON DELETE CASCADE,
                CONSTRAINT fk_operacao_pecas_peca 
                    FOREIGN KEY (peca_id) 
                    REFERENCES pecas(peca_id) 
                    ON DELETE CASCADE,
                UNIQUE(operacao_id, peca_id)
            )
        ''')
        
        # Criar tabela operacao_codigos
        print("Criando tabela 'operacao_codigos'...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS operacao_codigos (
                id SERIAL PRIMARY KEY,
                operacao_id INTEGER NOT NULL,
                codigo TEXT NOT NULL,
                CONSTRAINT fk_operacao_codigos_operacao 
                    FOREIGN KEY (operacao_id) 
                    REFERENCES operacoes(operacao_id) 
                    ON DELETE CASCADE,
                UNIQUE(operacao_id, codigo)
            )
        ''')
        
        # Criar índices
        print("Criando índices...")
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacao_totens_operacao_id ON operacao_totens(operacao_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacao_pecas_operacao_id ON operacao_pecas(operacao_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacao_pecas_peca_id ON operacao_pecas(peca_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacao_codigos_operacao_id ON operacao_codigos(operacao_id);
        ''')
        
        conn.commit()
        conn.close()
        print("Tabelas de relacionamento criadas com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabelas de relacionamento: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar tabelas de relacionamento: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_tabelas_relacionamento_operacoes()

