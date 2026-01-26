from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from Server.models.registros import RegistroProducao
from Server.models import Funcionario, Modelo, Posto
from Server.models.operacao import Operacao
from Server.models.produto import Produto
from Server.models.peca import Peca
from Server.services import dispositivo_raspberry_service


def _buscar_info_dispositivo_por_toten(toten_id: int) -> Dict[str, Any]:
    """
    Busca informações do dispositivo Raspberry baseado no toten_id
    Retorna dict com serial, hostname e dispositivo_id ou valores vazios
    """
    try:
        dispositivos = dispositivo_raspberry_service.listar_dispositivos()
        if dispositivos and len(dispositivos) > 0:
            # Associar sequencialmente: dispositivo 0 -> toten 1, dispositivo 1 -> toten 2, etc.
            toten_index = toten_id - 1 if toten_id > 0 else 0
            if toten_index < len(dispositivos):
                dispositivo = dispositivos[toten_index]
                return {
                    'serial': dispositivo.get('serial', ''),
                    'hostname': dispositivo.get('hostname', ''),
                    'dispositivo_id': dispositivo.get('id')
                }
    except Exception as e:
        print(f'Erro ao buscar dispositivo por toten: {e}')
    
    return {
        'serial': '',
        'hostname': '',
        'dispositivo_id': None
    }


def _formatar_hora(hora: Optional[str]) -> Optional[str]:
    if not hora:
        return None
    hora_str = str(hora)
    
    
    if ' ' in hora_str:
        partes = hora_str.split(' ')
        if len(partes) >= 2:
            hora_part = partes[1]  
            if hora_part.count(':') >= 2:
                return hora_part[:5] 
            return hora_part
    
    
    if len(hora_str) >= 8 and hora_str.count(':') >= 2:
        return hora_str[:5]
    
    return hora_str


def _formatar_data(data: Optional[str]) -> Optional[str]:
    if not data:
        return None
    if isinstance(data, str):
        
        if len(data) == 10 and data.count('-') == 2:
            return data
        try:
            date_obj = datetime.strptime(data, '%Y-%m-%d')
            return date_obj.strftime('%Y-%m-%d')
        except:
            pass
    return str(data)


def _extrair_data_de_timestamp(timestamp: Optional[str]) -> Optional[str]:
    if not timestamp:
        return None
    try:
        if ' ' in str(timestamp):
            return str(timestamp).split(' ')[0]
        return _formatar_data(str(timestamp))
    except:
        return None


def _construir_filtros(
    posto: Optional[str] = None,
    operacao: Optional[str] = None,
    data: Optional[str] = None,
    turno: Optional[List[str]] = None,
    hora_inicio: Optional[str] = None,
    hora_fim: Optional[str] = None
) -> Tuple[str, List[Any]]:
    where_conditions = ["r.fim IS NOT NULL"]
    params = []
    
    posto_id_filtro = None
    if posto:
        postos = Posto.listar_todos()
        posto_obj = next((p for p in postos if p.nome == posto), None)
        if posto_obj:
            posto_id_filtro = posto_obj.posto_id
            where_conditions.append("r.posto_id = %s")
            params.append(posto_id_filtro)
    
    operacao_id_filtro = None
    if operacao:
        operacoes = Operacao.listar_todas()
        operacao_obj = next((op for op in operacoes if op.codigo_operacao == operacao), None)
        if operacao_obj:
            operacao_id_filtro = operacao_obj.operacao_id
            where_conditions.append("r.operacao_id = %s")
            params.append(operacao_id_filtro)
    
    if data:
        where_conditions.append("r.data_inicio = %s")
        params.append(data)
    
    # Filtro por turno (através do funcionário)
    if turno and len(turno) > 0:
        placeholders = ','.join(['%s'] * len(turno))
        where_conditions.append(f"f.turno IN ({placeholders})")
        params.extend(turno)
    
    # Filtro por hora de início
    if hora_inicio:
        hora_inicio_formatada = hora_inicio.strip()
        if len(hora_inicio_formatada) == 5 and ':' in hora_inicio_formatada:
            hora_com_segundos = hora_inicio_formatada + ':00'
            where_conditions.append("(r.hora_inicio::time >= %s::time OR (r.hora_inicio IS NULL AND r.inicio::time >= %s::time))")
            params.append(hora_com_segundos)
            params.append(hora_com_segundos)
        else:
            where_conditions.append("(r.hora_inicio::time >= %s::time OR (r.hora_inicio IS NULL AND r.inicio::time >= %s::time))")
            params.append(hora_inicio_formatada)
            params.append(hora_inicio_formatada)
    
    # Filtro por hora de fim
    if hora_fim:
        hora_fim_formatada = hora_fim.strip()
        if len(hora_fim_formatada) == 5 and ':' in hora_fim_formatada:
            hora_com_segundos = hora_fim_formatada + ':59'
            where_conditions.append("(r.hora_inicio::time <= %s::time OR (r.hora_inicio IS NULL AND r.inicio::time <= %s::time) OR (r.fim IS NOT NULL AND r.fim::time <= %s::time))")
            params.append(hora_com_segundos)
            params.append(hora_com_segundos)
            params.append(hora_com_segundos)
        else:
            where_conditions.append("(r.hora_inicio::time <= %s::time OR (r.hora_inicio IS NULL AND r.inicio::time <= %s::time) OR (r.fim IS NOT NULL AND r.fim::time <= %s::time))")
            params.append(hora_fim_formatada)
            params.append(hora_fim_formatada)
            params.append(hora_fim_formatada)
    
    where_clause = " AND ".join(where_conditions)
    return where_clause, params


