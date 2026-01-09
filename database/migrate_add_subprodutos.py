"""
Migração para adicionar tabela de subprodutos ao banco de dados
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_tabela_subprodutos():
    """Cria a tabela de subprodutos se ela não existir"""
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
                AND table_name = 'subprodutos'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("Tabela 'subprodutos' já existe.")
            conn.close()
            return
        
        # Criar tabela de subprodutos
        print("Criando tabela 'subprodutos'...")
        cursor.execute('''
            CREATE TABLE subprodutos (
                id SERIAL PRIMARY KEY,
                modelo_id INTEGER NOT NULL,
                codigo TEXT NOT NULL,
                descricao TEXT,
                FOREIGN KEY (modelo_id) REFERENCES modelos(id) ON DELETE CASCADE
            )
        ''')
        
        # Criar índice para melhor performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_subprodutos_modelo_id ON subprodutos(modelo_id);
        ''')
        
        conn.commit()
        conn.close()
        print("Tabela 'subprodutos' criada com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabela de subprodutos: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar tabela de subprodutos: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_tabela_subprodutos()

