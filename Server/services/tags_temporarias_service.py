from typing import Dict, Any, Optional, List
from Server.models.tag_temporaria import TagTemporaria
from Server.models.funcionario import Funcionario
from datetime import datetime, timedelta
try:
    from zoneinfo import ZoneInfo
    TZ_MANAUS = ZoneInfo('America/Manaus')
except ImportError:
    import pytz
    TZ_MANAUS = pytz.timezone('America/Manaus')


def criar_tag_temporaria(funcionario_id: int, tag_id: str, horas_duracao: int = 10) -> Dict[str, Any]:
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    funcionario_com_tag = Funcionario.buscar_por_tag(tag_id)
    if funcionario_com_tag:
        raise Exception(f"Tag RFID '{tag_id}' já está em uso pelo funcionário {funcionario_com_tag.nome}")
    
    tag_temporaria_existente = TagTemporaria.buscar_por_tag_id(tag_id)
    if tag_temporaria_existente:
        raise Exception(f"Tag RFID temporária '{tag_id}' já está em uso")
    
    tag = TagTemporaria.criar(tag_id=tag_id, funcionario_id=funcionario_id, horas_duracao=horas_duracao)
    return tag.to_dict()


def listar_tags_temporarias_funcionario(funcionario_id: int) -> List[Dict[str, Any]]:
    tags = TagTemporaria.buscar_por_funcionario_id(funcionario_id)
    return [tag.to_dict() for tag in tags]

def buscar_funcionario_por_tag_temporaria(tag_id: str) -> Optional[Dict[str, Any]]:
    limpar_tags_expiradas_automaticamente()
    
    tag = TagTemporaria.buscar_por_tag_id(tag_id)
    if not tag:
        return None
    
    funcionario = Funcionario.buscar_por_id(tag.funcionario_id)
    if not funcionario:
        return None
    
    return funcionario.to_dict()


def excluir_tag_temporaria(tag_id: str) -> None:
    tag = TagTemporaria.buscar_por_tag_id(tag_id)
    if not tag:
        raise Exception(f"Tag temporária '{tag_id}' não encontrada")
    
    tag.delete()


def limpar_tags_expiradas() -> int:
    TagTemporaria.excluir_expiradas()
    
    # Também excluir fisicamente tags muito antigas (mais de 24 horas expiradas)
    from Server.models.database import DatabaseConnection
    
    limite_exclusao = datetime.now(TZ_MANAUS) - timedelta(hours=24)
    query = """
        DELETE FROM tags_temporarias 
        WHERE data_expiracao < %s
    """
    DatabaseConnection.execute_query(query, (limite_exclusao,)) 
    return 0 


def limpar_tags_expiradas_automaticamente() -> None:
    try:
        limpar_tags_expiradas()
    except Exception as e:
        print(f"Erro ao limpar tags expiradas automaticamente: {e}")

