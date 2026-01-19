"""
Script de migração para adicionar a coluna 'nome' na tabela operacoes
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def adicionar_coluna_nome_operacoes():
    """Adiciona a coluna 'nome' na tabela operacoes se ela não existir"""
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
                AND table_name = 'operacoes'
                AND column_name = 'nome'
            )
        """)
        coluna_existe = cursor.fetchone()[0]
        
        if coluna_existe:
            print("Coluna 'nome' já existe na tabela 'operacoes'.")
            conn.close()
            return
        
        # Adicionar coluna nome
        print("Adicionando coluna 'nome' na tabela 'operacoes'...")
        cursor.execute('''
            ALTER TABLE operacoes
            ADD COLUMN nome TEXT
        ''')
        
        # Atualizar registros existentes: copiar codigo_operacao para nome
        print("Atualizando registros existentes...")
        cursor.execute('''
            UPDATE operacoes
            SET nome = codigo_operacao
            WHERE nome IS NULL
        ''')
        
        conn.commit()
        conn.close()
        print("Coluna 'nome' adicionada com sucesso na tabela 'operacoes'!")
        
    except psycopg2.Error as e:
        print(f"Erro ao adicionar coluna nome: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao adicionar coluna nome: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    adicionar_coluna_nome_operacoes()

