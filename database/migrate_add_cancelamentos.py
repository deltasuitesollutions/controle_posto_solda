"""
Migração para adicionar tabela de cancelamentos de operações
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_tabela_cancelamentos():
    """Cria a tabela de cancelamentos se ela não existir"""
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
                AND table_name = 'operacoes_canceladas'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("Tabela 'operacoes_canceladas' já existe.")
            conn.close()
            return
        
        # Criar tabela de cancelamentos
        print("Criando tabela 'operacoes_canceladas'...")
        cursor.execute('''
            CREATE TABLE operacoes_canceladas (
                id SERIAL PRIMARY KEY,
                registro_id INTEGER NOT NULL,
                motivo TEXT NOT NULL,
                cancelado_por_usuario_id INTEGER,
                data_cancelamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (registro_id) REFERENCES registros_producao(registro_id) ON DELETE CASCADE,
                FOREIGN KEY (cancelado_por_usuario_id) REFERENCES usuarios(id)
            )
        ''')
        
        # Criar índices para melhor performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_cancelamentos_registro_id ON operacoes_canceladas(registro_id);
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_cancelamentos_data ON operacoes_canceladas(data_cancelamento);
        ''')
        
        conn.commit()
        conn.close()
        print("Tabela 'operacoes_canceladas' criada com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabela de cancelamentos: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar tabela de cancelamentos: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_tabela_cancelamentos()

