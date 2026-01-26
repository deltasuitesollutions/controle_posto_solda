"""
Migração para adicionar tabela de dispositivos_raspberry ao banco de dados
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_tabela_dispositivos_raspberry():
    """Cria a tabela de dispositivos_raspberry se ela não existir"""
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
                AND table_name = 'dispositivos_raspberry'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("Tabela 'dispositivos_raspberry' já existe.")
            conn.close()
            return
        
        # Criar tabela de dispositivos_raspberry
        print("Criando tabela 'dispositivos_raspberry'...")
        cursor.execute('''
            CREATE TABLE dispositivos_raspberry (
                id SERIAL PRIMARY KEY,
                serial TEXT UNIQUE NOT NULL,
                hostname TEXT NOT NULL,
                data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Criar índices para melhor performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_dispositivos_raspberry_serial ON dispositivos_raspberry(serial);
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_dispositivos_raspberry_hostname ON dispositivos_raspberry(hostname);
        ''')
        
        conn.commit()
        conn.close()
        print("Tabela 'dispositivos_raspberry' criada com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabela de dispositivos_raspberry: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar tabela de dispositivos_raspberry: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_tabela_dispositivos_raspberry()

