"""
Script para criar usuários iniciais (master e operador)
Execute este script para criar as contas padrão do sistema
"""
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from Server.models import Usuario

def criar_usuarios_iniciais():
    """Cria os usuários iniciais (master e operador) se eles não existirem"""
    print("=" * 60)
    print("Criando usuários iniciais do sistema")
    print("=" * 60)
    print()
    
    usuarios_para_criar = [
        {
            'username': 'master',
            'nome': 'Administrador Master',
            'senha': 'master123',
            'role': 'master'
        },
        {
            'username': 'operador',
            'nome': 'Operador RFID',
            'senha': 'operador123',
            'role': 'operador'
        }
    ]
    
    usuarios_criados = []
    
    for usuario_data in usuarios_para_criar:
        username = usuario_data['username']
        nome = usuario_data['nome']
        senha = usuario_data['senha']
        role = usuario_data['role']
        
        print(f"Criando usuário '{username}'...")
        
        try:
            # Verificar se o usuário já existe
            usuario_existente = Usuario.buscar_por_username(username)
            
            if usuario_existente:
                # Atualizar o usuário existente
                usuario_existente.nome = nome
                usuario_existente.role = role
                usuario_existente.ativo = True
                usuario_existente.senha_hash = Usuario.hash_senha(senha)
                usuario_existente.save()
                
                print(f"   ✓ Usuário '{username}' atualizado com sucesso!")
                print(f"     Username: {username}")
                print(f"     Senha: {senha}")
                print(f"     Role: {role}")
                usuarios_criados.append(usuario_data)
            else:
                # Criar novo usuário
                senha_hash = Usuario.hash_senha(senha)
                usuario = Usuario(
                    username=username,
                    nome=nome,
                    role=role,
                    ativo=True,
                    senha_hash=senha_hash
                )
                usuario.save()
                
                print(f"   ✓ Usuário '{username}' criado com sucesso!")
                print(f"     ID: {usuario.usuario_id}")
                print(f"     Username: {username}")
                print(f"     Senha: {senha}")
                print(f"     Role: {role}")
                usuarios_criados.append(usuario_data)
        
        except Exception as e:
            print(f"   ✗ Erro ao criar/atualizar usuário '{username}': {e}")
        
        print()
    
    if usuarios_criados:
        print("=" * 60)
        print("Usuários criados/atualizados com sucesso!")
        print("=" * 60)
        print()
        print("Credenciais dos usuários:")
        print()
        for usuario_data in usuarios_criados:
            print(f"  {usuario_data['role'].upper()}:")
            print(f"    Username: {usuario_data['username']}")
            print(f"    Senha: {usuario_data['senha']}")
            print()
        print("⚠️  IMPORTANTE: Altere as senhas padrão em produção!")
        print()
        return True
    else:
        print("=" * 60)
        print("Nenhum usuário foi criado.")
        print("=" * 60)
        return False

if __name__ == "__main__":
    success = criar_usuarios_iniciais()
    sys.exit(0 if success else 1)

