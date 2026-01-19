"""
Script de migração para criar tabela operacoes_habilitadas
Permite que funcionários sejam habilitados em múltiplas operações
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_tabela_operacoes_habilitadas():
    """Cria a tabela operacoes_habilitadas"""
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
                AND table_name = 'operacoes_habilitadas'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("Tabela 'operacoes_habilitadas' já existe. Pulando criação...")
        else:
            # Criar tabela operacoes_habilitadas
            print("Criando tabela 'operacoes_habilitadas'...")
            cursor.execute('''
                CREATE TABLE operacoes_habilitadas (
                    operacao_habilitada_id SERIAL PRIMARY KEY,
                    funcionario_id INTEGER NOT NULL,
                    operacao_id INTEGER NOT NULL,
                    data_habilitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_operacoes_habilitadas_funcionario 
                        FOREIGN KEY (funcionario_id) 
                        REFERENCES funcionarios(funcionario_id) 
                        ON DELETE CASCADE,
                    CONSTRAINT fk_operacoes_habilitadas_operacao 
                        FOREIGN KEY (operacao_id) 
                        REFERENCES operacoes(operacao_id) 
                        ON DELETE CASCADE,
                    UNIQUE(funcionario_id, operacao_id)
                )
            ''')
            
            # Criar índices para melhor performance
            print("Criando índices...")
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_operacoes_habilitadas_funcionario_id 
                ON operacoes_habilitadas(funcionario_id);
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_operacoes_habilitadas_operacao_id 
                ON operacoes_habilitadas(operacao_id);
            ''')
            
            conn.commit()
            print("Tabela 'operacoes_habilitadas' criada com sucesso!")
        
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabela operacoes_habilitadas: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar tabela operacoes_habilitadas: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_tabela_operacoes_habilitadas()

