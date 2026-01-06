"""
Migração para criar conta de operador pré-definida
"""
import psycopg2
import os
import hashlib
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def hash_senha(senha: str) -> str:
    """Gera hash SHA-256 da senha"""
    return hashlib.sha256(senha.encode('utf-8')).hexdigest()

def criar_conta_operador():
    """Cria a conta de operador se ela não existir"""
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '5432')),
        'database': os.getenv('DB_NAME', 'ManpowerControl'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '')
    }
    
    # Credenciais padrão do operador
    username = 'operador'
    senha = 'operador123'  # Senha padrão - deve ser alterada em produção
    email = 'operador@manpower.com'
    nome = 'Operador RFID'
    role = 'operador'
    
    try:
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            database=db_config['database'],
            user=db_config['user'],
            password=db_config['password']
        )
        cursor = conn.cursor()
        
        # Verificar se o usuário já existe
        cursor.execute("""
            SELECT id FROM usuarios WHERE username = %s
        """, (username,))
        usuario_existente = cursor.fetchone()
        
        if usuario_existente:
            # Atualizar o usuário existente para garantir que tem o role correto
            senha_hash = hash_senha(senha)
            cursor.execute("""
                UPDATE usuarios 
                SET email = %s, senha_hash = %s, nome = %s, role = %s, ativo = TRUE
                WHERE username = %s
            """, (email, senha_hash, nome, role, username))
            print(f"Usuário '{username}' atualizado com sucesso!")
            print(f"  Username: {username}")
            print(f"  Senha: {senha}")
            print(f"  Role: {role}")
        else:
            # Criar novo usuário
            senha_hash = hash_senha(senha)
            cursor.execute("""
                INSERT INTO usuarios (username, email, senha_hash, nome, role, ativo)
                VALUES (%s, %s, %s, %s, %s, TRUE)
                RETURNING id
            """, (username, email, senha_hash, nome, role))
            
            usuario_id = cursor.fetchone()[0]
            conn.commit()
            print(f"Conta de operador criada com sucesso!")
            print(f"  ID: {usuario_id}")
            print(f"  Username: {username}")
            print(f"  Senha: {senha}")
            print(f"  Role: {role}")
            print("\n⚠️  IMPORTANTE: Altere a senha padrão em produção!")
        
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Erro ao criar conta de operador: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
    except Exception as e:
        print(f"Erro ao criar conta de operador: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    criar_conta_operador()

