"""
Migração para adicionar coluna 'tag' na tabela funcionarios
e migrar dados de tags_rfid para funcionarios.tag
"""
import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def migrar_tag_para_funcionarios():
    """Adiciona coluna tag em funcionarios e migra dados de tags_rfid"""
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
        
        # Verificar se a coluna tag já existe
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'funcionarios'
            AND column_name = 'tag'
        """)
        coluna_existe = cursor.fetchone()
        
        if coluna_existe:
            print("Coluna 'tag' já existe na tabela funcionarios.")
        else:
            print("Adicionando coluna 'tag' na tabela funcionarios...")
            cursor.execute("""
                ALTER TABLE funcionarios 
                ADD COLUMN tag TEXT
            """)
            conn.commit()
            print("Coluna 'tag' adicionada com sucesso!")
        
        # Verificar se a tabela tags_rfid existe antes de tentar migrar
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'tags_rfid'
            )
        """)
        tabela_tags_existe = cursor.fetchone()[0]
        
        if tabela_tags_existe:
            # Migrar dados de tags_rfid para funcionarios.tag
            print("Migrando dados de tags_rfid para funcionarios.tag...")
            try:
                cursor.execute("""
                    UPDATE funcionarios f
                    SET tag = t.tag_id
                    FROM tags_rfid t
                    WHERE f.matricula = t.funcionario_matricula
                    AND t.ativo = TRUE
                    AND f.tag IS NULL
                """)
                registros_migrados = cursor.rowcount
                print(f"{registros_migrados} registros migrados de tags_rfid para funcionarios.tag")
            except psycopg2.Error as e:
                print(f"Aviso: Não foi possível migrar dados de tags_rfid: {e}")
        else:
            print("Tabela tags_rfid não existe. Pulando migração de dados.")
        
        # Adicionar constraint UNIQUE na coluna tag (opcional, para garantir que cada tag seja única)
        try:
            cursor.execute("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_schema = 'public' 
                AND table_name = 'funcionarios'
                AND constraint_type = 'UNIQUE'
                AND constraint_name LIKE '%tag%'
            """)
            constraint_existe = cursor.fetchone()
            
            if not constraint_existe:
                # Verificar se há tags duplicadas antes de adicionar constraint
                cursor.execute("""
                    SELECT tag, COUNT(*) 
                    FROM funcionarios 
                    WHERE tag IS NOT NULL
                    GROUP BY tag 
                    HAVING COUNT(*) > 1
                """)
                duplicados = cursor.fetchall()
                
                if duplicados:
                    print("Aviso: Existem tags duplicadas. Mantendo apenas a primeira ocorrência...")
                    for tag, count in duplicados:
                        cursor.execute("""
                            UPDATE funcionarios 
                            SET tag = NULL 
                            WHERE tag = %s 
                            AND id NOT IN (
                                SELECT id FROM funcionarios 
                                WHERE tag = %s 
                                ORDER BY id 
                                LIMIT 1
                            )
                        """, (tag, tag))
                    conn.commit()
                
                # Adicionar constraint UNIQUE usando índice parcial
                cursor.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS idx_funcionarios_tag_unique 
                    ON funcionarios(tag) 
                    WHERE tag IS NOT NULL
                """)
                print("Índice UNIQUE adicionado na coluna tag (funcionarios)")
            else:
                print("Índice UNIQUE na coluna tag já existe.")
        except psycopg2.Error as e:
            if "already exists" not in str(e).lower() and "duplicate" not in str(e).lower():
                print(f"Aviso ao adicionar constraint UNIQUE: {e}")
        
        # Verificar se a coluna foi criada corretamente
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'funcionarios'
            AND column_name = 'tag'
        """)
        coluna_info = cursor.fetchone()
        
        if coluna_info:
            print(f"\n✓ Coluna 'tag' confirmada na tabela funcionarios:")
            print(f"  - Tipo: {coluna_info[1]}")
            print(f"  - Permite NULL: {coluna_info[2]}")
        else:
            print("\n⚠ AVISO: Coluna 'tag' não foi encontrada após a criação!")
        
        conn.commit()
        conn.close()
        print("\nMigração concluída com sucesso!")
        
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
    migrar_tag_para_funcionarios()

