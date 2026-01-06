import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def criar_banco_dados(force_recreate=False):
    # Carregar configuração do banco a partir de variáveis de ambiente
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
        
        # Verificar se as tabelas já existem
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'funcionarios'
            )
        """)
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe and not force_recreate:
            print("Banco de dados já existe. Use force_recreate=True para recriar.")
            conn.close()
            return
        
        if force_recreate:
            print("Removendo tabelas existentes...")
            # Remover tabelas em ordem (respeitando foreign keys)
            cursor.execute("DROP TABLE IF EXISTS producao_registros CASCADE")
            cursor.execute("DROP TABLE IF EXISTS posto_configuracao CASCADE")
            cursor.execute("DROP TABLE IF EXISTS tags_rfid CASCADE")
            cursor.execute("DROP TABLE IF EXISTS postos CASCADE")
            cursor.execute("DROP TABLE IF EXISTS modelos CASCADE")
            cursor.execute("DROP TABLE IF EXISTS funcionarios CASCADE")
            cursor.execute("DROP TABLE IF EXISTS usuarios CASCADE")
            conn.commit()
        
        print("Criando tabelas...")
        
        # Tabela de funcionários
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS funcionarios (
                id SERIAL PRIMARY KEY,
                matricula TEXT UNIQUE NOT NULL,
                nome TEXT NOT NULL,
                ativo BOOLEAN DEFAULT TRUE
            )
        ''')
        
        # Tabela de modelos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS modelos (
                id SERIAL PRIMARY KEY,
                codigo TEXT UNIQUE NOT NULL,
                descricao TEXT
            )
        ''')
        
        # Tabela de tags RFID
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tags_rfid (
                id SERIAL PRIMARY KEY,
                tag_id TEXT UNIQUE NOT NULL,
                funcionario_matricula TEXT UNIQUE,
                ativo BOOLEAN DEFAULT TRUE,
                data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                observacoes TEXT,
                FOREIGN KEY (funcionario_matricula) REFERENCES funcionarios(matricula)
            )
        ''')
        
        # Tabela de postos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS postos (
                id SERIAL PRIMARY KEY,
                codigo TEXT UNIQUE NOT NULL,
                descricao TEXT,
                ativo BOOLEAN DEFAULT TRUE
            )
        ''')
        
        # Tabela de produção
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS producao_registros (
                id SERIAL PRIMARY KEY,
                posto TEXT NOT NULL,
                funcionario_matricula TEXT,
                produto TEXT,
                data DATE NOT NULL,
                hora_inicio TIME NOT NULL,
                hora_fim TIME,
                turno INTEGER,
                tag_rfid_id TEXT,
                status TEXT DEFAULT 'em_producao',
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (funcionario_matricula) REFERENCES funcionarios(matricula),
                FOREIGN KEY (produto) REFERENCES modelos(codigo)
            )
        ''')
        
        # Tabela de configuração de postos (configuração do líder)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS posto_configuracao (
                id SERIAL PRIMARY KEY,
                posto TEXT NOT NULL UNIQUE,
                funcionario_matricula TEXT,
                modelo_codigo TEXT,
                turno INTEGER,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (funcionario_matricula) REFERENCES funcionarios(matricula),
                FOREIGN KEY (modelo_codigo) REFERENCES modelos(codigo)
            )
        ''')
        
        # Tabela de usuários
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha_hash TEXT NOT NULL,
                nome TEXT NOT NULL,
                ativo BOOLEAN DEFAULT TRUE,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Criar índices para usuários
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
        ''')
        
        # Verificar se precisa migrar de modelo_codigo para produto
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'producao_registros'
            AND column_name IN ('modelo_codigo', 'produto')
        """)
        colunas = [row[0] for row in cursor.fetchall()]
        
        # Se existe modelo_codigo mas não produto, executar migração
        if 'modelo_codigo' in colunas and 'produto' not in colunas:
            print("Executando migração: modelo_codigo -> produto")
            cursor.execute('''
                ALTER TABLE producao_registros 
                RENAME COLUMN modelo_codigo TO produto
            ''')
            print("Migração concluída: modelo_codigo renomeado para produto")
        
        # Verificar e adicionar constraint UNIQUE em funcionario_matricula na tabela tags_rfid
        # (garantir que cada funcionário tenha apenas uma tag)
        try:
            cursor.execute("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_schema = 'public' 
                AND table_name = 'tags_rfid'
                AND constraint_type = 'UNIQUE'
                AND constraint_name LIKE '%funcionario_matricula%'
            """)
            constraint_existe = cursor.fetchone()
            
            if not constraint_existe:
                # Verificar se há dados duplicados antes de adicionar constraint
                cursor.execute("""
                    SELECT funcionario_matricula, COUNT(*) 
                    FROM tags_rfid 
                    WHERE funcionario_matricula IS NOT NULL
                    GROUP BY funcionario_matricula 
                    HAVING COUNT(*) > 1
                """)
                duplicados = cursor.fetchall()
                
                if duplicados:
                    print("Aviso: Existem funcionários com múltiplas tags. Removendo duplicatas...")
                    # Manter apenas a tag mais recente de cada funcionário
                    for matricula, count in duplicados:
                        cursor.execute("""
                            DELETE FROM tags_rfid 
                            WHERE id NOT IN (
                                SELECT id FROM tags_rfid 
                                WHERE funcionario_matricula = %s 
                                ORDER BY data_cadastro DESC 
                                LIMIT 1
                            ) AND funcionario_matricula = %s
                        """, (matricula, matricula))
                    conn.commit()
                
                # Adicionar constraint UNIQUE
                cursor.execute('''
                    ALTER TABLE tags_rfid 
                    ADD CONSTRAINT tags_rfid_funcionario_matricula_unique 
                    UNIQUE (funcionario_matricula)
                ''')
                print("Constraint UNIQUE adicionada em funcionario_matricula (tags_rfid)")
        except psycopg2.Error as e:
            # Se a constraint já existe ou houver erro, apenas avisar
            if "already exists" not in str(e).lower() and "duplicate" not in str(e).lower():
                print(f"Aviso ao adicionar constraint UNIQUE: {e}")
        
        # Verificar se tabela posto_configuracao existe, se não, já foi criada acima
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'posto_configuracao'
            )
        """)
        if not cursor.fetchone()[0]:
            cursor.execute('''
                CREATE TABLE posto_configuracao (
                    id SERIAL PRIMARY KEY,
                    posto TEXT NOT NULL UNIQUE,
                    funcionario_matricula TEXT,
                    modelo_codigo TEXT,
                    turno INTEGER,
                    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (funcionario_matricula) REFERENCES funcionarios(matricula),
                    FOREIGN KEY (modelo_codigo) REFERENCES modelos(codigo)
                )
            ''')
            print("Tabela posto_configuracao criada")
        
        # Limpar dados existentes e inserir novos dados de teste
        print("Limpando dados existentes...")
        cursor.execute("DELETE FROM producao_registros")
        cursor.execute("DELETE FROM posto_configuracao")
        cursor.execute("DELETE FROM tags_rfid")
        cursor.execute("DELETE FROM funcionarios")
        cursor.execute("DELETE FROM modelos")
        cursor.execute("DELETE FROM postos")
        conn.commit()
        print("Dados limpos com sucesso.")
        
        # Inserir novos funcionários de teste
        print("Inserindo funcionários de teste...")
        funcionarios = [
            ('1001', 'CARLOS SILVA'),
            ('1002', 'MARIA SANTOS'),
            ('1003', 'JOSÉ OLIVEIRA'),
            ('1004', 'ANA COSTA'),
            ('1005', 'PEDRO ALMEIDA')
        ]
        
        cursor.executemany(
            "INSERT INTO funcionarios (matricula, nome) VALUES (%s, %s)", 
            funcionarios
        )
        print(f"{len(funcionarios)} funcionários inseridos.")
        
        # Inserir modelos de teste
        print("Inserindo modelos de teste...")
        modelos = [
            ('PROD_A', 'Produto A'),
            ('PROD_B', 'Produto B'),
            ('PROD_C', 'Produto C'),
            ('PROD_D', 'Produto D'),
            ('PROD_E', 'Produto E')
        ]
        
        cursor.executemany(
            "INSERT INTO modelos (codigo, descricao) VALUES (%s, %s)", 
            modelos
        )
        print(f"{len(modelos)} modelos inseridos.")
        
        # Inserir postos de teste
        print("Inserindo postos de teste...")
        postos = [
            ('P1', 'Posto 1'),
            ('P2', 'Posto 2'),
            ('P3', 'Posto 3'),
            ('P4', 'Posto 4')
        ]
        
        cursor.executemany(
            "INSERT INTO postos (codigo, descricao) VALUES (%s, %s)", 
            postos
        )
        print(f"{len(postos)} postos inseridos.")
        
        # Inserir tags RFID já associadas aos funcionários
        print("Inserindo tags RFID associadas aos funcionários...")
        tags_rfid = [
            ('TAG001', '1001', True, 'Tag do funcionário CARLOS SILVA'),
            ('TAG002', '1002', True, 'Tag do funcionário MARIA SANTOS'),
            ('TAG003', '1003', True, 'Tag do funcionário JOSÉ OLIVEIRA'),
            ('TAG004', '1004', True, 'Tag do funcionário ANA COSTA'),
            ('TAG005', '1005', True, 'Tag do funcionário PEDRO ALMEIDA')
        ]
        
        cursor.executemany(
            "INSERT INTO tags_rfid (tag_id, funcionario_matricula, ativo, observacoes) VALUES (%s, %s, %s, %s)",
            tags_rfid
        )
        print(f"{len(tags_rfid)} tags RFID inseridas e associadas aos funcionários.")
        
        # Criar índices para melhor performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_producao_data ON producao_registros(data);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_producao_posto ON producao_registros(posto);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_producao_funcionario ON producao_registros(funcionario_matricula);
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_posto_configuracao_posto ON posto_configuracao(posto);
        ''')
        
        conn.commit()
        conn.close()
        print("Banco de dados configurado com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro ao criar banco de dados: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar banco de dados: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    import sys
    # Se passar --force como argumento, recria o banco
    force = '--force' in sys.argv
    criar_banco_dados(force_recreate=force)
