"""
Script de migração para adicionar Posto P4 no banco de dados
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def adicionar_posto_p4():
    """Adiciona o Posto P4 se ele não existir"""
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
        
        # Verificar se o posto P4 já existe
        cursor.execute("SELECT id FROM postos WHERE codigo = 'P4'")
        posto_existe = cursor.fetchone()
        
        if posto_existe:
            print("Posto P4 já existe no banco de dados. Migração não necessária.")
        else:
            print("Adicionando Posto P4 no banco de dados...")
            cursor.execute(
                "INSERT INTO postos (codigo, descricao, ativo) VALUES (%s, %s, %s)",
                ('P4', 'Posto 4', True)
            )
            conn.commit()
            print("Posto P4 adicionado com sucesso!")
        
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Erro ao adicionar Posto P4: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao adicionar Posto P4: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    adicionar_posto_p4()

