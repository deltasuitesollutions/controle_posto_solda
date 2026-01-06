"""
Service para lógica de negócio de configuração de postos
"""
from typing import Dict, Any, Optional, List
from backend.models import PostoConfiguracao


def obter_configuracao_posto(posto: str) -> Optional[Dict[str, Any]]:
    """Obtém a configuração de um posto específico"""
    try:
        config = PostoConfiguracao.buscar_por_posto(posto)
        if not config:
            return None
        return config.to_dict(include_relations=True)
    except Exception as e:
        raise Exception(f"Erro ao obter configuração do posto: {str(e)}")


def listar_configuracoes() -> List[Dict[str, Any]]:
    """Lista todas as configurações de postos"""
    try:
        configuracoes = PostoConfiguracao.listar_todas()
        return [config.to_dict(include_relations=True) for config in configuracoes]
    except Exception as e:
        raise Exception(f"Erro ao listar configurações: {str(e)}")


def configurar_posto(
    posto: str, 
    funcionario_matricula: Optional[str] = None, 
    modelo_codigo: Optional[str] = None,
    turno: Optional[int] = None
) -> Dict[str, Any]:
    """Configura ou atualiza a configuração de um posto"""
    try:
        if not posto:
            raise Exception("Código do posto é obrigatório")
        
        config = PostoConfiguracao.criar(
            posto=posto,
            funcionario_matricula=funcionario_matricula,
            modelo_codigo=modelo_codigo,
            turno=turno
        )
        
        return {
            "id": config.id,
            "posto": config.posto,
            "funcionario_matricula": config.funcionario_matricula,
            "modelo_codigo": config.modelo_codigo,
            "turno": config.turno,
            "message": "Configuração do posto atualizada com sucesso"
        }
    except Exception as e:
        raise Exception(f"Erro ao configurar posto: {str(e)}")


def remover_configuracao_posto(posto: str) -> Dict[str, Any]:
    """Remove a configuração de um posto"""
    try:
        config = PostoConfiguracao.buscar_por_posto(posto)
        if not config:
            raise Exception("Configuração não encontrada para este posto")
        
        config.delete()
        return {"message": "Configuração removida com sucesso"}
    except Exception as e:
        raise Exception(f"Erro ao remover configuração: {str(e)}")


