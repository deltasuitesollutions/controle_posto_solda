"""
Migração para adicionar tabela de log de auditoria
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def criar_tabela_audit_log():
    """Cria a tabela audit_log se ela não existir"""
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '5432')),
        'database': os.getenv('DB_NAME', 'ManpowerControl'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '')
    }
    
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Verificar se a tabela já existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'audit_log'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("Tabela 'audit_log' já existe.")
            conn.close()
            return
        
        # Criar tabela audit_log
        cursor.execute("""
            CREATE TABLE audit_log (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL,
                acao TEXT NOT NULL,
                entidade TEXT NOT NULL,
                entidade_id INTEGER,
                dados_anteriores JSONB,
                dados_novos JSONB,
                detalhes TEXT,
                data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        """)
        
        # Criar índices para melhor performance
        cursor.execute("""
            CREATE INDEX idx_audit_log_usuario_id ON audit_log(usuario_id)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_audit_log_entidade ON audit_log(entidade)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_audit_log_acao ON audit_log(acao)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_audit_log_data_hora ON audit_log(data_hora DESC)
        """)
        
        conn.commit()
        print("Tabela 'audit_log' criada com sucesso!")
        
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabela audit_log: {e}")
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        print(f"Erro ao criar tabela audit_log: {e}")
        if conn:
            conn.rollback()
            conn.close()
        raise


if __name__ == '__main__':
    criar_tabela_audit_log()

