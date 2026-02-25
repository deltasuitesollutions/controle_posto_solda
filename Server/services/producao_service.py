"""
Service para lógica de negócio de produção
"""
from typing import Dict, Any, Optional
from datetime import datetime
try:
    from zoneinfo import ZoneInfo
    TZ_MANAUS = ZoneInfo('America/Manaus')
except ImportError:
    # Fallback para Python < 3.9
    import pytz
    TZ_MANAUS = pytz.timezone('America/Manaus')
from Server.models import ProducaoRegistro
from Server.models.database import DatabaseConnection


def _agora_manaus() -> datetime:
    """Retorna a data/hora atual no fuso horário de Manaus"""
    return datetime.now(TZ_MANAUS)


def _buscar_operacao_id(operacao_codigo: str, posto: Optional[str] = None) -> Optional[int]:
    """Busca ID da operação pelo código/nome e opcionalmente pelo posto"""
    from Server.services import operacao_service
    operacoes = operacao_service.listar_operacoes()
    
    # Se temos o posto, buscar a operação específica desse posto
    if posto:
        operacao = next(
            (op for op in operacoes if 
             (op.get('id') == operacao_codigo or 
              str(op.get('id')) == operacao_codigo or
              op.get('operacao') == operacao_codigo) and
             op.get('posto') == posto),
            None
        )
        if operacao and operacao.get('id'):
            return int(operacao.get('id'))
    
    # Fallback: buscar sem filtro de posto
    operacao = next(
        (op for op in operacoes if op.get('id') == operacao_codigo or 
         str(op.get('id')) == operacao_codigo or
         op.get('operacao') == operacao_codigo),
        None
    )
    if operacao and operacao.get('id'):
        return int(operacao.get('id'))
    return None


def _buscar_peca_id(peca_identificador: str) -> Optional[int]:
    """Busca ID da peça pelo código ou nome"""
    from Server.models.peca import Peca
    pecas = Peca.listar_todas()
    # Tentar buscar primeiro pelo código
    peca = next((p for p in pecas if p.codigo == peca_identificador), None)
    # Se não encontrou, tentar buscar pelo nome
    if not peca:
        peca = next((p for p in pecas if p.nome == peca_identificador or p.nome.lower() == peca_identificador.lower()), None)
    return peca.id if peca else None


def _buscar_dispositivo_nome(operacao_codigo: str, posto: Optional[str] = None) -> Optional[str]:
    """Busca o nome do dispositivo Raspberry associado à operação"""
    from Server.services import operacao_service
    operacoes = operacao_service.listar_operacoes()
    
    # Buscar a operação correspondente
    if posto:
        operacao = next(
            (op for op in operacoes if 
             (op.get('id') == operacao_codigo or 
              str(op.get('id')) == operacao_codigo or
              op.get('operacao') == operacao_codigo) and
             op.get('posto') == posto),
            None
        )
    else:
        operacao = next(
            (op for op in operacoes if op.get('id') == operacao_codigo or 
             str(op.get('id')) == operacao_codigo or
             op.get('operacao') == operacao_codigo),
            None
        )
    
    if operacao:
        # Prioridade 1: Pegar o primeiro totem da lista de totens
        totens = operacao.get('totens', [])
        if totens and len(totens) > 0:
            # Retornar o primeiro totem que não seja um ID genérico
            for toten in totens:
                if toten and not toten.startswith('ID-'):
                    return toten
        
        # Prioridade 2: Usar hostname do dispositivo
        hostname = operacao.get('hostname')
        if hostname:
            return hostname
    
    return None


def _formatar_hora(hora: Optional[str]) -> str:
    """Formata hora removendo segundos se existirem"""
    if not hora:
        return 'N/A'
    hora_str = str(hora)
    if len(hora_str) >= 8 and hora_str.count(':') >= 2:
        return hora_str[:5]
    return hora_str


def verificar_registro_aberto(posto: str, funcionario_matricula: str, data_atual: str) -> bool:
    """Verifica se existe um registro em aberto"""
    return ProducaoRegistro.verificar_registro_aberto(posto, funcionario_matricula, data_atual)


