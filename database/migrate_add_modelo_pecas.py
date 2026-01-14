"""
Migração para criar tabela intermediária modelo_pecas (sem foreign keys)
apenas para armazenar a relação entre modelos e peças
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_tabela_modelo_pecas():
    """Cria a tabela modelo_pecas se ela não existir (sem foreign keys)"""
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
                AND table_name = 'modelo_pecas'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("Tabela 'modelo_pecas' já existe.")
            conn.close()
            return
        
        # Criar tabela modelo_pecas sem foreign keys (apenas para armazenar relação)
        print("Criando tabela 'modelo_pecas'...")
        cursor.execute('''
            CREATE TABLE modelo_pecas (
                id SERIAL PRIMARY KEY,
                modelo_id INTEGER NOT NULL,
                peca_id INTEGER NOT NULL,
                UNIQUE(modelo_id, peca_id)
            )
        ''')
        
        # Criar índices para melhor performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_modelo_pecas_modelo_id ON modelo_pecas(modelo_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_modelo_pecas_peca_id ON modelo_pecas(peca_id);
        ''')
        
        conn.commit()
        conn.close()
        print("Tabela 'modelo_pecas' criada com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabela modelo_pecas: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar tabela modelo_pecas: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_tabela_modelo_pecas()

