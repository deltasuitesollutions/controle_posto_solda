from typing import Dict, Any, Optional, List, Tuple
from Server.models.database import DatabaseConnection


class Funcionario:
    def __init__(self, matricula: str, nome: str, ativo: bool = True, tag: Optional[str] = None, id: Optional[int] = None) -> None:
        self.id: Optional[int] = id
        self.matricula: str = matricula
        self.nome: str = nome
        self.ativo: bool = ativo
        self.tag: Optional[str] = tag
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "matricula": self.matricula,
            "nome": self.nome,
            "ativo": self.ativo,
            "tag": self.tag
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Funcionario':
        return Funcionario(
            id=data.get('id'),
            matricula=data.get('matricula', '') or '',
            nome=data.get('nome', '') or '',
            ativo=data.get('ativo', True),
            tag=data.get('tag') or data.get('tagRfid')  # Suporta ambos para compatibilidade
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'Funcionario':
        id_val = row[0] if len(row) > 0 else None
        matricula_val = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        nome_val = str(row[2]) if len(row) > 2 and row[2] is not None else ''
        ativo_val = bool(row[3]) if len(row) > 3 and row[3] is not None else True
        tag_val = str(row[4]) if len(row) > 4 and row[4] is not None else None
        
        return Funcionario(
            id=id_val,
            matricula=matricula_val,
            nome=nome_val,
            ativo=ativo_val,
            tag=tag_val
        )
    
    def save(self) -> 'Funcionario':
        if self.id:
            query = "UPDATE funcionarios SET matricula = ?, nome = ?, ativo = ?, tag = ? WHERE id = ?"
            params: Tuple[Any, ...] = (self.matricula, self.nome, self.ativo, self.tag, self.id)
            DatabaseConnection.execute_query(query, params)
        else:
            query = "INSERT INTO funcionarios (matricula, nome, ativo, tag) VALUES (?, ?, ?, ?) RETURNING id"
            params = (self.matricula, self.nome, self.ativo, self.tag)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.id = result
        return self
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['Funcionario']:
        query = "SELECT id, matricula, nome, ativo, tag FROM funcionarios WHERE id = ?"
        row = DatabaseConnection.execute_query(query, (id,), fetch_one=True)
        if not row or not isinstance(row, tuple):
            return None
        return Funcionario.from_row(row)
    
    @staticmethod
    def buscar_por_matricula(matricula: str) -> Optional['Funcionario']:
        if not matricula:
            return None
        query = "SELECT id, matricula, nome, ativo, tag FROM funcionarios WHERE matricula = ?"
        row = DatabaseConnection.execute_query(query, (matricula,), fetch_one=True)
        if not row or not isinstance(row, tuple):
            return None
        return Funcionario.from_row(row)
    
    @staticmethod
    def buscar_por_tag(tag: str) -> Optional['Funcionario']:
        if not tag:
            return None
        query = "SELECT id, matricula, nome, ativo, tag FROM funcionarios WHERE tag = ?"
        row = DatabaseConnection.execute_query(query, (tag,), fetch_one=True)
        if not row or not isinstance(row, tuple):
            return None
        return Funcionario.from_row(row)
    
    @staticmethod
    def listar_todos() -> List['Funcionario']:
        query = "SELECT id, matricula, nome, ativo, tag FROM funcionarios ORDER BY nome"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        valid_rows = [row for row in rows if isinstance(row, tuple)]
        return [Funcionario.from_row(row) for row in valid_rows]
    
    @staticmethod
    def listar_ativos() -> List['Funcionario']:
        query = "SELECT id, matricula, nome, ativo, tag FROM funcionarios WHERE ativo = TRUE ORDER BY nome"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        valid_rows = [row for row in rows if isinstance(row, tuple)]
        return [Funcionario.from_row(row) for row in valid_rows]
    
    def delete(self) -> None:
        if not self.id:
            raise Exception("Funcionário não possui ID")
        query = "DELETE FROM funcionarios WHERE id = ?"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    @staticmethod
    def criar(matricula: str, nome: str, ativo: bool = True, tag: Optional[str] = None) -> 'Funcionario':
        funcionario = Funcionario(matricula=matricula, nome=nome, ativo=ativo, tag=tag)
        return funcionario.save()