def registrar_entrada(
    posto: str, 
    funcionario_matricula: Optional[str] = None, 
    produto: Optional[str] = None, 
    modelo_codigo: Optional[str] = None,
    operacao: Optional[str] = None,
    peca: Optional[str] = None,
    codigo: Optional[str] = None,
    quantidade: Optional[int] = None
) -> Dict[str, Any]:
    """Registra a entrada de um funcionário em um posto"""
    agora = _agora_manaus()
    data_atual = agora.strftime('%Y-%m-%d')
    hora_atual = agora.strftime('%H:%M')
    
    produto = produto or modelo_codigo
    
    # Buscar configuração do posto se necessário
    config = None
    try:
        if DatabaseConnection.table_exists('posto_configuracao'):
            from Server.models import PostoConfiguracao
            config = PostoConfiguracao.buscar_por_posto(posto)
    except Exception:
        pass
    
    funcionario_matricula = funcionario_matricula or (config.funcionario_matricula if config else None)
    if not funcionario_matricula:
        raise Exception("Funcionário não informado e não há configuração para este posto")
    
    produto = produto or (config.modelo_codigo if config else None)
    if not produto:
        raise Exception("Produto não informado e não há configuração para este posto")
    
    # Verificar se já existe registro aberto
    registro_aberto = ProducaoRegistro.buscar_registro_aberto(
        posto=posto,
        funcionario_matricula=funcionario_matricula
    )
    if registro_aberto and not registro_aberto.fim:
        raise Exception(f"Já existe um registro em aberto para este operador neste posto (ID: {registro_aberto.registro_id})")
    
    # Buscar IDs opcionais
    operacao_id = _buscar_operacao_id(operacao, posto) if operacao else None
    peca_id = _buscar_peca_id(peca) if peca else None
    
    # Buscar nome do dispositivo Raspberry associado à operação
    dispositivo_nome = _buscar_dispositivo_nome(operacao, posto) if operacao else None
    
    # Criar registro
    registro = ProducaoRegistro.criar(
        posto=posto,
        funcionario_matricula=funcionario_matricula,
        produto=produto,
        data=data_atual,
        hora_inicio=hora_atual,
        operacao_id=operacao_id,
        peca_id=peca_id,
        codigo_producao=codigo,
        quantidade=quantidade,
        dispositivo_nome=dispositivo_nome
    )
    
    return {
        "registro_id": registro.registro_id,
        "hora_inicio": hora_atual,
        "data": data_atual,
        "funcionario_matricula": funcionario_matricula,
        "produto": produto,
        "operacao_id": operacao_id,
        "peca_id": peca_id,
        "quantidade": quantidade
    }


def buscar_registro_aberto(
    posto: Optional[str] = None, 
    funcionario_matricula: Optional[str] = None, 
    registro_id: Optional[int] = None
) -> Dict[str, Any]:
    """Busca um registro em aberto"""
    registro = ProducaoRegistro.buscar_registro_aberto(
        posto=posto,
        funcionario_matricula=funcionario_matricula,
        registro_id=registro_id
    )
    
    if not registro:
        raise Exception(
            f"Nenhum registro em aberto encontrado. "
            f"Verifique se existe um registro de entrada para {funcionario_matricula or 'o funcionário'} no posto {posto or 'o posto'}."
        )
    
    from Server.models.posto import Posto
    from Server.models.funcionario import Funcionario
    
    posto_obj = Posto.buscar_por_id(registro.posto_id)
    funcionario = next((f for f in Funcionario.listar_todos() if f.funcionario_id == registro.funcionario_id), None)
    
    return {
        "id": registro.registro_id,
        "posto": posto_obj.nome if posto_obj else '',
        "funcionario_matricula": funcionario.matricula if funcionario else '',
        "data": registro.data_inicio or '',
        "hora_inicio": registro.hora_inicio or registro.inicio or ''
    }


def calcular_duracao(hora_inicio_str: str, hora_fim_str: str) -> int:
    """Calcula a duração entre duas horas em minutos"""
    try:
        inicio_parts = hora_inicio_str.split(':')
        fim_parts = hora_fim_str.split(':')
        inicio_minutos = int(inicio_parts[0]) * 60 + int(inicio_parts[1])
        fim_minutos = int(fim_parts[0]) * 60 + int(fim_parts[1])
        duracao = fim_minutos - inicio_minutos
        if duracao < 0:
            duracao += 24 * 60
        return duracao
    except:
        return 0


def registrar_saida(
    registro_id: Optional[int] = None, 
    posto: Optional[str] = None, 
    funcionario_matricula: Optional[str] = None,
    quantidade: Optional[int] = None
) -> Dict[str, Any]:
    """Registra a saída de um funcionário de um posto"""
    registro_obj = ProducaoRegistro.buscar_registro_aberto(
        posto=posto,
        funcionario_matricula=funcionario_matricula,
        registro_id=registro_id
    )
    
    if not registro_obj:
        raise Exception(
            f"Nenhum registro em aberto encontrado. "
            f"Verifique se existe um registro de entrada para {funcionario_matricula or 'o funcionário'} no posto {posto or 'o posto'}."
        )
    
    if registro_obj.fim:
        raise Exception(f"Registro {registro_obj.registro_id} já está fechado")
    
    hora_atual = _agora_manaus().strftime('%H:%M')
    hora_inicio = registro_obj.inicio or registro_obj.hora_inicio or '00:00'
    duracao = calcular_duracao(hora_inicio, hora_atual)
    
    if quantidade is not None:
        registro_obj.quantidade = quantidade
    
    registro_obj.fim = hora_atual
    registro_obj.save()
    
    return {
        "registro_id": registro_obj.registro_id,
        "hora_fim": hora_atual,
        "duracao_minutos": duracao,
        "quantidade": registro_obj.quantidade
    }


