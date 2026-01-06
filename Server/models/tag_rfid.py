"""
Modelo para a entidade TagRFID
"""
from typing import Dict, Any, Optional, List, Tuple
from backend.models.database import DatabaseConnection
from datetime import datetime


class TagRFID:
    """Modelo que representa uma tag RFID"""
    
    def __init__(
        self, 
        tag_id: str, 
        funcionario_matricula: Optional[str] = None, 
        ativo: bool = True, 
        data_cadastro: Optional[str] = None, 
        observacoes: str = '', 
        id: Optional[int] = None
    ) -> None:
        self.id: Optional[int] = id
        self.tag_id: str = tag_id
        self.funcionario_matricula: Optional[str] = funcionario_matricula
        self.ativo: bool = ativo
        self.data_cadastro: str = data_cadastro or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.observacoes: str = observacoes
    
    def to_dict(self, include_funcionario_nome: bool = False) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        result: Dict[str, Any] = {
            "id": self.id,
            "tag_id": self.tag_id,
            "funcionario_matricula": self.funcionario_matricula,
            "ativo": self.ativo,
            "data_cadastro": self.data_cadastro,
            "observacoes": self.observacoes
        }
        
        if include_funcionario_nome and self.funcionario_matricula:
            from backend.models.funcionario import Funcionario
            funcionario = Funcionario.buscar_por_matricula(self.funcionario_matricula)
            result["funcionario_nome"] = funcionario.nome if funcionario else None
        
        return result
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'TagRFID':
        """Cria um objeto TagRFID a partir de um dicionário"""
        tag_id_val = data.get('tag_id')
        if tag_id_val is None:
            tag_id_val = ''
        return TagRFID(
            id=data.get('id'),
            tag_id=tag_id_val,
            funcionario_matricula=data.get('funcionario_matricula'),
            ativo=data.get('ativo', True),
            data_cadastro=data.get('data_cadastro'),
            observacoes=data.get('observacoes', '')
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'TagRFID':
        """Cria um objeto TagRFID a partir de uma linha do banco"""
        from datetime import datetime
        
        # Converter data_cadastro (pode ser datetime object do PostgreSQL)
        data_cadastro = row[4] if len(row) > 4 else None
        if isinstance(data_cadastro, datetime):
            data_cadastro = data_cadastro.strftime('%Y-%m-%d %H:%M:%S')
        elif data_cadastro and not isinstance(data_cadastro, str):
            data_cadastro = str(data_cadastro)
        
        tag_id_val = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        funcionario_matricula_val = str(row[2]) if len(row) > 2 and row[2] is not None else None
        observacoes_val = str(row[5]) if len(row) > 5 and row[5] is not None else ''
        
        return TagRFID(
            id=row[0] if len(row) > 0 else None,
            tag_id=tag_id_val,
            funcionario_matricula=funcionario_matricula_val,
            ativo=bool(row[3]) if len(row) > 3 and row[3] is not None else True,
            data_cadastro=data_cadastro,
            observacoes=observacoes_val
        )
    
    def save(self) -> 'TagRFID':
        """Salva a tag RFID no banco de dados"""
        if self.id:
            # Atualizar
            query = """UPDATE tags_rfid 
                       SET tag_id = ?, funcionario_matricula = ?, ativo = ?, 
                           observacoes = ? 
                       WHERE id = ?"""
            params: Tuple[Any, ...] = (self.tag_id, self.funcionario_matricula, self.ativo, 
                     self.observacoes, self.id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING id para PostgreSQL
            query = """INSERT INTO tags_rfid 
                       (tag_id, funcionario_matricula, ativo, observacoes) 
                       VALUES (?, ?, ?, ?) RETURNING id"""
            params = (self.tag_id, self.funcionario_matricula, self.ativo, 
                     self.observacoes)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.id = result
        return self
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['TagRFID']:
        """Busca uma tag pelo ID"""
        query = "SELECT id, tag_id, funcionario_matricula, ativo, data_cadastro, observacoes FROM tags_rfid WHERE id = ?"
        row = DatabaseConnection.execute_query(query, (id,), fetch_one=True)
        if not row:
            return None
        return TagRFID.from_row(row)
    
    @staticmethod
    def buscar_por_tag_id(tag_id: str) -> Optional['TagRFID']:
        """Busca uma tag pelo tag_id"""
        query = "SELECT id, tag_id, funcionario_matricula, ativo, data_cadastro, observacoes FROM tags_rfid WHERE tag_id = ?"
        row = DatabaseConnection.execute_query(query, (tag_id,), fetch_one=True)
        if not row:
            return None
        return TagRFID.from_row(row)
    
    @staticmethod
    def listar_todas() -> List['TagRFID']:
        """Lista todas as tags RFID"""
        query = """SELECT id, tag_id, funcionario_matricula, ativo, data_cadastro, observacoes 
                   FROM tags_rfid 
                   ORDER BY data_cadastro DESC"""
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [TagRFID.from_row(row) for row in rows]
    
    @staticmethod
    def listar_ativas() -> List['TagRFID']:
        """Lista apenas tags ativas"""
        query = """SELECT id, tag_id, funcionario_matricula, ativo, data_cadastro, observacoes 
                   FROM tags_rfid 
                   WHERE ativo = TRUE 
                   ORDER BY data_cadastro DESC"""
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [TagRFID.from_row(row) for row in rows]
    
    def delete(self) -> None:
        """Remove a tag RFID do banco de dados"""
        if not self.id:
            raise Exception("Tag RFID não possui ID")
        query = "DELETE FROM tags_rfid WHERE id = ?"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    @staticmethod
    def criar(
        tag_id: str, 
        funcionario_matricula: Optional[str] = None, 
        ativo: bool = True, 
        observacoes: str = ''
    ) -> 'TagRFID':
        """Método estático para criar uma nova tag RFID"""
        tag = TagRFID(tag_id=tag_id, funcionario_matricula=funcionario_matricula, 
                     ativo=ativo, observacoes=observacoes)
        return tag.save()

