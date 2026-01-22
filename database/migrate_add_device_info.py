"""
Script de migração para criar a tabela de informações do dispositivo (Raspberry Pi)
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_tabela_device_info():
    """Cria a tabela device_info se ela não existir"""
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
                AND table_name = 'device_info'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("Tabela 'device_info' já existe.")
            conn.close()
            return
        
        # Criar tabela device_info
        print("Criando tabela 'device_info'...")
        cursor.execute('''
            CREATE TABLE device_info (
                device_id SERIAL PRIMARY KEY,
                serial_raspberry TEXT,
                mac_address TEXT,
                device_uuid TEXT UNIQUE NOT NULL,
                hostname TEXT,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Criar índice para melhor performance
        print("Criando índices...")
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_device_info_uuid ON device_info(device_uuid);
        ''')
        
        conn.commit()
        conn.close()
        print("Tabela 'device_info' criada com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabela device_info: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar tabela device_info: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_tabela_device_info()

