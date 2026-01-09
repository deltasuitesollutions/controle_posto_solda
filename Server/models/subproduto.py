"""
Modelo para a entidade Subproduto (Sublinha)
"""
from typing import Dict, Any, Optional, List, Tuple
from Server.models.database import DatabaseConnection


class Subproduto:
    """Modelo que representa um subproduto/sublinha de um modelo"""
    
    def __init__(self, modelo_id: int, codigo: str, descricao: Optional[str] = None, id: Optional[int] = None) -> None:
        self.id: Optional[int] = id
        self.modelo_id: int = modelo_id
        self.codigo: str = codigo
        self.descricao: str = descricao or codigo
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "id": self.id,
            "modelo_id": self.modelo_id,
            "codigo": self.codigo,
            "descricao": self.descricao
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Subproduto':
        """Cria um objeto Subproduto a partir de um dicionário"""
        codigo_val = data.get('codigo')
        if codigo_val is None:
            codigo_val = ''
        return Subproduto(
            id=data.get('id'),
            modelo_id=data.get('modelo_id', 0),
            codigo=codigo_val,
            descricao=data.get('descricao')
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'Subproduto':
        """Cria um objeto Subproduto a partir de uma linha do banco"""
        codigo_val = str(row[2]) if len(row) > 2 and row[2] is not None else ''
        descricao_val = str(row[3]) if len(row) > 3 and row[3] is not None else codigo_val
        return Subproduto(
            id=row[0] if len(row) > 0 else None,
            modelo_id=row[1] if len(row) > 1 and row[1] is not None else 0,
            codigo=codigo_val,
            descricao=descricao_val
        )
    
    def save(self) -> 'Subproduto':
        """Salva o subproduto no banco de dados"""
        if self.id:
            # Atualizar
            query = "UPDATE subprodutos SET modelo_id = %s, codigo = %s, descricao = %s WHERE id = %s"
            params: Tuple[Any, ...] = (self.modelo_id, self.codigo, self.descricao, self.id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING id para PostgreSQL
            query = "INSERT INTO subprodutos (modelo_id, codigo, descricao) VALUES (%s, %s, %s) RETURNING id"
            params = (self.modelo_id, self.codigo, self.descricao)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.id = result
        return self
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['Subproduto']:
        """Busca um subproduto pelo ID"""
        query = "SELECT id, modelo_id, codigo, descricao FROM subprodutos WHERE id = %s"
        row = DatabaseConnection.execute_query(query, (id,), fetch_one=True)
        if not row:
            return None
        return Subproduto.from_row(row)
    
    @staticmethod
    def buscar_por_modelo_id(modelo_id: int) -> List['Subproduto']:
        """Busca todos os subprodutos de um modelo"""
        query = "SELECT id, modelo_id, codigo, descricao FROM subprodutos WHERE modelo_id = %s ORDER BY codigo"
        rows = DatabaseConnection.execute_query(query, (modelo_id,), fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [Subproduto.from_row(row) for row in rows]
    
    @staticmethod
    def listar_todos() -> List['Subproduto']:
        """Lista todos os subprodutos"""
        query = "SELECT id, modelo_id, codigo, descricao FROM subprodutos ORDER BY modelo_id, codigo"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [Subproduto.from_row(row) for row in rows]
    
    def delete(self) -> None:
        """Remove o subproduto do banco de dados"""
        if not self.id:
            raise Exception("Subproduto não possui ID")
        query = "DELETE FROM subprodutos WHERE id = %s"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    @staticmethod
    def deletar_por_modelo_id(modelo_id: int) -> None:
        """Remove todos os subprodutos de um modelo"""
        query = "DELETE FROM subprodutos WHERE modelo_id = %s"
        DatabaseConnection.execute_query(query, (modelo_id,))
    
    @staticmethod
    def criar(modelo_id: int, codigo: str, descricao: Optional[str] = None) -> 'Subproduto':
        """Método estático para criar um novo subproduto"""
        subproduto = Subproduto(modelo_id=modelo_id, codigo=codigo, descricao=descricao)
        return subproduto.save()

