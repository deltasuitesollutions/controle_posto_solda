"""
Script para verificar e garantir que a coluna 'tag' existe na tabela funcionarios
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def verificar_e_criar_coluna_tag():
    """Verifica se a coluna tag existe e cria se necessário"""
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
        
        # Verificar se a tabela funcionarios existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'funcionarios'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if not tabela_existe:
            print("ERRO: Tabela 'funcionarios' não existe!")
            conn.close()
            return
        
        print("✓ Tabela 'funcionarios' existe")
        
        # Listar todas as colunas da tabela
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'funcionarios'
            ORDER BY ordinal_position
        """)
        colunas = cursor.fetchall()
        
        print(f"\nColunas na tabela 'funcionarios':")
        coluna_tag_existe = False
        for coluna in colunas:
            nome, tipo, nullable = coluna
            print(f"  - {nome} ({tipo}, nullable: {nullable})")
            if nome == 'tag':
                coluna_tag_existe = True
        
        # Verificar especificamente a coluna tag
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'funcionarios'
            AND column_name = 'tag'
        """)
        coluna_tag = cursor.fetchone()
        
        if coluna_tag_existe and coluna_tag:
            print(f"\n✓ Coluna 'tag' existe:")
            print(f"  - Tipo: {coluna_tag[1]}")
            print(f"  - Permite NULL: {coluna_tag[2]}")
        else:
            print("\n⚠ Coluna 'tag' NÃO existe. Criando...")
            try:
                cursor.execute("""
                    ALTER TABLE funcionarios 
                    ADD COLUMN tag TEXT
                """)
                conn.commit()
                print("✓ Coluna 'tag' criada com sucesso!")
                
                # Criar índice UNIQUE
                cursor.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS idx_funcionarios_tag_unique 
                    ON funcionarios(tag) 
                    WHERE tag IS NOT NULL
                """)
                conn.commit()
                print("✓ Índice UNIQUE criado na coluna 'tag'")
            except psycopg2.Error as e:
                print(f"ERRO ao criar coluna: {e}")
                conn.rollback()
        
        # Verificar índices na coluna tag
        cursor.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'funcionarios'
            AND indexname LIKE '%tag%'
        """)
        indices = cursor.fetchall()
        
        if indices:
            print(f"\nÍndices relacionados à coluna 'tag':")
            for idx in indices:
                print(f"  - {idx[0]}")
        else:
            print("\n⚠ Nenhum índice encontrado para a coluna 'tag'")
        
        # Contar funcionários com e sem tag
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(tag) as com_tag,
                COUNT(*) - COUNT(tag) as sem_tag
            FROM funcionarios
        """)
        stats = cursor.fetchone()
        total, com_tag, sem_tag = stats
        print(f"\nEstatísticas:")
        print(f"  - Total de funcionários: {total}")
        print(f"  - Com tag: {com_tag}")
        print(f"  - Sem tag: {sem_tag}")
        
        conn.close()
        print("\nVerificação concluída!")
        
    except psycopg2.Error as e:
        print(f"Erro ao verificar coluna: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    verificar_e_criar_coluna_tag()

