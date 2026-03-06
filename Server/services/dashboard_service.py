from typing import Dict, Any, List
from datetime import datetime
import re
try:
    from zoneinfo import ZoneInfo
    TZ_MANAUS = ZoneInfo('America/Manaus')
except ImportError:
    import pytz
    TZ_MANAUS = pytz.timezone('America/Manaus')
from Server.DAO.Dashboard_dao import (
    buscar_registros_abertos,
    buscar_habilitacoes_ativas,
    buscar_pecas_hoje_por_posto,
    contar_producao_finalizada_hoje,
    listar_todos_postos,
    listar_todas_sublinhas,
)
from Server.services import dispositivo_raspberry_service


def _carregar_dispositivos_por_toten(todos_postos) -> Dict[int, Dict[str, Any]]:
    """
    Carrega a lista de dispositivos e monta um dict
    indexado por toten_id para acesso O(1).
    O toten_id corresponde ao id do dispositivo Raspberry.
    """
    resultado = {}
    try:
        for posto in todos_postos:
            toten_id = posto.toten_id
            # O toten_id é o id do dispositivo Raspberry
            dispositivo = dispositivo_raspberry_service.buscar_dispositivo_por_id(toten_id)
            if dispositivo:
                resultado[toten_id] = {
                    'serial': dispositivo.get('serial', ''),
                    'nome': dispositivo.get('nome', ''),
                    'dispositivo_id': dispositivo.get('id')
                }
    except Exception as e:
        print(f'Erro ao carregar dispositivos: {e}')

    return resultado


def _criar_posto_vazio(posto=None, sublinha_id=None, posto_nome='', info_dispositivo=None) -> Dict[str, Any]:
    return {
        'posto_id': posto.posto_id if posto else None,
        'posto': posto_nome or (posto.nome if posto else ''),
        'sublinha_id': sublinha_id or (posto.sublinha_id if posto else None),
        'mod': 'Sem modelo',
        'peca_nome': 'Sem peça',
        'qtd_real': 0,
        'pecas': '0/0',
        'operador': 'Sem operador',
        'habilitado': None,
        'turno': None,
        'operacao_id': None,
        'operacao_nome': None,
        'funcionario_id': None,
        'registro_id': None,
        'comentario': None,
        'comentario_aviso': None,
        'serial': info_dispositivo['serial'] if info_dispositivo else '',
        'nome': info_dispositivo['nome'] if info_dispositivo else '',
        'dispositivo_id': info_dispositivo['dispositivo_id'] if info_dispositivo else None,
    }


def _extrair_numero_posto(nome_posto: str) -> int:
    """
    Extrai o número do nome do posto para ordenação numérica.
    Ex: "Posto 4" -> 4, "Posto 12" -> 12
    Se não encontrar número, retorna 999999 para colocar no final.
    """
    if not nome_posto:
        return 999999
    match = re.search(r'\d+', str(nome_posto))
    if match:
        return int(match.group())
    return 999999


def _extrair_numero_sublinha(nome_sublinha: str) -> int:
    """
    Extrai o número do nome da sublinha para ordenação numérica.
    Ex: "Sublinha 1" -> 1, "Sublinha 2" -> 2, "Sublinha 3" -> 3
    Se não encontrar número, retorna 999999 para colocar no final.
    """
    if not nome_sublinha:
        return 999999
    match = re.search(r'\d+', str(nome_sublinha))
    if match:
        return int(match.group())
    return 999999


def _extrair_dados_registro(registro) -> Dict[str, Any]:
    return {
        'registro_id': registro[0],
        'posto_id': registro[1],
        'funcionario_id': registro[2],
        'modelo_id': registro[3],
        'operacao_id': registro[4],
        'quantidade': registro[5] if registro[5] else 0,
        'peca_id': registro[6],
        'data_inicio': registro[7],
        'hora_inicio': registro[8],
        'comentarios': registro[9] if len(registro) > 9 else None,
        'posto_nome': registro[10],
        'sublinha_id': registro[11],
        'funcionario_nome': registro[12],
        'matricula': registro[13],
        'turno': registro[14],
        'modelo_nome': registro[15],
        'operacao_id_check': registro[16],
        'codigo_operacao': registro[17],
        'operacao_nome': registro[18],
        'sublinha_nome': registro[19],
        'peca_nome': registro[20] if len(registro) > 20 else None,
    }


