from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from Server.models.database import DatabaseConnection
try:
    from zoneinfo import ZoneInfo
    TZ_MANAUS = ZoneInfo('America/Manaus')
except ImportError:
    import pytz
    TZ_MANAUS = pytz.timezone('America/Manaus')


def _agora_manaus() -> datetime:
    """Retorna a data/hora atual no fuso horário de Manaus"""
    return datetime.now(TZ_MANAUS)


class TagTemporaria:
    """Modelo que representa uma tag RFID temporária"""
    
    def __init__(
        self, 
        tag_id: str, 
        funcionario_id: int,
        data_criacao: Optional[datetime] = None,
        data_expiracao: Optional[datetime] = None,
        ativo: bool = True,
        id: Optional[int] = None
    ):
        self.id = id
        self.tag_id = tag_id
        self.funcionario_id = funcionario_id
        
        # Se não fornecida, usar data atual
        if data_criacao is None:
            data_criacao = _agora_manaus()
        self.data_criacao = data_criacao
        
        # Se não fornecida, calcular 10 horas após criação
        if data_expiracao is None:
            data_expiracao = data_criacao + timedelta(hours=10)
        self.data_expiracao = data_expiracao
        
        self.ativo = ativo
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "id": self.id,
            "tag_id": self.tag_id,
            "funcionario_id": self.funcionario_id,
            "data_criacao": self.data_criacao.isoformat() if isinstance(self.data_criacao, datetime) else str(self.data_criacao),
            "data_expiracao": self.data_expiracao.isoformat() if isinstance(self.data_expiracao, datetime) else str(self.data_expiracao),
            "ativo": self.ativo
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'TagTemporaria':
        """Cria um objeto TagTemporaria a partir de um dicionário"""
        data_criacao = data.get('data_criacao')
        if isinstance(data_criacao, str):
            data_criacao = datetime.fromisoformat(data_criacao.replace('Z', '+00:00'))
        
        data_expiracao = data.get('data_expiracao')
        if isinstance(data_expiracao, str):
            data_expiracao = datetime.fromisoformat(data_expiracao.replace('Z', '+00:00'))
        
        return TagTemporaria(
            id=data.get('id'),
            tag_id=data.get('tag_id', ''),
            funcionario_id=data.get('funcionario_id', 0),
            data_criacao=data_criacao,
            data_expiracao=data_expiracao,
            ativo=data.get('ativo', True)
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'TagTemporaria':
        """Cria um objeto TagTemporaria a partir de uma linha do banco"""
        id_val = row[0] if len(row) > 0 and row[0] is not None else None
        tag_id_val = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        funcionario_id_val = int(row[2]) if len(row) > 2 and row[2] is not None else 0
        
        data_criacao_val = row[3] if len(row) > 3 and row[3] is not None else None
        if isinstance(data_criacao_val, datetime):
            pass  # Já é datetime
        elif isinstance(data_criacao_val, str):
            try:
                data_criacao_val = datetime.fromisoformat(data_criacao_val.replace('Z', '+00:00'))
            except:
                data_criacao_val = _agora_manaus()
        else:
            data_criacao_val = _agora_manaus()
        
        data_expiracao_val = row[4] if len(row) > 4 and row[4] is not None else None
        if isinstance(data_expiracao_val, datetime):
            pass  # Já é datetime
        elif isinstance(data_expiracao_val, str):
            try:
                data_expiracao_val = datetime.fromisoformat(data_expiracao_val.replace('Z', '+00:00'))
            except:
                data_expiracao_val = _agora_manaus() + timedelta(hours=10)
        else:
            data_expiracao_val = _agora_manaus() + timedelta(hours=10)
        
        ativo_val = bool(row[5]) if len(row) > 5 and row[5] is not None else True
        
        return TagTemporaria(
            id=id_val,
            tag_id=tag_id_val,
            funcionario_id=funcionario_id_val,
            data_criacao=data_criacao_val,
            data_expiracao=data_expiracao_val,
            ativo=ativo_val
        )
    
    def save(self) -> 'TagTemporaria':
        """Salva a tag temporária no banco de dados"""
        if self.id:
            # Atualizar
            query = """
                UPDATE tags_temporarias 
                SET tag_id = %s, funcionario_id = %s, data_criacao = %s, 
                    data_expiracao = %s, ativo = %s 
                WHERE id = %s
            """
            params = (
                self.tag_id, 
                self.funcionario_id, 
                self.data_criacao,
                self.data_expiracao,
                self.ativo,
                self.id
            )
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir
            query = """
                INSERT INTO tags_temporarias (tag_id, funcionario_id, data_criacao, data_expiracao, ativo) 
                VALUES (%s, %s, %s, %s, %s) 
                RETURNING id
            """
            params = (
                self.tag_id, 
                self.funcionario_id, 
                self.data_criacao,
                self.data_expiracao,
                self.ativo
            )
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.id = result
        
        return self
    
    @staticmethod
    def buscar_por_tag_id(tag_id: str) -> Optional['TagTemporaria']:
        """Busca uma tag temporária pelo tag_id"""
        query = """
            SELECT id, tag_id, funcionario_id, data_criacao, data_expiracao, ativo 
            FROM tags_temporarias 
            WHERE tag_id = %s AND ativo = TRUE
        """
        row = DatabaseConnection.execute_query(query, (tag_id,), fetch_one=True)
        if not row:
            return None
        
        tag = TagTemporaria.from_row(row)
        # Verificar se não expirou
        if tag.data_expiracao < _agora_manaus():
            return None
        
        return tag
    
    @staticmethod
    def buscar_por_funcionario_id(funcionario_id: int) -> List['TagTemporaria']:
        """Busca todas as tags temporárias ativas de um funcionário"""
        query = """
            SELECT id, tag_id, funcionario_id, data_criacao, data_expiracao, ativo 
            FROM tags_temporarias 
            WHERE funcionario_id = %s AND ativo = TRUE
            ORDER BY data_criacao DESC
        """
        rows = DatabaseConnection.execute_query(query, (funcionario_id,), fetch_all=True)
        if not rows:
            return []
        
        tags = [TagTemporaria.from_row(row) for row in rows]
        # Filtrar tags expiradas
        agora = _agora_manaus()
        tags_validas = [tag for tag in tags if tag.data_expiracao >= agora]
        
        return tags_validas
    
    @staticmethod
    def excluir_expiradas() -> int:
        """Marca como inativas todas as tags temporárias expiradas"""
        query = """
            UPDATE tags_temporarias 
            SET ativo = FALSE 
            WHERE data_expiracao < CURRENT_TIMESTAMP AND ativo = TRUE
        """
        DatabaseConnection.execute_query(query)
        return 0  # Retornamos 0 pois não temos como contar facilmente
    
    def delete(self) -> None:
        """Remove a tag temporária do banco de dados"""
        if not self.id:
            raise Exception("Tag temporária não possui ID")
        query = "DELETE FROM tags_temporarias WHERE id = %s"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    @staticmethod
    def criar(tag_id: str, funcionario_id: int, horas_duracao: int = 10) -> 'TagTemporaria':
        """Método estático para criar uma nova tag temporária"""
        agora = _agora_manaus()
        expiracao = agora + timedelta(hours=horas_duracao)
        
        tag = TagTemporaria(
            tag_id=tag_id,
            funcionario_id=funcionario_id,
            data_criacao=agora,
            data_expiracao=expiracao,
            ativo=True
        )
        return tag.save()

