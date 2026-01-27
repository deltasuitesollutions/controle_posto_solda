from typing import Dict, Any, Optional, List, Tuple
from Server.models.database import DatabaseConnection
import hashlib


class Usuario:
    """Modelo que representa um usuário do sistema"""
    
    def __init__(
        self, 
        username: str, 
        nome: str, 
        role: str = 'admin',
        ativo: bool = True, 
        senha_hash: Optional[str] = None,
        usuario_id: Optional[int] = None
    ) -> None:
        self.usuario_id: Optional[int] = usuario_id
        self.username: str = username
        self.nome: str = nome
        self.role: str = role
        self.ativo: bool = ativo
        self.senha_hash: Optional[str] = senha_hash
    
    @staticmethod
    def hash_senha(senha: str) -> str:
        """Gera hash SHA-256 da senha"""
        return hashlib.sha256(senha.encode('utf-8')).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        result = {
            "username": self.username,
            "nome": self.nome,
            "role": self.role,
            "ativo": self.ativo
        }
        if self.usuario_id is not None:
            result["id"] = self.usuario_id
            result["usuario_id"] = self.usuario_id
        return result
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Usuario':
        """Cria um objeto Usuario a partir de um dicionário"""
        usuario_id_val = data.get('usuario_id') or data.get('id')
        username_val = data.get('username', '')
        nome_val = data.get('nome', '')
        role_val = data.get('role', 'admin')
        ativo_val = data.get('ativo', True)
        senha_hash_val = data.get('senha_hash')
        
        return Usuario(
            usuario_id=usuario_id_val,
            username=username_val,
            nome=nome_val,
            role=role_val,
            ativo=ativo_val,
            senha_hash=senha_hash_val
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'Usuario':
        """Cria um objeto Usuario a partir de uma linha do banco"""
        usuario_id_val = int(row[0]) if len(row) > 0 and row[0] is not None else None
        username_val = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        senha_hash_val = str(row[2]) if len(row) > 2 and row[2] is not None else None
        nome_val = str(row[3]) if len(row) > 3 and row[3] is not None else ''
        ativo_val = bool(row[4]) if len(row) > 4 and row[4] is not None else True
        role_val = str(row[5]) if len(row) > 5 and row[5] is not None else 'admin'
        
        return Usuario(
            usuario_id=usuario_id_val,
            username=username_val,
            nome=nome_val,
            role=role_val,
            ativo=ativo_val,
            senha_hash=senha_hash_val
        )
    
    def save(self) -> 'Usuario':
        """Salva o usuário no banco de dados"""
        if self.usuario_id:
            # Atualizar
            query = """
                UPDATE usuarios 
                SET username = ?, nome = ?, role = ?, ativo = ?, 
                    senha_hash = COALESCE(?, senha_hash), data_atualizacao = CURRENT_TIMESTAMP
                WHERE id = ?
            """
            params: Tuple[Any, ...] = (
                self.username, self.nome, self.role, self.ativo, 
                self.senha_hash, self.usuario_id
            )
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir
            if not self.senha_hash:
                raise Exception("Senha é obrigatória para criar novo usuário")
            
            query = """
                INSERT INTO usuarios (username, senha_hash, nome, role, ativo) 
                VALUES (?, ?, ?, ?, ?) 
                RETURNING id
            """
            params = (self.username, self.senha_hash, self.nome, self.role, self.ativo)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.usuario_id = result
        return self
    
    @staticmethod
    def buscar_por_id(usuario_id: int) -> Optional['Usuario']:
        """Busca um usuário por ID"""
        query = """
            SELECT id, username, senha_hash, nome, ativo, role
            FROM usuarios 
            WHERE id = ?
        """
        result = DatabaseConnection.execute_query(query, (usuario_id,), fetch_all=True)
        if result and len(result) > 0:
            return Usuario.from_row(result[0])
        return None
    
    @staticmethod
    def buscar_por_username(username: str) -> Optional['Usuario']:
        """Busca um usuário por username"""
        query = """
            SELECT id, username, senha_hash, nome, ativo, role
            FROM usuarios 
            WHERE username = ?
        """
        result = DatabaseConnection.execute_query(query, (username,), fetch_all=True)
        if result and len(result) > 0:
            return Usuario.from_row(result[0])
        return None
    
    @staticmethod
    def listar_todos() -> List['Usuario']:
        """Lista todos os usuários"""
        query = """
            SELECT id, username, senha_hash, nome, ativo, role
            FROM usuarios 
            ORDER BY nome
        """
        result = DatabaseConnection.execute_query(query, fetch_all=True)
        if result:
            return [Usuario.from_row(row) for row in result]
        return []
    
    @staticmethod
    def listar_ativos() -> List['Usuario']:
        """Lista apenas usuários ativos"""
        query = """
            SELECT id, username, senha_hash, nome, ativo, role
            FROM usuarios 
            WHERE ativo = TRUE
            ORDER BY nome
        """
        result = DatabaseConnection.execute_query(query, fetch_all=True)
        if result:
            return [Usuario.from_row(row) for row in result]
        return []
    
    def deletar(self) -> bool:
        """Deleta o usuário do banco de dados"""
        if not self.usuario_id:
            return False
        
        # Primeiro, atualizar referências na tabela operacoes_canceladas para NULL
        # Isso evita violação de chave estrangeira
        try:
            update_query = """
                UPDATE operacoes_canceladas 
                SET cancelado_por_usuario_id = NULL 
                WHERE cancelado_por_usuario_id = ?
            """
            DatabaseConnection.execute_query(update_query, (self.usuario_id,))
        except Exception as e:
            # Se a tabela não existir ou houver outro erro, apenas logar e continuar
            print(f"Aviso: Erro ao atualizar referências em operacoes_canceladas: {e}")
        
        # Verificar e lidar com audit_log
        # Como usuario_id é NOT NULL em audit_log, precisamos deletar os registros
        # ou verificar se a constraint permite NULL (depende da migração)
        try:
            # Tentar deletar registros de audit_log relacionados ao usuário
            # Isso mantém a integridade do banco, mas remove o histórico de auditoria
            delete_audit_query = """
                DELETE FROM audit_log 
                WHERE usuario_id = ?
            """
            DatabaseConnection.execute_query(delete_audit_query, (self.usuario_id,))
        except Exception as e:
            # Se a tabela não existir ou houver outro erro, apenas logar e continuar
            print(f"Aviso: Erro ao deletar registros de audit_log: {e}")
        
        # Agora pode deletar o usuário com segurança
        query = "DELETE FROM usuarios WHERE id = ?"
        DatabaseConnection.execute_query(query, (self.usuario_id,))
        return True

