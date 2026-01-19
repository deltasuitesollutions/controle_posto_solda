"""
Modelo para a entidade Modelo (Produto)
"""
from typing import Dict, Any, Optional, List, Tuple
from Server.models.database import DatabaseConnection


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
        # A tabela tem: modelo_id, nome
        nome_val = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        return Modelo(
            id=row[0] if len(row) > 0 else None,
            codigo=nome_val,  # Usar nome como codigo para compatibilidade
            descricao=nome_val
        )
    
    def save(self) -> 'Modelo':
        """Salva o modelo no banco de dados"""
        # A tabela tem: modelo_id, nome
        nome = self.descricao or self.codigo
        if self.id:
            # Atualizar
            query = "UPDATE modelos SET nome = %s WHERE modelo_id = %s"
            params: Tuple[Any, ...] = (nome, self.id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING modelo_id para PostgreSQL
            query = "INSERT INTO modelos (nome) VALUES (%s) RETURNING modelo_id"
            params = (nome,)
            result = DatabaseConnection.execute_query(query, params, fetch_one=True)
            if result and isinstance(result, tuple) and len(result) > 0:
                self.id = result[0]
        return self
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['Modelo']:
        """Busca um modelo pelo ID"""
        query = "SELECT modelo_id, nome FROM modelos WHERE modelo_id = %s"
        row = DatabaseConnection.execute_query(query, (id,), fetch_one=True)
        if not row:
            return None
        return Modelo.from_row(row)
    
    @staticmethod
    def buscar_por_codigo(codigo: str) -> Optional['Modelo']:
        """Busca um modelo pelo código (nome)"""
        query = "SELECT modelo_id, nome FROM modelos WHERE nome = %s"
        row = DatabaseConnection.execute_query(query, (codigo,), fetch_one=True)
        if not row:
            return None
        return Modelo.from_row(row)
    
    @staticmethod
    def listar_todos() -> List['Modelo']:
        """Lista todos os modelos"""
        query = "SELECT modelo_id, nome FROM modelos ORDER BY nome"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [Modelo.from_row(row) for row in rows]
    
    def delete(self) -> None:
        """Remove o modelo do banco de dados"""
        if not self.id:
            raise Exception("Modelo não possui ID")
        query = "DELETE FROM modelos WHERE modelo_id = %s"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    @staticmethod
    def criar(codigo: str, descricao: Optional[str] = None) -> 'Modelo':
        """Método estático para criar um novo modelo"""
        modelo = Modelo(codigo=codigo, descricao=descricao)
        return modelo.save()

