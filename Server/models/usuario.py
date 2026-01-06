"""
Modelo para a entidade Usuario
"""
from typing import Dict, Any, Optional, List, Tuple
from backend.models.database import DatabaseConnection
import hashlib


class Usuario:
    """Modelo que representa um usuário do sistema"""
    
    def __init__(self, username: str, email: str, senha_hash: str, nome: str, ativo: bool = True, id: Optional[int] = None, role: str = 'admin') -> None:
        self.id: Optional[int] = id
        self.username: str = username
        self.email: str = email
        self.senha_hash: str = senha_hash
        self.nome: str = nome
        self.ativo: bool = ativo
        self.role: str = role
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário (sem a senha)"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "nome": self.nome,
            "ativo": self.ativo,
            "role": self.role
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Usuario':
        """Cria um objeto Usuario a partir de um dicionário"""
        id_val = data.get('id')
        username_val = data.get('username', '')
        email_val = data.get('email', '')
        senha_hash_val = data.get('senha_hash', '')
        nome_val = data.get('nome', '')
        role_val = data.get('role', 'admin')
        
        if username_val is None:
            username_val = ''
        if email_val is None:
            email_val = ''
        if senha_hash_val is None:
            senha_hash_val = ''
        if nome_val is None:
            nome_val = ''
        if role_val is None:
            role_val = 'admin'
        
        return Usuario(
            id=id_val,
            username=username_val,
            email=email_val,
            senha_hash=senha_hash_val,
            nome=nome_val,
            ativo=data.get('ativo', True),
            role=role_val
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'Usuario':
        """Cria um objeto Usuario a partir de uma linha do banco"""
        def safe_decode(value: Any) -> str:
            """Decodifica um valor de forma segura para UTF-8"""
            if value is None:
                return ''
            if isinstance(value, bytes):
                try:
                    return value.decode('utf-8')
                except UnicodeDecodeError:
                    try:
                        return value.decode('latin-1')
                    except UnicodeDecodeError:
                        return value.decode('utf-8', errors='replace')
            return str(value)
        
        id_val = row[0] if len(row) > 0 else None
        username_val = safe_decode(row[1]) if len(row) > 1 and row[1] is not None else ''
        email_val = safe_decode(row[2]) if len(row) > 2 and row[2] is not None else ''
        senha_hash_val = safe_decode(row[3]) if len(row) > 3 and row[3] is not None else ''
        nome_val = safe_decode(row[4]) if len(row) > 4 and row[4] is not None else ''
        ativo_val = bool(row[5]) if len(row) > 5 and row[5] is not None else True
        role_val = safe_decode(row[6]) if len(row) > 6 and row[6] is not None else 'admin'
        
        return Usuario(
            id=id_val,
            username=username_val,
            email=email_val,
            senha_hash=senha_hash_val,
            nome=nome_val,
            ativo=ativo_val,
            role=role_val
        )
    
    @staticmethod
    def hash_senha(senha: str) -> str:
        """Gera hash SHA-256 da senha"""
        return hashlib.sha256(senha.encode('utf-8')).hexdigest()
    
    def verificar_senha(self, senha: str) -> bool:
        """Verifica se a senha fornecida corresponde ao hash armazenado"""
        senha_hash = self.hash_senha(senha)
        return senha_hash == self.senha_hash
    
    def save(self) -> 'Usuario':
        """Salva o usuário no banco de dados"""
        def ensure_utf8(value: str) -> str:
            """Garante que o valor seja uma string UTF-8 válida"""
            if isinstance(value, bytes):
                try:
                    return value.decode('utf-8')
                except UnicodeDecodeError:
                    return value.decode('latin-1', errors='replace')
            return str(value).encode('utf-8', errors='replace').decode('utf-8')
        
        # Garantir que todos os campos de texto sejam UTF-8 válidos
        username = ensure_utf8(self.username)
        email = ensure_utf8(self.email)
        senha_hash = ensure_utf8(self.senha_hash)
        nome = ensure_utf8(self.nome)
        role = ensure_utf8(self.role)
        
        if self.id:
            # Atualizar
            query = """
                UPDATE usuarios 
                SET username = ?, email = ?, senha_hash = ?, nome = ?, ativo = ?, role = ?, data_atualizacao = CURRENT_TIMESTAMP 
                WHERE id = ?
            """
            params: Tuple[Any, ...] = (username, email, senha_hash, nome, self.ativo, role, self.id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING id para PostgreSQL
            query = """
                INSERT INTO usuarios (username, email, senha_hash, nome, ativo, role) 
                VALUES (?, ?, ?, ?, ?, ?) 
                RETURNING id
            """
            params = (username, email, senha_hash, nome, self.ativo, role)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.id = result
        return self
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['Usuario']:
        """Busca um usuário pelo ID"""
        query = "SELECT id, username, email, senha_hash, nome, ativo, role FROM usuarios WHERE id = ?"
        row = DatabaseConnection.execute_query(query, (id,), fetch_one=True)
        if not row:
            return None
        
        if isinstance(row, tuple):
            return Usuario.from_row(row)
        return None
    
    @staticmethod
    def buscar_por_username(username: str) -> Optional['Usuario']:
        """Busca um usuário pelo username"""
        query = "SELECT id, username, email, senha_hash, nome, ativo, role FROM usuarios WHERE username = ?"
        row = DatabaseConnection.execute_query(query, (username,), fetch_one=True)
        if not row:
            return None
        
        if isinstance(row, tuple):
            return Usuario.from_row(row)
        return None
    
    @staticmethod
    def buscar_por_email(email: str) -> Optional['Usuario']:
        """Busca um usuário pelo email"""
        query = "SELECT id, username, email, senha_hash, nome, ativo, role FROM usuarios WHERE email = ?"
        row = DatabaseConnection.execute_query(query, (email,), fetch_one=True)
        if not row:
            return None
        
        if isinstance(row, tuple):
            return Usuario.from_row(row)
        return None
    
    @staticmethod
    def criar(username: str, email: str, senha: str, nome: str, ativo: bool = True, role: str = 'admin') -> 'Usuario':
        """Método estático para criar um novo usuário"""
        senha_hash = Usuario.hash_senha(senha)
        usuario = Usuario(username=username, email=email, senha_hash=senha_hash, nome=nome, ativo=ativo, role=role)
        return usuario.save()
    
    def delete(self) -> None:
        """Remove o usuário do banco de dados"""
        if not self.id:
            raise Exception("Usuário não possui ID")
        query = "DELETE FROM usuarios WHERE id = ?"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    def atualizar_senha(self, nova_senha: str) -> 'Usuario':
        """Atualiza a senha do usuário"""
        if not self.id:
            raise Exception("Usuário não possui ID")
        nova_senha_hash = Usuario.hash_senha(nova_senha)
        self.senha_hash = nova_senha_hash
        query = "UPDATE usuarios SET senha_hash = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?"
        DatabaseConnection.execute_query(query, (self.senha_hash, self.id))
        return self
    
    @staticmethod
    def atualizar_senha_por_username(username: str, nova_senha: str) -> bool:
        """Atualiza a senha de um usuário pelo username"""
        usuario = Usuario.buscar_por_username(username)
        if not usuario:
            return False
        usuario.atualizar_senha(nova_senha)
        return True



