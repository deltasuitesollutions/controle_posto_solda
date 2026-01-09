from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from Server.models.database import DatabaseConnection


class TagRFID:
    
    def __init__(self, tag_id: str, ativo: bool = True, 
                 funcionario_matricula: Optional[str] = None,
                 data_cadastro: Optional[str] = None, observacoes: str = '', id: Optional[int] = None):
        self.id = id
        self.tag_id = tag_id
        self.funcionario_matricula = funcionario_matricula
        self.ativo = ativo
        self.data_cadastro = data_cadastro or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.observacoes = observacoes
    
    # Converte para dicionário
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "tag_id": self.tag_id,
            "funcionario_matricula": self.funcionario_matricula,
            "ativo": self.ativo,
            "data_cadastro": self.data_cadastro,
            "observacoes": self.observacoes
        }
    
    # Cria objeto a partir de dicionário
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'TagRFID':
        return TagRFID(
            id=data.get('id'),
            tag_id=data.get('tag_id', ''),
            funcionario_matricula=data.get('funcionario_matricula'),
            ativo=data.get('ativo', True),
            data_cadastro=data.get('data_cadastro'),
            observacoes=data.get('observacoes', '')
        )
    
    # Cria objeto a partir de linha do banco
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'TagRFID':
        data_cadastro = row[4] if len(row) > 4 else None
        if isinstance(data_cadastro, datetime):
            data_cadastro = data_cadastro.strftime('%Y-%m-%d %H:%M:%S')
        elif data_cadastro and not isinstance(data_cadastro, str):
            data_cadastro = str(data_cadastro)
        
        return TagRFID(
            id=row[0] if len(row) > 0 else None,
            tag_id=str(row[1]) if len(row) > 1 and row[1] is not None else '',
            funcionario_matricula=str(row[2]) if len(row) > 2 and row[2] is not None else None,
            ativo=bool(row[3]) if len(row) > 3 and row[3] is not None else True,
            data_cadastro=data_cadastro,
            observacoes=str(row[5]) if len(row) > 5 and row[5] is not None else ''
        )
    
    # Busca por tag_id
    @staticmethod
    def buscar_por_tag_id(tag_id: str) -> Optional['TagRFID']:
        query = "SELECT id, tag_id, funcionario_matricula, ativo, data_cadastro, observacoes FROM tags_rfid WHERE tag_id = ?"
        row = DatabaseConnection.execute_query(query, (tag_id,), fetch_one=True)
        return TagRFID.from_row(row) if row else None