def listar_registros(
    limit: int = 100, 
    offset: int = 0, 
    data: Optional[str] = None, 
    posto: Optional[str] = None, 
    operacao: Optional[str] = None
) -> Dict[str, Any]:
    """Lista registros de produção com formatação"""
    operacao_id = _buscar_operacao_id(operacao, posto) if operacao else None
    
    registros = ProducaoRegistro.listar(limit=limit, offset=offset, data=data, posto=posto, operacao_id=operacao_id)
    total = ProducaoRegistro.contar(data=data, posto=posto, operacao_id=operacao_id)
    
    meses_pt = {
        1: 'janeiro', 2: 'fevereiro', 3: 'março', 4: 'abril',
        5: 'maio', 6: 'junho', 7: 'julho', 8: 'agosto',
        9: 'setembro', 10: 'outubro', 11: 'novembro', 12: 'dezembro'
    }
    
    registros_formatados = []
    for registro in registros:
        from Server.models import Funcionario, Modelo, Posto
        from Server.models.operacao import Operacao
        
        funcionario = next((f for f in Funcionario.listar_todos() if f.funcionario_id == registro.funcionario_id), None)
        modelo = Modelo.buscar_por_id(registro.modelo_id)
        posto_obj = Posto.buscar_por_id(registro.posto_id)
        
        operacao_info = None
        if registro.operacao_id:
            operacao_obj = Operacao.buscar_por_id(registro.operacao_id)
            if operacao_obj:
                operacao_info = {
                    "id": operacao_obj.operacao_id,
                    "codigo": operacao_obj.codigo_operacao,
                    "nome": operacao_obj.nome or operacao_obj.codigo_operacao
                }
        
        hora_inicio = _formatar_hora(registro.hora_inicio or registro.inicio)
        hora_fim = _formatar_hora(registro.fim) if registro.fim else None
        
        data_formatada = ''
        if registro.data_inicio:
            try:
                if isinstance(registro.data_inicio, str):
                    data_obj = datetime.strptime(registro.data_inicio, '%Y-%m-%d')
                else:
                    data_obj = registro.data_inicio
                data_formatada = f"{data_obj.day} de {meses_pt[data_obj.month]}"
            except:
                pass
        
        periodo = f"{hora_inicio} às {hora_fim}" if hora_fim else hora_inicio
        texto_periodo = f"de {hora_inicio} às {hora_fim}" if hora_fim else f"de {hora_inicio} (em andamento)"
        
        registro_formatado = {
            "id": registro.registro_id,
            "periodo": periodo,
            "texto_registro": f"{texto_periodo}, do dia {data_formatada}, o {funcionario.nome if funcionario else 'N/A'}, matrícula {funcionario.matricula if funcionario else 'N/A'}, produziu o {modelo.descricao if modelo else 'N/A'}.",
            "hora_inicio": hora_inicio,
            "hora_fim": hora_fim,
            "data": data_formatada,
            "data_raw": str(registro.data_inicio) if registro.data_inicio else None,
            "funcionario": {
                "nome": funcionario.nome if funcionario else 'N/A',
                "matricula": funcionario.matricula if funcionario else 'N/A'
            },
            "modelo": {
                "codigo": modelo.codigo if modelo else 'N/A',
                "descricao": modelo.descricao if modelo else 'N/A'
            },
            "posto": posto_obj.nome if posto_obj else 'N/A'
        }
        
        if operacao_info:
            registro_formatado["operacao"] = operacao_info
        
        if registro.peca_id:
            from Server.models.peca import Peca
            peca = Peca.buscar_por_id(registro.peca_id)
            if peca:
                registro_formatado["peca"] = {
                    "id": peca.id,
                    "codigo": peca.codigo,
                    "nome": peca.nome
                }
        
        if registro.codigo_producao:
            registro_formatado["codigo_producao"] = registro.codigo_producao
        
        if registro.quantidade is not None:
            registro_formatado["quantidade"] = registro.quantidade
        
        registros_formatados.append(registro_formatado)
    
    return {
        "registros": registros_formatados,
        "total": total,
        "limit": limit,
        "offset": offset
    }
