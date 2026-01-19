"""
Script de migração para criar a tabela de operações
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_tabela_operacoes():
    """Cria a tabela operacoes se ela não existir"""
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
                AND table_name = 'operacoes'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("Tabela 'operacoes' já existe. Verificando estrutura...")
            
            # Verificar se todas as colunas necessárias existem
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'operacoes'
            """)
            colunas_existentes = [row[0] for row in cursor.fetchall()]
            
            colunas_necessarias = [
                'operacao_id', 'codigo_operacao', 'produto_id', 
                'modelo_id', 'sublinha_id', 'posto_id', 'peca_id'
            ]
            
            colunas_faltando = [col for col in colunas_necessarias if col not in colunas_existentes]
            
            if colunas_faltando:
                print(f"Colunas faltando: {colunas_faltando}")
                print("Por favor, adicione as colunas faltantes manualmente ou recrie a tabela.")
            else:
                print("Estrutura da tabela 'operacoes' está correta.")
            
            conn.close()
            return
        
        # Criar tabela operacoes
        print("Criando tabela 'operacoes'...")
        cursor.execute('''
            CREATE TABLE operacoes (
                operacao_id SERIAL PRIMARY KEY,
                codigo_operacao TEXT NOT NULL,
                produto_id INTEGER,
                modelo_id INTEGER,
                sublinha_id INTEGER,
                posto_id INTEGER,
                peca_id INTEGER,
                CONSTRAINT fk_operacoes_produto 
                    FOREIGN KEY (produto_id) 
                    REFERENCES produtos(produto_id) 
                    ON DELETE SET NULL,
                CONSTRAINT fk_operacoes_modelo 
                    FOREIGN KEY (modelo_id) 
                    REFERENCES modelos(modelo_id) 
                    ON DELETE SET NULL,
                CONSTRAINT fk_operacoes_sublinha 
                    FOREIGN KEY (sublinha_id) 
                    REFERENCES sublinhas(sublinha_id) 
                    ON DELETE SET NULL,
                CONSTRAINT fk_operacoes_posto 
                    FOREIGN KEY (posto_id) 
                    REFERENCES postos(posto_id) 
                    ON DELETE SET NULL,
                CONSTRAINT fk_operacoes_peca 
                    FOREIGN KEY (peca_id) 
                    REFERENCES pecas(peca_id) 
                    ON DELETE SET NULL
            )
        ''')
        
        # Criar índices para melhor performance
        print("Criando índices...")
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacoes_produto_id ON operacoes(produto_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacoes_modelo_id ON operacoes(modelo_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacoes_sublinha_id ON operacoes(sublinha_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacoes_posto_id ON operacoes(posto_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacoes_peca_id ON operacoes(peca_id);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_operacoes_codigo_operacao ON operacoes(codigo_operacao);
        ''')
        
        conn.commit()
        conn.close()
        print("Tabela 'operacoes' criada com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao criar tabela operacoes: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar tabela operacoes: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_tabela_operacoes()

