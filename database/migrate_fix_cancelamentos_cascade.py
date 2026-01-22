"""
Migração para remover CASCADE da foreign key de operacoes_canceladas
Permite que cancelamentos permaneçam mesmo quando o registro é deletado
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def fix_cancelamentos_cascade():
    """Remove CASCADE da foreign key de operacoes_canceladas"""
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
        
        # Verificar se a tabela existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'operacoes_canceladas'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if not tabela_existe:
            print("Tabela 'operacoes_canceladas' não existe. Pulando migração...")
            conn.close()
            return
        
        # Verificar se a constraint existe
        cursor.execute("""
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'operacoes_canceladas'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%registro_id%'
        """)
        constraint = cursor.fetchone()
        
        if constraint:
            constraint_name = constraint[0]
            print(f"Removendo constraint '{constraint_name}'...")
            
            # Remover a constraint antiga (com CASCADE)
            cursor.execute(f"ALTER TABLE operacoes_canceladas DROP CONSTRAINT IF EXISTS {constraint_name}")
            print("Constraint removida. Cancelamentos não serão mais deletados quando o registro for removido.")
        else:
            print("Constraint não encontrada. Nada a fazer.")
        
        conn.commit()
        conn.close()
        print("Migração concluída com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao executar migração: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao executar migração: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    fix_cancelamentos_cascade()

