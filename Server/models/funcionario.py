"""
Modelo para a entidade Funcionario
"""
from typing import Dict, Any, Optional, List, Tuple, Union
from Server.models.database import DatabaseConnection


class Funcionario:
    """Modelo que representa um funcionário"""
    
    def __init__(self, matricula: str, nome: str, ativo: bool = True, id: Optional[int] = None) -> None:
        self.id: Optional[int] = id
        self.matricula: str = matricula
        self.nome: str = nome
        self.ativo: bool = ativo
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "id": self.id,
            "matricula": self.matricula,
            "nome": self.nome,
            "ativo": self.ativo
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Funcionario':
        """Cria um objeto Funcionario a partir de um dicionário"""
        # Corrigindo os problemas de tipo Any | None
        id_val = data.get('id')
        matricula_val = data.get('matricula', '')
        nome_val = data.get('nome', '')
        
        # Convertendo valores None para valores padrão
        if matricula_val is None:
            matricula_val = ''
        if nome_val is None:
            nome_val = ''
        
        return Funcionario(
            id=id_val,
            matricula=matricula_val,  
            nome=nome_val,            
            ativo=data.get('ativo', True)
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'Funcionario':
        """Cria um objeto Funcionario a partir de uma linha do banco"""
        # Garantindo que temos valores padrão para evitar None
        id_val = row[0] if len(row) > 0 else None
        matricula_val = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        nome_val = str(row[2]) if len(row) > 2 and row[2] is not None else ''
        ativo_val = bool(row[3]) if len(row) > 3 and row[3] is not None else True
        
        return Funcionario(
            id=id_val,
            matricula=matricula_val,
            nome=nome_val,
            ativo=ativo_val
        )
    
    def save(self) -> 'Funcionario':
        """Salva o funcionário no banco de dados"""
        if self.id:
            # Atualizar
            query = "UPDATE funcionarios SET matricula = ?, nome = ?, ativo = ? WHERE id = ?"
            params: Tuple[Any, ...] = (self.matricula, self.nome, self.ativo, self.id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING id para PostgreSQL
            query = "INSERT INTO funcionarios (matricula, nome, ativo) VALUES (?, ?, ?) RETURNING id"
            params = (self.matricula, self.nome, self.ativo)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.id = result
        return self
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['Funcionario']:
        """Busca um funcionário pelo ID"""
        query = "SELECT id, matricula, nome, ativo FROM funcionarios WHERE id = ?"
        row = DatabaseConnection.execute_query(query, (id,), fetch_one=True)
        if not row:
            return None
        
        # Garantindo que row é uma tupla antes de passar para from_row
        if isinstance(row, tuple):
            return Funcionario.from_row(row)
        return None
    
    @staticmethod
    def buscar_por_matricula(matricula: str) -> Optional['Funcionario']:
        """Busca um funcionário pela matrícula"""
        query = "SELECT id, matricula, nome, ativo FROM funcionarios WHERE matricula = ?"
        row = DatabaseConnection.execute_query(query, (matricula,), fetch_one=True)
        if not row:
            return None
        
        # Garantindo que row é uma tupla antes de passar para from_row
        if isinstance(row, tuple):
            return Funcionario.from_row(row)
        return None
    
    @staticmethod
    def listar_todos() -> List['Funcionario']:
        """Lista todos os funcionários"""
        query = "SELECT id, matricula, nome, ativo FROM funcionarios ORDER BY nome"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        
        # Filtrando apenas tuplas válidas
        valid_rows = [row for row in rows if isinstance(row, tuple)]
        return [Funcionario.from_row(row) for row in valid_rows]
    
    @staticmethod
    def listar_ativos() -> List['Funcionario']:
        """Lista apenas funcionários ativos"""
        query = "SELECT id, matricula, nome, ativo FROM funcionarios WHERE ativo = TRUE ORDER BY nome"
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        
        # Filtrando apenas tuplas válidas
        valid_rows = [row for row in rows if isinstance(row, tuple)]
        return [Funcionario.from_row(row) for row in valid_rows]
    
    def delete(self) -> None:
        """Remove o funcionário do banco de dados"""
        if not self.id:
            raise Exception("Funcionário não possui ID")
        query = "DELETE FROM funcionarios WHERE id = ?"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    @staticmethod
    def criar(matricula: str, nome: str, ativo: bool = True) -> 'Funcionario':
        """Método estático para criar um novo funcionário"""
        funcionario = Funcionario(matricula=matricula, nome=nome, ativo=ativo)
        return funcionario.save()