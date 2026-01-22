"""
Migração para remover campo email da tabela de usuários
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def remover_campo_email():
    """Remove o campo email da tabela de usuários se ele existir"""
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
        
        # Verificar se a coluna existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'usuarios' 
                AND column_name = 'email'
            )
        """)
        coluna_existe = cursor.fetchone()[0]
        
        if coluna_existe:
            # Remover índice se existir
            try:
                cursor.execute("DROP INDEX IF EXISTS idx_usuarios_email;")
            except:
                pass
            
            # Remover coluna email
            print("Removendo coluna 'email' da tabela 'usuarios'...")
            cursor.execute("""
                ALTER TABLE usuarios 
                DROP COLUMN email
            """)
            
            conn.commit()
            print("Coluna 'email' removida com sucesso!")
        else:
            print("Coluna 'email' não existe na tabela 'usuarios'.")
        
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Erro ao remover coluna email: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao remover coluna email: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    remover_campo_email()

