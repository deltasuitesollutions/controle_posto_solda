"""
Modelo para a entidade Modelo (Produto)
"""
from typing import Dict, Any, Optional, List, Tuple
from backend.models.database import DatabaseConnection


class Modelo:
    """Modelo que representa um modelo/produto"""
    
    def __init__(self, codigo: str, descricao: Optional[str] = None, id: Optional[int] = None) -> None:
        self.id: Optional[int] = id
        self.codigo: str = codigo
        self.descricao: str = descricao or codigo
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "id": self.id,
            "codigo": self.codigo,
            "descricao": self.descricao
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Modelo':
        """Cria um objeto Modelo a partir de um dicionário"""
        codigo_val = data.get('codigo')
        if codigo_val is None:
            codigo_val = ''
        return Modelo(
            id=data.get('id'),
            codigo=codigo_val,
            descricao=data.get('descricao')
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'Modelo':
        """Cria um objeto Modelo a partir de uma linha do banco"""
        codigo_val = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        descricao_val = str(row[2]) if len(row) > 2 and row[2] is not None else codigo_val
        return Modelo(
            id=row[0] if len(row) > 0 else None,
            codigo=codigo_val,
            descricao=descricao_val
        )
    
    def save(self) -> 'Modelo':
        """Salva o modelo no banco de dados"""
        if self.id:
            # Atualizar
            query = "UPDATE modelos SET codigo = ?, descricao = ? WHERE id = ?"
            params: Tuple[Any, ...] = (self.codigo, self.descricao, self.id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING id para PostgreSQL
            query = "INSERT INTO modelos (codigo, descricao) VALUES (?, ?) RETURNING id"
            params = (self.codigo, self.descricao)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.id = result
        return self
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['Modelo']:
        """Busca um modelo pelo ID"""
        query = "SELECT id, codigo, descricao FROM modelos WHERE id = ?"
        row = DatabaseConnection.execute_query(query, (id,), fetch_one=True)
        if not row:
            return None
        return Modelo.from_row(row)
    
    @staticmethod
    def buscar_por_codigo(codigo: str) -> Optional['Modelo']:
        """Busca um modelo pelo código"""
        query = "SELECT id, codigo, descricao FROM modelos WHERE codigo = ?"
        row = DatabaseConnection.execute_query(query, (codigo,), fetch_one=True)
        if not row:
            return None
        return Modelo.from_row(row)
    
    @staticmethod
    def listar_todos() -> List['Modelo']:
        """Lista todos os modelos"""
        query = "SELECT id, codigo, descricao FROM modelos ORDER BY codigo"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [Modelo.from_row(row) for row in rows]
    
    def delete(self) -> None:
        """Remove o modelo do banco de dados"""
        if not self.id:
            raise Exception("Modelo não possui ID")
        query = "DELETE FROM modelos WHERE id = ?"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    @staticmethod
    def criar(codigo: str, descricao: Optional[str] = None) -> 'Modelo':
        """Método estático para criar um novo modelo"""
        modelo = Modelo(codigo=codigo, descricao=descricao)
        return modelo.save()

