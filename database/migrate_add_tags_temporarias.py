"""
Script de migração para criar tabela de tags temporárias
Tags temporárias têm duração de 10 horas e são excluídas automaticamente após expiração
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def migrar():
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
                AND table_name = 'tags_temporarias'
            )
        """)
        
        if cursor.fetchone()[0]:
            print("Tabela 'tags_temporarias' já existe. Migração não necessária.")
        else:
            print("Criando tabela 'tags_temporarias'...")
            cursor.execute("""
                CREATE TABLE tags_temporarias (
                    id SERIAL PRIMARY KEY,
                    tag_id TEXT UNIQUE NOT NULL,
                    funcionario_id INTEGER NOT NULL,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    data_expiracao TIMESTAMP NOT NULL,
                    ativo BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(funcionario_id) ON DELETE CASCADE
                )
            """)
            
            # Criar índice para melhorar performance nas buscas
            cursor.execute("""
                CREATE INDEX idx_tags_temporarias_tag_id ON tags_temporarias(tag_id)
            """)
            
            cursor.execute("""
                CREATE INDEX idx_tags_temporarias_funcionario_id ON tags_temporarias(funcionario_id)
            """)
            
            cursor.execute("""
                CREATE INDEX idx_tags_temporarias_data_expiracao ON tags_temporarias(data_expiracao)
            """)
            
            conn.commit()
            print("Tabela 'tags_temporarias' criada com sucesso!")
        
        conn.close()
    except Exception as e:
        print(f"Erro na migração: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    migrar()