def _formatar_registro(row: Tuple, pecas_cache: Dict[int, List[Dict]], totens_dict: Dict[int, Dict]) -> Dict[str, Any]:
    registro_id = row[0]
    posto_id = row[1]
    funcionario_id = row[2]
    operacao_id = row[3]
    modelo_id = row[4]
    peca_id = row[5]
    inicio = row[6]
    fim = row[7]
    quantidade = row[8]
    codigo_producao = row[9]
    comentarios = row[10]
    data_inicio = row[11]
    hora_inicio = row[12]
    mes_ano = row[13] if len(row) > 13 else None
    
    # Dados de relacionamentos já vêm do JOIN
    # Funcionário
    f_id = row[14] if len(row) > 14 else None
    f_nome = row[15] if len(row) > 15 else None
    f_matricula = row[16] if len(row) > 16 else None
    f_turno = row[17] if len(row) > 17 else None
    
    # Posto
    p_id = row[18] if len(row) > 18 else None
    p_nome = row[19] if len(row) > 19 else None
    p_toten_id = row[20] if len(row) > 20 else None
    
    # Modelo
    m_id = row[21] if len(row) > 21 else None
    m_nome = row[22] if len(row) > 22 else None
    
    # Operação
    o_id = row[23] if len(row) > 23 else None
    o_codigo = row[24] if len(row) > 24 else None
    o_nome = row[25] if len(row) > 25 else None
    o_produto_id = row[26] if len(row) > 26 else None
    
    # Produto
    pr_id = row[27] if len(row) > 27 else None
    pr_nome = row[28] if len(row) > 28 else None
    
    # Peça
    pc_id = row[29] if len(row) > 29 else None
    pc_codigo = row[30] if len(row) > 30 else None
    pc_nome = row[31] if len(row) > 31 else None
    
    # Buscar peças do modelo (usar cache pré-carregado)
    pecas_modelo = pecas_cache.get(modelo_id, []) if modelo_id else []
    
    # Formatar horários
    hora_inicio_formatada = _formatar_hora(str(hora_inicio) if hora_inicio else None)
    hora_fim_formatada = _formatar_hora(str(fim) if fim else None)
    
    # Extrair datas
    data_inicio_formatada = _formatar_data(str(data_inicio) if data_inicio else None)
    data_fim_formatada = _extrair_data_de_timestamp(str(fim) if fim else None)
    
    # Buscar totem do posto
    totem_info = None
    serial = ''
    hostname = ''
    dispositivo_id = None
    if p_toten_id is not None and p_toten_id != 0:
        try:
            toten_id_int = int(p_toten_id)
            if toten_id_int in totens_dict:
                toten_info = totens_dict[toten_id_int]
                totem_info = {
                    "id": toten_info['id'],
                    "nome": toten_info['nome']
                }
            else:
                totem_info = {
                    "id": toten_id_int,
                    "nome": f"Totem {toten_id_int}"
                }
            
            # Buscar informações do dispositivo
            info_dispositivo = _buscar_info_dispositivo_por_toten(toten_id_int)
            serial = info_dispositivo['serial']
            hostname = info_dispositivo['hostname']
            dispositivo_id = info_dispositivo['dispositivo_id']
        except (ValueError, TypeError):
            totem_info = None
    
    # Montar registro formatado
    registro_formatado = {
        "id": registro_id,
        "data_inicio": data_inicio_formatada,
        "data_fim": data_fim_formatada,
        "hora_inicio": hora_inicio_formatada,
        "hora_fim": hora_fim_formatada,
        "funcionario": {
            "id": f_id,
            "nome": f_nome or 'N/A',
            "matricula": f_matricula or 'N/A',
            "turno": f_turno
        },
        "posto": {
            "id": p_id,
            "nome": p_nome or 'N/A'
        },
        "totem": totem_info,
        "serial": serial,
        "hostname": hostname,
        "dispositivo_id": dispositivo_id,
        "modelo": {
            "id": m_id,
            "codigo": m_nome or 'N/A',
            "descricao": m_nome or 'N/A'
        },
        "quantidade": quantidade,
        "comentarios": comentarios or None
    }
    
    # Adicionar operação se existir
    if o_id:
        registro_formatado["operacao"] = {
            "id": o_id,
            "codigo": o_codigo or '',
            "nome": o_nome or o_codigo or ''
        }
    
    # Adicionar produto se existir
    if pr_id:
        registro_formatado["produto"] = {
            "id": pr_id,
            "nome": pr_nome or 'N/A'
        }
    
    # Adicionar peça se existir
    if pc_id:
        registro_formatado["peca"] = {
            "id": pc_id,
            "codigo": pc_codigo or '',
            "nome": pc_nome or ''
        }
    
    # Adicionar lista de peças do modelo
    if pecas_modelo:
        registro_formatado["pecas"] = pecas_modelo
    
    # Adicionar código de produção se existir
    if codigo_producao:
        registro_formatado["codigo_producao"] = codigo_producao
    
    return registro_formatado


