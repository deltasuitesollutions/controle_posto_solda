"""
Modelo para a entidade Posto
"""
from typing import Dict, Any, Optional, List, Tuple
from Server.models.database import DatabaseConnection


class Posto:
    """Modelo que representa um posto de trabalho"""
    
    def __init__(self, nome: str, sublinha_id: int, toten_id: int, posto_id: Optional[int] = None) -> None:
        self.posto_id: Optional[int] = posto_id
        self.nome: str = nome
        self.sublinha_id: int = sublinha_id
        self.toten_id: int = toten_id
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "posto_id": self.posto_id,
            "nome": self.nome,
            "sublinha_id": self.sublinha_id,
            "toten_id": self.toten_id
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Posto':
        """Cria um objeto Posto a partir de um dicionário"""
        return Posto(
            posto_id=data.get('posto_id'),
            nome=data.get('nome', ''),
            sublinha_id=data.get('sublinha_id'),
            toten_id=data.get('toten_id')
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'Posto':
        """Cria um objeto Posto a partir de uma linha do banco"""
        return Posto(
            posto_id=row[0] if len(row) > 0 and row[0] is not None else None,
            nome=str(row[1]) if len(row) > 1 and row[1] is not None else '',
            sublinha_id=int(row[2]) if len(row) > 2 and row[2] is not None else 0,
            toten_id=int(row[3]) if len(row) > 3 and row[3] is not None else 0
        )
    
    def save(self) -> 'Posto':
        """Salva o posto no banco de dados"""
        if self.posto_id:
            # Atualizar
            query = "UPDATE postos SET nome = %s, sublinha_id = %s, toten_id = %s WHERE posto_id = %s"
            params: Tuple[Any, ...] = (self.nome, self.sublinha_id, self.toten_id, self.posto_id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING id para PostgreSQL
            query = "INSERT INTO postos (nome, sublinha_id, toten_id) VALUES (%s, %s, %s) RETURNING posto_id"
            params = (self.nome, self.sublinha_id, self.toten_id)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.posto_id = result
        return self
    
    @staticmethod
    def buscar_por_id(posto_id: int) -> Optional['Posto']:
        """Busca um posto pelo ID"""
        query = "SELECT posto_id, nome, sublinha_id, toten_id FROM postos WHERE posto_id = %s"
        row = DatabaseConnection.execute_query(query, (posto_id,), fetch_one=True)
        if not row:
            return None
        return Posto.from_row(row)
    
    @staticmethod
    def listar_todos() -> List['Posto']:
        """Lista todos os postos"""
        query = "SELECT posto_id, nome, sublinha_id, toten_id FROM postos ORDER BY nome"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [Posto.from_row(row) for row in rows]
    
    @staticmethod
    def buscar_por_sublinha(sublinha_id: int) -> List['Posto']:
        """Lista postos por sublinha"""
        query = "SELECT posto_id, nome, sublinha_id, toten_id FROM postos WHERE sublinha_id = %s ORDER BY nome"
        rows = DatabaseConnection.execute_query(query, (sublinha_id,), fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [Posto.from_row(row) for row in rows]
    
    @staticmethod
    def buscar_por_toten(toten_id: int) -> List['Posto']:
        """Lista postos por toten"""
        query = "SELECT posto_id, nome, sublinha_id, toten_id FROM postos WHERE toten_id = %s ORDER BY nome"
        rows = DatabaseConnection.execute_query(query, (toten_id,), fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [Posto.from_row(row) for row in rows]
    
    def delete(self) -> None:
        """Remove o posto do banco de dados"""
        if not self.posto_id:
            raise Exception("Posto não possui ID")
        query = "DELETE FROM postos WHERE posto_id = %s"
        DatabaseConnection.execute_query(query, (self.posto_id,))
        self.posto_id = None
    
    @staticmethod
    def criar(nome: str, sublinha_id: int, toten_id: int) -> 'Posto':
        """Método estático para criar um novo posto"""
        posto = Posto(nome=nome, sublinha_id=sublinha_id, toten_id=toten_id)
        return posto.save()
