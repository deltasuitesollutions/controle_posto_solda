"""
Script para configurar o sistema de roles e criar conta de operador
Execute este script após criar o banco de dados
"""
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from migrate_add_role_usuario import adicionar_campo_role
from migrate_add_operador import criar_conta_operador

def setup_operador():
    """Executa todas as migrações necessárias para configurar o sistema de roles"""
    print("=" * 60)
    print("Configurando sistema de roles e conta de operador")
    print("=" * 60)
    print()
    
    # Passo 1: Adicionar campo role
    print("1. Adicionando campo 'role' na tabela usuarios...")
    try:
        adicionar_campo_role()
        print("   ✓ Campo 'role' configurado com sucesso!")
    except Exception as e:
        print(f"   ✗ Erro ao adicionar campo role: {e}")
        return False
    print()
    
    # Passo 2: Criar conta de operador
    print("2. Criando conta de operador...")
    try:
        criar_conta_operador()
        print("   ✓ Conta de operador configurada com sucesso!")
    except Exception as e:
        print(f"   ✗ Erro ao criar conta de operador: {e}")
        return False
    print()
    
    print("=" * 60)
    print("Configuração concluída com sucesso!")
    print("=" * 60)
    print()
    print("Credenciais da conta de operador:")
    print("  Username: operador")
    print("  Senha: operador123")
    print()
    print("⚠️  IMPORTANTE: Altere a senha padrão em produção!")
    print()
    
    return True

if __name__ == "__main__":
    success = setup_operador()
    sys.exit(0 if success else 1)

