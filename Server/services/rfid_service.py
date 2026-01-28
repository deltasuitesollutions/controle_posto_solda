from typing import Dict, Any, Optional
from Server.models.funcionario import Funcionario


# Processa leitura RFID e registra entrada ou saída automaticamente
def processar_leitura_rfid(tag_id: str, posto: Optional[str] = None) -> Dict[str, Any]:
    from Server.models import PostoConfiguracao, ProducaoRegistro
    from Server.services import producao_service
    from Server.services import tags_temporarias_service
    
    # Primeiro verificar se é uma tag temporária
    funcionario_dict = tags_temporarias_service.buscar_funcionario_por_tag_temporaria(tag_id)
    
    if funcionario_dict:
        # É uma tag temporária, buscar o funcionário pelo ID
        funcionario = Funcionario.buscar_por_id(funcionario_dict.get('id') or funcionario_dict.get('funcionario_id'))
    else:
        # Buscar funcionário diretamente pela tag permanente
        funcionario = Funcionario.buscar_por_tag(tag_id)
    
    if not funcionario:
        raise Exception(f"Tag RFID '{tag_id}' não está associada a nenhum funcionário.")
    
    funcionario = _buscar_funcionario_valido(funcionario.matricula)
    
    if not posto:
        posto = _buscar_posto_funcionario(funcionario)
    
    produto = _buscar_produto_posto(posto)
    
    registro_aberto = ProducaoRegistro.buscar_registro_aberto(posto=posto, funcionario_matricula=funcionario.matricula)
    
    if registro_aberto:
        return _registrar_saida(registro_aberto, posto, funcionario, producao_service)
    else:
        return _registrar_entrada(posto, funcionario, produto, producao_service)


# Busca e valida funcionário
def _buscar_funcionario_valido(matricula: str):
    from Server.models.funcionario import Funcionario
    
    funcionario = Funcionario.buscar_por_matricula(matricula)
    if not funcionario:
        raise Exception(f"Funcionário com matrícula '{matricula}' não encontrado.")
    if not funcionario.ativo:
        raise Exception(f"Funcionário '{funcionario.nome}' está inativo.")
    return funcionario


# Busca posto configurado para o funcionário
def _buscar_posto_funcionario(funcionario) -> str:
    from Server.models import PostoConfiguracao
    
    config = PostoConfiguracao.buscar_posto_do_funcionario(funcionario.matricula)
    if not config:
        raise Exception(
            f"Não foi encontrada configuração válida para o funcionário {funcionario.nome} (matrícula: {funcionario.matricula}). "
            "Configure um posto com produto e operador na seção 'Configuração do Líder'."
        )
    return config.posto


# Busca produto configurado no posto
def _buscar_produto_posto(posto: str) -> str:
    from Server.models import PostoConfiguracao
    
    config = PostoConfiguracao.buscar_por_posto(posto)
    if not config or not config.modelo_codigo:
        raise Exception(
            f"Posto {posto} não possui produto configurado. "
            "Configure um produto para este posto na seção 'Configuração do Líder'."
        )
    return config.modelo_codigo


# Registra saída do funcionário
def _registrar_saida(registro, posto: str, funcionario, producao_service) -> Dict[str, Any]:
    resultado = producao_service.registrar_saida(
        registro_id=registro.id,
        posto=posto,
        funcionario_matricula=funcionario.matricula
    )
    
    return {
        "tipo": "saida",
        "message": f"Saída registrada para {funcionario.nome}",
        "funcionario": {"matricula": funcionario.matricula, "nome": funcionario.nome},
        "posto": posto,
        "registro_id": resultado.get("registro_id"),
        "hora_fim": resultado.get("hora_fim"),
        "duracao_minutos": resultado.get("duracao_minutos")
    }


# Registra entrada do funcionário
def _registrar_entrada(posto: str, funcionario, produto: str, producao_service) -> Dict[str, Any]:
    resultado = producao_service.registrar_entrada(
        posto=posto,
        funcionario_matricula=funcionario.matricula,
        modelo_codigo=produto
    )
    
    if not resultado or not resultado.get("registro_id"):
        raise Exception("Falha ao criar registro de entrada: registro_id não foi retornado")
    
    return {
        "tipo": "entrada",
        "message": f"Entrada registrada para {funcionario.nome}",
        "funcionario": {"matricula": funcionario.matricula, "nome": funcionario.nome},
        "posto": posto,
        "registro_id": resultado.get("registro_id"),
        "hora_inicio": resultado.get("hora_inicio"),
        "data": resultado.get("data"),
        "turno": resultado.get("turno"),
        "produto": resultado.get("produto")
    }
