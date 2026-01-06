"""
Script de migração para adicionar campo turno na tabela posto_configuracao
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
        
        # Verificar se a coluna turno já existe
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'posto_configuracao'
            AND column_name = 'turno'
        """)
        
        if cursor.fetchone():
            print("Coluna 'turno' já existe na tabela posto_configuracao. Migração não necessária.")
        else:
            print("Adicionando coluna 'turno' na tabela posto_configuracao...")
            cursor.execute("""
                ALTER TABLE posto_configuracao 
                ADD COLUMN turno INTEGER
            """)
            conn.commit()
            print("Migração concluída com sucesso!")
        
        conn.close()
    except Exception as e:
        print(f"Erro na migração: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    migrar()



