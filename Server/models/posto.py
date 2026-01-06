"""
Modelo para a entidade Posto
"""
from typing import Dict, Any, Optional, List, Tuple
from backend.models.database import DatabaseConnection


class Posto:
    """Modelo que representa um posto de trabalho"""
    
    def __init__(self, codigo: str, descricao: Optional[str] = None, ativo: bool = True, id: Optional[int] = None) -> None:
        self.id: Optional[int] = id
        self.codigo: str = codigo
        self.descricao: str = descricao or codigo
        self.ativo: bool = ativo
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "id": self.id,
            "codigo": self.codigo,
            "descricao": self.descricao,
            "ativo": self.ativo
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Posto':
        """Cria um objeto Posto a partir de um dicionário"""
        codigo_val = data.get('codigo')
        if codigo_val is None:
            codigo_val = ''
        return Posto(
            id=data.get('id'),
            codigo=codigo_val,
            descricao=data.get('descricao'),
            ativo=data.get('ativo', True)
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'Posto':
        """Cria um objeto Posto a partir de uma linha do banco"""
        codigo_val = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        descricao_val = str(row[2]) if len(row) > 2 and row[2] is not None else codigo_val
        return Posto(
            id=row[0] if len(row) > 0 else None,
            codigo=codigo_val,
            descricao=descricao_val,
            ativo=bool(row[3]) if len(row) > 3 and row[3] is not None else True
        )
    
    def save(self) -> 'Posto':
        """Salva o posto no banco de dados"""
        if self.id:
            # Atualizar
            query = "UPDATE postos SET codigo = ?, descricao = ?, ativo = ? WHERE id = ?"
            params: Tuple[Any, ...] = (self.codigo, self.descricao, self.ativo, self.id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING id para PostgreSQL
            query = "INSERT INTO postos (codigo, descricao, ativo) VALUES (?, ?, ?) RETURNING id"
            params = (self.codigo, self.descricao, self.ativo)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.id = result
        return self
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['Posto']:
        """Busca um posto pelo ID"""
        query = "SELECT id, codigo, descricao, ativo FROM postos WHERE id = ?"
        row = DatabaseConnection.execute_query(query, (id,), fetch_one=True)
        if not row:
            return None
        return Posto.from_row(row)
    
    @staticmethod
    def buscar_por_codigo(codigo: str) -> Optional['Posto']:
        """Busca um posto pelo código"""
        query = "SELECT id, codigo, descricao, ativo FROM postos WHERE codigo = ?"
        row = DatabaseConnection.execute_query(query, (codigo,), fetch_one=True)
        if not row:
            return None
        return Posto.from_row(row)
    
    @staticmethod
    def listar_todos() -> List['Posto']:
        """Lista todos os postos"""
        query = "SELECT id, codigo, descricao, ativo FROM postos ORDER BY codigo"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [Posto.from_row(row) for row in rows]
    
    @staticmethod
    def listar_ativos() -> List['Posto']:
        """Lista apenas postos ativos"""
        query = "SELECT id, codigo, descricao, ativo FROM postos WHERE ativo = TRUE ORDER BY codigo"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [Posto.from_row(row) for row in rows]
    
    def delete(self) -> None:
        """Remove o posto do banco de dados"""
        if not self.id:
            raise Exception("Posto não possui ID")
        query = "DELETE FROM postos WHERE id = ?"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    @staticmethod
    def criar(codigo: str, descricao: Optional[str] = None, ativo: bool = True) -> 'Posto':
        """Método estático para criar um novo posto"""
        posto = Posto(codigo=codigo, descricao=descricao, ativo=ativo)
        return posto.save()

