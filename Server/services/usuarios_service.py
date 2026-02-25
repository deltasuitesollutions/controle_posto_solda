from typing import Dict, Any, List, Optional
from Server.models import Usuario

# Lista todos os usuários ativos
def listar_usuarios() -> List[Dict[str, Any]]:
    usuarios = Usuario.listar_ativos()
    resultado = []
    
    for u in usuarios:
        resultado.append(u.to_dict())
    
    return resultado


# Lista todos os usuários (ativos e inativos)
def listar_todos_usuarios() -> List[Dict[str, Any]]:
    usuarios = Usuario.listar_todos()
    resultado = []
    
    for u in usuarios:
        resultado.append(u.to_dict())
    
    return resultado


# Busca um usuário por ID
def buscar_usuario_por_id(usuario_id: int) -> Optional[Dict[str, Any]]:
    usuario = Usuario.buscar_por_id(usuario_id)
    if not usuario:
        return None
    return usuario.to_dict()


# Cria um novo usuário
def criar_usuario(
    username: str, 
    nome: str, 
    senha: str,
    role: str = 'admin',
    ativo: bool = True
) -> Dict[str, Any]:
    
    if not username or not username.strip():
        raise Exception("Username é obrigatório")
    
    if not nome or not nome.strip():
        raise Exception("Nome é obrigatório")
    
    if not senha or not senha.strip():
        raise Exception("Senha é obrigatória")
    
    username = username.strip()
    nome = nome.strip()
    
    # Validar role
    if role not in ['admin', 'operador', 'master']:
        raise Exception("Role inválido. Deve ser 'admin', 'operador' ou 'master'")
    
    # Verificar se username já existe
    if Usuario.buscar_por_username(username):
        raise Exception(f"Já existe um usuário com o username '{username}'")
    
    # Criar hash da senha
    senha_hash = Usuario.hash_senha(senha)
    
    usuario = Usuario(
        username=username,
        nome=nome,
        role=role,
        ativo=ativo,
        senha_hash=senha_hash
    )
    
    usuario.save()
    
    return usuario.to_dict()


# Atualiza um usuário existente
def atualizar_usuario(
    usuario_id: int, 
    username: Optional[str] = None,
    nome: Optional[str] = None,
    role: Optional[str] = None,
    ativo: Optional[bool] = None,
    senha: Optional[str] = None
) -> Dict[str, Any]:
    
    usuario = Usuario.buscar_por_id(usuario_id)
    if not usuario:
        raise Exception(f"Usuário com ID {usuario_id} não encontrado")
    
    # Atualizar campos fornecidos
    if username is not None:
        username = username.strip()
        if username and username != usuario.username:
            # Verificar se o novo username já existe
            usuario_existente = Usuario.buscar_por_username(username)
            if usuario_existente and usuario_existente.usuario_id != usuario_id:
                raise Exception(f"Já existe um usuário com o username '{username}'")
            usuario.username = username
    
    if nome is not None:
        nome = nome.strip()
        if nome:
            usuario.nome = nome
    
    if role is not None:
        if role not in ['admin', 'operador', 'master']:
            raise Exception("Role inválido. Deve ser 'admin', 'operador' ou 'master'")
        usuario.role = role
    
    if ativo is not None:
        usuario.ativo = ativo
    
    if senha is not None:
        senha = senha.strip()
        if senha:
            usuario.senha_hash = Usuario.hash_senha(senha)
    
    usuario.save()
    
    return usuario.to_dict()


# Deleta um usuário
def deletar_usuario(usuario_id: int) -> bool:
    usuario = Usuario.buscar_por_id(usuario_id)
    if not usuario:
        raise Exception(f"Usuário com ID {usuario_id} não encontrado")
    
    return usuario.deletar()


# Autentica um usuário
def autenticar_usuario(username: str, senha: str) -> Optional[Dict[str, Any]]:
    if not username or not username.strip():
        raise Exception("Username é obrigatório")
    
    if not senha or not senha.strip():
        raise Exception("Senha é obrigatória")
    
    username = username.strip()
    usuario = Usuario.buscar_por_username(username)
    
    if not usuario:
        return None
    
    if not usuario.ativo:
        raise Exception("Usuário inativo")
    
    senha_hash = Usuario.hash_senha(senha)
    if usuario.senha_hash != senha_hash:
        return None
    
    return usuario.to_dict()
