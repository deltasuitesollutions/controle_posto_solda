from typing import Dict, Any, List
from datetime import datetime
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
    buscar_metricas_hoje,
    listar_todos_postos,
    listar_todas_sublinhas,
)
from Server.services import dispositivo_raspberry_service


def _carregar_dispositivos_por_toten(todos_postos) -> Dict[int, Dict[str, Any]]:
    """
    Carrega a lista de dispositivos UMA única vez e monta um dict
    indexado por toten_id para acesso O(1).
    """
    resultado = {}
    try:
        dispositivos = dispositivo_raspberry_service.listar_dispositivos()
        if not dispositivos:
            return resultado

        for posto in todos_postos:
            toten_id = posto.toten_id
            toten_index = toten_id - 1 if toten_id > 0 else 0
            if toten_index < len(dispositivos):
                d = dispositivos[toten_index]
                resultado[toten_id] = {
                    'serial': d.get('serial', ''),
                    'nome': d.get('nome', ''),
                    'dispositivo_id': d.get('id')
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
        # ---- Todas as consultas ao banco de uma vez (6 queries fixas) ----
        registros = buscar_registros_abertos()
        todos_postos = listar_todos_postos()
        todas_sublinhas = listar_todas_sublinhas()
        habilitacoes = buscar_habilitacoes_ativas()
        hoje = datetime.now(TZ_MANAUS).strftime('%Y-%m-%d')
        pecas_por_posto = buscar_pecas_hoje_por_posto(hoje)
        metricas_hoje = buscar_metricas_hoje()

        # Dispositivos carregados 1x (1 query) e indexados por toten_id
        dispositivos_map = _carregar_dispositivos_por_toten(todos_postos)

        # ---- Regra de negócio (sem mais queries) ----

        postos_por_sublinha: Dict[int, List[Dict[str, Any]]] = {}

        for posto in todos_postos:
            if posto.sublinha_id not in postos_por_sublinha:
                postos_por_sublinha[posto.sublinha_id] = []

            info_dispositivo = dispositivos_map.get(posto.toten_id)
            posto_info = _criar_posto_vazio(posto=posto, info_dispositivo=info_dispositivo)
            postos_por_sublinha[posto.sublinha_id].append(posto_info)

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
            habilitado = True
            comentario_aviso = None

            if dados['operacao_id_check']:
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
        sublinhas_com_postos = []
        numero_posto_global = 1

        for sublinha in todas_sublinhas:
            postos_da_sublinha = postos_por_sublinha.get(sublinha.sublinha_id, [])
            postos_da_sublinha = postos_da_sublinha[:4]

            for posto in postos_da_sublinha:
                posto['posto'] = f'Posto {numero_posto_global}'
                numero_posto_global += 1

            vazio_counter = 1
            while len(postos_da_sublinha) < 4:
                posto_vazio_id = (sublinha.sublinha_id * -1000) - vazio_counter
                posto_vazio = _criar_posto_vazio(
                    sublinha_id=sublinha.sublinha_id,
                    posto_nome=f'Posto {numero_posto_global}',
                )
                posto_vazio['posto_id'] = posto_vazio_id
                posto_vazio['hostname'] = ''
                postos_da_sublinha.append(posto_vazio)
                numero_posto_global += 1
                vazio_counter += 1

            sublinhas_com_postos.append({
                'sublinha_id': sublinha.sublinha_id,
                'nome': sublinha.nome,
                'postos': postos_da_sublinha
            })

        # Métricas
        metricas = {
            'postosAtivos': len(postos_em_uso),
            'totalPostos': len(todos_postos),
            'producaoHoje': metricas_hoje['producaoHoje'],
            'operadoresAtivos': metricas_hoje['operadoresAtivos']
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
