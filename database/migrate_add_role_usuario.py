"""
Migração para adicionar campo role na tabela de usuários
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def adicionar_campo_role():
    """Adiciona o campo role na tabela de usuários se ele não existir"""
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
        
        # Verificar se a coluna já existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'usuarios' 
                AND column_name = 'role'
            )
        """)
        coluna_existe = cursor.fetchone()[0]
        
        if coluna_existe:
            print("Coluna 'role' já existe na tabela 'usuarios'.")
        else:
            # Adicionar coluna role com valor padrão 'admin'
            print("Adicionando coluna 'role' na tabela 'usuarios'...")
            cursor.execute("""
                ALTER TABLE usuarios 
                ADD COLUMN role TEXT DEFAULT 'admin' NOT NULL
            """)
            
            # Atualizar usuários existentes para ter role 'admin'
            cursor.execute("""
                UPDATE usuarios 
                SET role = 'admin' 
                WHERE role IS NULL OR role = ''
            """)
            
            conn.commit()
            print("Coluna 'role' adicionada com sucesso!")
        
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Erro ao adicionar coluna role: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao adicionar coluna role: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    adicionar_campo_role()

