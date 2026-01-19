"""
Migração para remover a coluna turno da tabela registros_producao
"""
import psycopg2
import os
import sys
from dotenv import load_dotenv

# Adicionar o diretório pai ao path para importar Server
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

def remover_coluna_turno():
    """Remove a coluna turno da tabela registros_producao"""
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
        
        # Verificar se a coluna existe antes de remover
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'registros_producao'
            AND column_name = 'turno'
        """)
        
        if cursor.fetchone():
            print("Removendo coluna 'turno' da tabela 'registros_producao'...")
            
            # Remover constraint CHECK se existir
            try:
                cursor.execute("""
                    ALTER TABLE registros_producao 
                    DROP CONSTRAINT IF EXISTS registros_producao_turno_check
                """)
                print("Constraint CHECK removida.")
            except Exception as e:
                print(f"Aviso ao remover constraint: {str(e)}")
            
            # Remover a coluna
            cursor.execute("""
                ALTER TABLE registros_producao 
                DROP COLUMN IF EXISTS turno
            """)
            
            conn.commit()
            print("Coluna 'turno' removida com sucesso!")
        else:
            print("Coluna 'turno' não existe na tabela 'registros_producao'.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Erro ao remover coluna turno: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        raise


if __name__ == "__main__":
    remover_coluna_turno()

