from typing import Dict, Any, Optional, List, Tuple, Union
from Server.models.database import DatabaseConnection


class Funcionario:
    """Modelo que representa um funcionário"""
    
    def __init__(self, matricula: str, nome: str, ativo: bool = True, tag_id: Optional[str] = None, turno: Optional[str] = None, funcionario_id: Optional[int] = None) -> None:
        self.funcionario_id: Optional[int] = funcionario_id
        self.matricula: str = matricula
        self.nome: str = nome
        self.ativo: bool = ativo
        self.tag_id: Optional[str] = tag_id
        self.turno: Optional[str] = turno
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        result = {
            "matricula": self.matricula,
            "nome": self.nome,
            "ativo": self.ativo
        }
        if self.funcionario_id is not None:
            result["id"] = self.funcionario_id  # Adiciona 'id' para compatibilidade com frontend
            result["funcionario_id"] = self.funcionario_id
        if self.tag_id:
            result["tag"] = self.tag_id  # Adiciona 'tag' para compatibilidade com frontend
            result["tag_id"] = self.tag_id
        if self.turno:
            result["turno"] = self.turno
        return result
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Funcionario':
        """Cria um objeto Funcionario a partir de um dicionário"""
        funcionario_id_val = data.get('funcionario_id')
        matricula_val = data.get('matricula', '')
        nome_val = data.get('nome', '')
        ativo_val = data.get('ativo', True)
        tag_id_val = data.get('tag_id')
        turno_val = data.get('turno')
        
        # Convertendo valores None para valores padrão
        if matricula_val is None:
            matricula_val = ''
        if nome_val is None:
            nome_val = ''
        
        return Funcionario(
            funcionario_id=funcionario_id_val,
            matricula=matricula_val,
            nome=nome_val,
            ativo=ativo_val,
            tag_id=tag_id_val,
            turno=turno_val
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'Funcionario':
        """Cria um objeto Funcionario a partir de uma linha do banco"""
        funcionario_id_val = int(row[0]) if len(row) > 0 and row[0] is not None else None
        tag_id_val = str(row[1]) if len(row) > 1 and row[1] is not None else None
        matricula_val = str(row[2]) if len(row) > 2 and row[2] is not None else ''
        nome_val = str(row[3]) if len(row) > 3 and row[3] is not None else ''
        ativo_val = bool(row[4]) if len(row) > 4 and row[4] is not None else True
        turno_val = str(row[5]) if len(row) > 5 and row[5] is not None else None
        
        return Funcionario(
            funcionario_id=funcionario_id_val,
            matricula=matricula_val,
            nome=nome_val,
            ativo=ativo_val,
            tag_id=tag_id_val,
            turno=turno_val
        )
    
    def save(self) -> 'Funcionario':
        """Salva o funcionário no banco de dados"""
        if self.funcionario_id:
            # Atualizar
            query = """
                UPDATE funcionarios 
                SET tag_id = ?, matricula = ?, nome = ?, ativo = ?, turno = ? 
                WHERE funcionario_id = ?
            """
            params: Tuple[Any, ...] = (self.tag_id, self.matricula, self.nome, self.ativo, self.turno, self.funcionario_id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING funcionario_id para PostgreSQL
            query = """
                INSERT INTO funcionarios (tag_id, matricula, nome, ativo, turno) 
                VALUES (?, ?, ?, ?, ?) 
                RETURNING funcionario_id
            """
            params = (self.tag_id, self.matricula, self.nome, self.ativo, self.turno)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.funcionario_id = result
        return self
    
    @staticmethod
    def buscar_por_id(funcionario_id: int) -> Optional['Funcionario']:
        """Busca um funcionário pelo ID"""
        query = """
            SELECT funcionario_id, tag_id, matricula, nome, ativo, turno 
            FROM funcionarios 
            WHERE funcionario_id = ?
        """
        row = DatabaseConnection.execute_query(query, (funcionario_id,), fetch_one=True)
        if not row:
            return None
        
        if isinstance(row, tuple):
            return Funcionario.from_row(row)
        return None
    
    @staticmethod
    def buscar_por_matricula(matricula: str) -> Optional['Funcionario']:
        """Busca um funcionário pela matrícula"""
        query = """
            SELECT funcionario_id, tag_id, matricula, nome, ativo, turno 
            FROM funcionarios 
            WHERE matricula = ?
        """
        row = DatabaseConnection.execute_query(query, (matricula,), fetch_one=True)
        if not row:
            return None
        
        if isinstance(row, tuple):
            return Funcionario.from_row(row)
        return None
    
    @staticmethod
    def buscar_por_tag(tag_id: str) -> Optional['Funcionario']:
        """Busca um funcionário pela tag RFID"""
        query = """
            SELECT funcionario_id, tag_id, matricula, nome, ativo, turno 
            FROM funcionarios 
            WHERE tag_id = ?
        """
        row = DatabaseConnection.execute_query(query, (tag_id,), fetch_one=True)
        if not row:
            return None
        
        if isinstance(row, tuple):
            return Funcionario.from_row(row)
        return None
    
    @staticmethod
    def listar_todos() -> List['Funcionario']:
        """Lista todos os funcionários"""
        query = """
            SELECT funcionario_id, tag_id, matricula, nome, ativo, turno 
            FROM funcionarios 
            ORDER BY nome
        """
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        
        valid_rows = [row for row in rows if isinstance(row, tuple)]
        return [Funcionario.from_row(row) for row in valid_rows]
    
    @staticmethod
    def listar_ativos() -> List['Funcionario']:
        """Lista apenas funcionários ativos"""
        query = """
            SELECT funcionario_id, tag_id, matricula, nome, ativo, turno 
            FROM funcionarios 
            WHERE ativo = TRUE 
            ORDER BY nome
        """
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        
        valid_rows = [row for row in rows if isinstance(row, tuple)]
        return [Funcionario.from_row(row) for row in valid_rows]
    
    def delete(self) -> None:
        """Remove o funcionário do banco de dados"""
        if not self.funcionario_id:
            raise Exception("Funcionário não possui ID")
        query = "DELETE FROM funcionarios WHERE funcionario_id = ?"
        DatabaseConnection.execute_query(query, (self.funcionario_id,))
        self.funcionario_id = None
    
    @staticmethod
    def criar(matricula: str, nome: str, ativo: bool = True, tag_id: Optional[str] = None, turno: Optional[str] = None) -> 'Funcionario':
        """Método estático para criar um novo funcionário"""
        funcionario = Funcionario(
            matricula=matricula, 
            nome=nome, 
            ativo=ativo, 
            tag_id=tag_id, 
            turno=turno
        )
        return funcionario.save()