def buscar_postos_em_uso() -> Dict[str, Any]:
    try:
        # ---- Todas as consultas ao banco de uma vez ----
        registros = buscar_registros_abertos()  # registros com fim IS NULL
        todos_postos = listar_todos_postos()
        todas_sublinhas = listar_todas_sublinhas()
        habilitacoes = buscar_habilitacoes_ativas()
        hoje = datetime.now(TZ_MANAUS).strftime('%Y-%m-%d')
        pecas_por_posto = buscar_pecas_hoje_por_posto(hoje)
        producao_hoje = contar_producao_finalizada_hoje(hoje)

        # Operadores ativos: derivado diretamente dos registros abertos (fim IS NULL)
        # registro[2] = funcionario_id (índice 2 na query buscar_registros_abertos)
        operadores_ativos = len(set(r[2] for r in registros)) if registros else 0

        # Dispositivos carregados 1x (1 query) e indexados por toten_id
        dispositivos_map = _carregar_dispositivos_por_toten(todos_postos)

        # ---- Regra de negócio (sem mais queries) ----

        postos_por_sublinha: Dict[int, List[Dict[str, Any]]] = {}

        for posto in todos_postos:
            if posto.sublinha_id not in postos_por_sublinha:
                postos_por_sublinha[posto.sublinha_id] = []

            info_dispositivo = dispositivos_map.get(posto.toten_id)
            posto_info = _criar_posto_vazio(posto=posto, info_dispositivo=info_dispositivo)
            # Guardar o nome original do posto para uso posterior
            posto_info['posto_original'] = posto.nome
            postos_por_sublinha[posto.sublinha_id].append(posto_info)

        # IMPORTANTE: Ordenar os postos ANTES de processar os registros
        # Isso garante que os postos sejam ordenados pelo número original
        for sublinha_id in postos_por_sublinha:
            postos_por_sublinha[sublinha_id].sort(key=lambda p: (
                _extrair_numero_posto(p.get('posto_original', '')),
                p.get('posto_id', 999999)
            ))

        # Processar registros abertos
        postos_em_uso = set()
        postos_processados: Dict[int, bool] = {}
        meta_pecas = 100

        for registro in registros:
            dados = _extrair_dados_registro(registro)

            postos_em_uso.add(dados['posto_id'])

            # Pegar apenas o primeiro registro aberto para cada posto
            if dados['posto_id'] in postos_processados:
                continue
            postos_processados[dados['posto_id']] = True

            sublinha_id = dados['sublinha_id']
            if sublinha_id not in postos_por_sublinha:
                continue

            posto_info = next(
                (p for p in postos_por_sublinha[sublinha_id] if p['posto_id'] == dados['posto_id']),
                None
            )
            if not posto_info:
                continue

            # Verificar habilitação via set em memória (sem query)
            habilitado = None
            comentario_aviso = None

            if dados['operacao_id_check']:
                # Verificar se o funcionário está habilitado para esta operação
                habilitado = (dados['funcionario_id'], dados['operacao_id_check']) in habilitacoes
                if not habilitado:
                    comentario_aviso = (
                        f"Funcionário {dados['funcionario_nome']} não está habilitado "
                        f"para a operação {dados['operacao_nome'] or dados['codigo_operacao']}"
                    )

            # Peças hoje via dict em memória (sem query)
            total_pecas = pecas_por_posto.get(dados['posto_id'], 0)

            # Atualizar informações do posto
            posto_info['mod'] = dados['modelo_nome'] or 'Sem modelo'
            posto_info['peca_nome'] = dados['peca_nome'] or 'Sem peça'
            posto_info['qtd_real'] = dados['quantidade']
            posto_info['pecas'] = f"{int(total_pecas)}/{meta_pecas}"
            posto_info['operador'] = dados['funcionario_nome'] or 'Sem operador'
            posto_info['habilitado'] = habilitado
            posto_info['turno'] = dados['turno']
            posto_info['operacao_id'] = dados['operacao_id_check']
            posto_info['operacao_nome'] = dados['operacao_nome'] or dados['codigo_operacao']
            posto_info['funcionario_id'] = dados['funcionario_id']
            posto_info['registro_id'] = dados['registro_id']
            posto_info['comentario'] = dados['comentarios']
            posto_info['comentario_aviso'] = comentario_aviso

        # Organizar por sublinha (sempre mostrar todas as sublinhas com 4 cards cada)
        # Ordenar sublinhas numericamente pelo número extraído do nome
        todas_sublinhas_ordenadas = sorted(
            todas_sublinhas,
            key=lambda s: _extrair_numero_sublinha(s.nome)
        )
        
        sublinhas_com_postos = []

        for sublinha in todas_sublinhas_ordenadas:
            # Pegar os postos da sublinha (limitado aos primeiros 4 postos, já ordenados)
            postos_da_sublinha = postos_por_sublinha.get(sublinha.sublinha_id, [])[:4]

            # Restaurar o nome original dos postos existentes
            for posto in postos_da_sublinha:
                if 'posto_original' in posto:
                    posto['posto'] = posto['posto_original']

            # Completar com postos vazios se necessário (mínimo 4 cards por sublinha)
            contador_vazio = 1
            while len(postos_da_sublinha) < 4:
                posto_vazio_id = (sublinha.sublinha_id * -1000) - contador_vazio
                posto_vazio = _criar_posto_vazio(
                    sublinha_id=sublinha.sublinha_id,
                    posto_nome=f'Posto {contador_vazio}',
                )
                posto_vazio['posto_id'] = posto_vazio_id
                posto_vazio['hostname'] = ''
                postos_da_sublinha.append(posto_vazio)
                contador_vazio += 1

            sublinhas_com_postos.append({
                'sublinha_id': sublinha.sublinha_id,
                'nome': sublinha.nome,
                'postos': postos_da_sublinha
            })

        # Métricas (derivadas dos dados já carregados — sempre consistentes)
        metricas = {
            'postosAtivos': len(postos_em_uso),
            'totalPostos': len(todos_postos),
            'producaoHoje': producao_hoje,
            'operadoresAtivos': operadores_ativos
        }

        return {
            'metricas': metricas,
            'sublinhas': sublinhas_com_postos
        }

    except Exception as e:
        print(f'Erro ao buscar postos em uso: {e}')
        import traceback
        traceback.print_exc()
        return {
            'metricas': {
                'postosAtivos': 0,
                'totalPostos': 0,
                'producaoHoje': 0,
                'operadoresAtivos': 0
            },
            'sublinhas': []
        }