def listar_registros(
    limit: int = 100, 
    offset: int = 0, 
    data: Optional[str] = None, 
    posto: Optional[str] = None, 
    operacao: Optional[str] = None,
    turno: Optional[List[str]] = None,
    hora_inicio: Optional[str] = None,
    hora_fim: Optional[str] = None
) -> Dict[str, Any]:
    """Lista registros de produção usando o model"""
    
    if not RegistroProducao.verificar_tabela_existe():
        return {
            "registros": [],
            "total": 0,
            "limit": limit,
            "offset": offset
        }
    
    try:
        # Verificar se a coluna nome existe na tabela operacoes
        tem_coluna_nome_operacao = RegistroProducao.verificar_coluna_nome_operacao()
        
        # Construir filtros
        where_clause, params = _construir_filtros(
            posto, operacao, data, turno, hora_inicio, hora_fim
        )
        
        # Contar registros
        filtro_turno = turno and len(turno) > 0
        total = RegistroProducao.contar_registros(where_clause, params, filtro_turno)
        
        # Buscar registros com relacionamentos
        rows = RegistroProducao.buscar_registros_com_relacionamentos(
            where_clause, params, limit, offset, tem_coluna_nome_operacao
        )
        
        # Otimização: buscar totens uma única vez (não usado mais, mas mantido para compatibilidade)
        totens = []
        totens_dict = {}
        
        # Otimização: buscar peças de modelos únicos de uma vez
        modelos_ids_unicos = set()
        for row in rows:
            modelo_id = row[4] if len(row) > 4 and row[4] else None
            if modelo_id:
                modelos_ids_unicos.add(modelo_id)
        
        # Buscar peças de todos os modelos de uma vez
        pecas_cache = {}
        for modelo_id in modelos_ids_unicos:
            try:
                pecas_list = Peca.buscar_por_modelo_id(modelo_id)
                pecas_cache[modelo_id] = [{
                    "id": p.id,
                    "codigo": p.codigo,
                    "nome": p.nome
                } for p in pecas_list]
            except:
                pecas_cache[modelo_id] = []
        
        # Formatar registros
        registros_formatados = []
        for row in rows:
            registro = _formatar_registro(row, pecas_cache, totens_dict)
            registros_formatados.append(registro)
        
        return {
            "registros": registros_formatados,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao listar registros: {error_details}")
        raise Exception(f"Erro ao listar registros: {str(e)}")


def atualizar_comentario(registro_id: int, comentario: str) -> Dict[str, Any]:
    """Atualiza o comentário de um registro de produção usando o model"""
    
    try:
        return RegistroProducao.atualizar_comentario(registro_id, comentario)
        
    except ValueError as ve:
        raise Exception(str(ve))
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao atualizar comentário: {error_details}")
        raise Exception(f"Erro ao atualizar comentário: {str(e)}")


def buscar_registro_por_id(registro_id: int) -> Optional[Dict[str, Any]]:
    """Busca um registro específico pelo ID"""
    try:
        return RegistroProducao.buscar_registro_por_id(registro_id)
    except Exception as e:
        print(f"Erro ao buscar registro por ID: {e}")
        return None