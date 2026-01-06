"""
Service para lógica de negócio de autenticação
"""
from typing import Dict, Any, Optional
from backend.models.usuario import Usuario


def criar_usuario(username: str, email: str, senha: str, nome: str) -> Dict[str, Any]:
    """Cria um novo usuário"""
    try:
        # Verificar se já existe usuário com o mesmo username
        usuario_existente = Usuario.buscar_por_username(username)
        if usuario_existente:
            raise Exception(f"Já existe um usuário com o username {username}")
        
        # Verificar se já existe usuário com o mesmo email
        usuario_existente_email = Usuario.buscar_por_email(email)
        if usuario_existente_email:
            raise Exception(f"Já existe um usuário com o email {email}")
        
        usuario = Usuario.criar(username=username, email=email, senha=senha, nome=nome, ativo=True)
        return usuario.to_dict()
    except Exception as e:
        raise Exception(f"Erro ao criar usuário: {str(e)}")


def autenticar_usuario(username: str, senha: str) -> Optional[Dict[str, Any]]:
    """Autentica um usuário e retorna seus dados se a senha estiver correta"""
    try:
        usuario = Usuario.buscar_por_username(username)
        
        if not usuario:
            return None
        
        if not usuario.ativo:
            raise Exception("Usuário inativo")
        
        if not usuario.verificar_senha(senha):
            return None
        
        return usuario.to_dict()
    except Exception as e:
        raise Exception(f"Erro ao autenticar usuário: {str(e)}")


def buscar_usuario_por_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Busca um usuário pelo ID"""
    try:
        usuario = Usuario.buscar_por_id(user_id)
        if not usuario:
            return None
        return usuario.to_dict()
    except Exception as e:
        raise Exception(f"Erro ao buscar usuário: {str(e)}")


def redefinir_senha(username: str, nova_senha: str) -> bool:
    """Redefine a senha de um usuário pelo username"""
    try:
        if len(nova_senha) < 6:
            raise Exception("A senha deve ter no mínimo 6 caracteres")
        
        sucesso = Usuario.atualizar_senha_por_username(username, nova_senha)
        if not sucesso:
            raise Exception("Usuário não encontrado")
        
        return True
    except Exception as e:
        raise Exception(f"Erro ao redefinir senha: {str(e)}")

