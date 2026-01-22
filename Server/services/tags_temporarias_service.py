from typing import Dict, Any, Optional, List
from Server.models.tag_temporaria import TagTemporaria
from Server.models.funcionario import Funcionario
from datetime import datetime, timedelta


def criar_tag_temporaria(funcionario_id: int, tag_id: str, horas_duracao: int = 10) -> Dict[str, Any]:
    """
    Cria uma nova tag temporária para um funcionário
    
    Args:
        funcionario_id: ID do funcionário
        tag_id: Código da tag RFID temporária
        horas_duracao: Duração em horas (padrão: 10)
    
    Returns:
        Dicionário com os dados da tag temporária criada
    """
    # Verificar se o funcionário existe
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    # Verificar se a tag já está em uso (permanente ou temporária)
    # Primeiro verificar tag permanente
    funcionario_com_tag = Funcionario.buscar_por_tag(tag_id)
    if funcionario_com_tag:
        raise Exception(f"Tag RFID '{tag_id}' já está em uso pelo funcionário {funcionario_com_tag.nome}")
    
    # Verificar se já existe tag temporária ativa com esse código
    tag_temporaria_existente = TagTemporaria.buscar_por_tag_id(tag_id)
    if tag_temporaria_existente:
        raise Exception(f"Tag RFID temporária '{tag_id}' já está em uso")
    
    # Criar a tag temporária
    tag = TagTemporaria.criar(tag_id=tag_id, funcionario_id=funcionario_id, horas_duracao=horas_duracao)
    
    return tag.to_dict()


def listar_tags_temporarias_funcionario(funcionario_id: int) -> List[Dict[str, Any]]:
    """
    Lista todas as tags temporárias ativas de um funcionário
    
    Args:
        funcionario_id: ID do funcionário
    
    Returns:
        Lista de dicionários com os dados das tags temporárias
    """
    tags = TagTemporaria.buscar_por_funcionario_id(funcionario_id)
    return [tag.to_dict() for tag in tags]


def buscar_funcionario_por_tag_temporaria(tag_id: str) -> Optional[Dict[str, Any]]:
    """
    Busca um funcionário pela tag temporária
    
    Args:
        tag_id: Código da tag RFID temporária
    
    Returns:
        Dicionário com os dados do funcionário ou None se não encontrado
    """
    # Limpar tags expiradas antes de buscar
    limpar_tags_expiradas_automaticamente()
    
    tag = TagTemporaria.buscar_por_tag_id(tag_id)
    if not tag:
        return None
    
    funcionario = Funcionario.buscar_por_id(tag.funcionario_id)
    if not funcionario:
        return None
    
    return funcionario.to_dict()


def excluir_tag_temporaria(tag_id: str) -> None:
    """
    Exclui uma tag temporária
    
    Args:
        tag_id: Código da tag RFID temporária
    """
    tag = TagTemporaria.buscar_por_tag_id(tag_id)
    if not tag:
        raise Exception(f"Tag temporária '{tag_id}' não encontrada")
    
    tag.delete()


def limpar_tags_expiradas() -> int:
    """
    Remove todas as tags temporárias expiradas
    
    Returns:
        Número de tags removidas
    """
    # Marcar tags expiradas como inativas
    TagTemporaria.excluir_expiradas()
    
    # Também excluir fisicamente tags muito antigas (mais de 24 horas expiradas)
    from datetime import datetime, timedelta
    from Server.models.database import DatabaseConnection
    
    limite_exclusao = datetime.now() - timedelta(hours=24)
    query = """
        DELETE FROM tags_temporarias 
        WHERE data_expiracao < %s
    """
    DatabaseConnection.execute_query(query, (limite_exclusao,))
    
    return 0  # Não temos contagem direta, mas a função foi executada


def limpar_tags_expiradas_automaticamente() -> None:
    """
    Função para ser chamada automaticamente para limpar tags expiradas.
    Esta função é chamada sempre que uma tag temporária é buscada.
    """
    try:
        limpar_tags_expiradas()
    except Exception as e:
        # Não falhar se houver erro na limpeza automática
        print(f"Erro ao limpar tags expiradas automaticamente: {e}")

