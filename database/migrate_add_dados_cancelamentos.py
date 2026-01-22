"""
Migração para adicionar colunas na tabela operacoes_canceladas
para armazenar dados completos do registro antes de deletar
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def adicionar_colunas_cancelamentos():
    """Adiciona colunas na tabela operacoes_canceladas para armazenar dados do registro"""
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
            print("Tabela 'operacoes_canceladas' não existe. Execute primeiro migrate_add_cancelamentos.py")
            conn.close()
            return
        
        # Lista de colunas a adicionar
        colunas_para_adicionar = [
            ('posto_id', 'INTEGER'),
            ('funcionario_id', 'INTEGER'),
            ('operacao_id', 'INTEGER'),
            ('modelo_id', 'INTEGER'),
            ('peca_id', 'INTEGER'),
            ('sublinha_id', 'INTEGER'),
            ('data_inicio', 'DATE'),
            ('hora_inicio', 'TIME'),
            ('fim', 'TIME'),
            ('quantidade', 'INTEGER'),
            ('codigo_producao', 'TEXT'),
            ('comentarios', 'TEXT'),
            ('inicio', 'TIME'),
            # Campos de texto para armazenar nomes (caso as referências sejam deletadas)
            ('funcionario_nome', 'TEXT'),
            ('funcionario_matricula', 'TEXT'),
            ('posto_nome', 'TEXT'),
            ('modelo_nome', 'TEXT'),
            ('modelo_codigo', 'TEXT'),
            ('operacao_codigo', 'TEXT'),
            ('operacao_nome', 'TEXT')
        ]
        
        print("Verificando e adicionando colunas na tabela 'operacoes_canceladas'...")
        
        for coluna_nome, coluna_tipo in colunas_para_adicionar:
            # Verificar se a coluna já existe
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'operacoes_canceladas'
                    AND column_name = %s
                )
            """, (coluna_nome,))
            
            coluna_existe = cursor.fetchone()[0]
            
            if not coluna_existe:
                print(f"Adicionando coluna '{coluna_nome}'...")
                cursor.execute(f"ALTER TABLE operacoes_canceladas ADD COLUMN {coluna_nome} {coluna_tipo}")
            else:
                print(f"Coluna '{coluna_nome}' já existe. Pulando...")
        
        # Criar índices para melhor performance
        indices = [
            ('idx_cancelamentos_posto_id', 'posto_id'),
            ('idx_cancelamentos_funcionario_id', 'funcionario_id'),
            ('idx_cancelamentos_data_inicio', 'data_inicio'),
            ('idx_cancelamentos_modelo_id', 'modelo_id'),
            ('idx_cancelamentos_operacao_id', 'operacao_id')
        ]
        
        for indice_nome, coluna in indices:
            cursor.execute(f"""
                CREATE INDEX IF NOT EXISTS {indice_nome} 
                ON operacoes_canceladas({coluna})
            """)
        
        conn.commit()
        conn.close()
        print("Colunas adicionadas com sucesso na tabela 'operacoes_canceladas'!")
        
    except psycopg2.Error as e:
        print(f"Erro ao adicionar colunas: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao adicionar colunas: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    adicionar_colunas_cancelamentos()

