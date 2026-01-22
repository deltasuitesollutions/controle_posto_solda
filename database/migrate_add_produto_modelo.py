"""
Migração para criar tabela intermediária produto_modelo
para armazenar a relação entre produtos e modelos
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_tabela_produto_modelo():
    """Cria a tabela produto_modelo se ela não existir"""
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
        
        # Verificar se a tabela já existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'produto_modelo'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("Tabela 'produto_modelo' já existe.")
            conn.close()
            return
        
        # Criar tabela produto_modelo com foreign keys
        print("Criando tabela 'produto_modelo'...")
        cursor.execute('''
            CREATE TABLE produto_modelo (
                id SERIAL PRIMARY KEY,
                produto_id INTEGER NOT NULL,
                modelo_id INTEGER NOT NULL,
                UNIQUE(produto_id, modelo_id),
                CONSTRAINT fk_produto_modelo_produto 
                    FOREIGN KEY (produto_id) 
                    REFERENCES produtos(produto_id) 
                    ON DELETE CASCADE,
                CONSTRAINT fk_produto_modelo_modelo 
                    FOREIGN KEY (modelo_id) 
                    REFERENCES modelos(modelo_id) 
                    ON DELETE CASCADE
            )
        ''')
        
        # Criar índices para melhor performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_produto_modelo_produto_id ON produto_modelo(produto_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_produto_modelo_modelo_id ON produto_modelo(modelo_id);
        ''')
        
        conn.commit()
        conn.close()
        print("Tabela 'produto_modelo' criada com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabela produto_modelo: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar tabela produto_modelo: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_tabela_produto_modelo()

