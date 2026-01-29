"""
Service para gerenciar dados do dashboard
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
try:
    from zoneinfo import ZoneInfo
    TZ_MANAUS = ZoneInfo('America/Manaus')
except ImportError:
    import pytz
    TZ_MANAUS = pytz.timezone('America/Manaus')
from Server.models.database import DatabaseConnection
from Server.models.posto import Posto
from Server.models.funcionario import Funcionario
from Server.models.modelo import Modelo
from Server.models.operacao import Operacao
from Server.models.sublinha import Sublinha
from Server.services import dispositivo_raspberry_service


def _buscar_info_dispositivo_por_toten(toten_id: int) -> Dict[str, Any]:
    """
    Busca informações do dispositivo Raspberry baseado no toten_id
    Retorna dict com serial, nome e dispositivo_id ou valores vazios
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
                    'nome': dispositivo.get('nome', ''),
                    'dispositivo_id': dispositivo.get('id')
                }
    except Exception as e:
        print(f'Erro ao buscar dispositivo por toten: {e}')
    
    return {
        'serial': '',
        'nome': '',
        'dispositivo_id': None
    }


def buscar_postos_em_uso() -> Dict[str, Any]:
    """
    Busca informações dos postos que estão sendo utilizados (com registros abertos)
    e verifica se os funcionários estão habilitados para as operações
    
    Returns:
        Dicionário com métricas e lista de postos agrupados por sublinha
    """
    try:
        # Buscar todos os registros abertos (fim IS NULL)
        query_registros = """
            SELECT 
                r.registro_id,
                r.posto_id,
                r.funcionario_id,
                r.modelo_id,
                r.operacao_id,
                r.quantidade,
                r.peca_id,
                r.data_inicio,
                r.hora_inicio,
                r.comentarios,
                p.nome as posto_nome,
                p.sublinha_id,
                f.nome as funcionario_nome,
                f.matricula,
                f.turno,
                m.nome as modelo_nome,
                o.operacao_id as operacao_id_check,
                o.codigo_operacao,
                o.nome as operacao_nome,
                s.nome as sublinha_nome,
                pe.nome as peca_nome
            FROM registros_producao r
            INNER JOIN postos p ON r.posto_id = p.posto_id
            INNER JOIN funcionarios f ON r.funcionario_id = f.funcionario_id
            INNER JOIN modelos m ON r.modelo_id = m.modelo_id
            LEFT JOIN operacoes o ON r.operacao_id = o.operacao_id
            LEFT JOIN sublinhas s ON p.sublinha_id = s.sublinha_id
            LEFT JOIN pecas pe ON r.peca_id = pe.peca_id
            WHERE r.fim IS NULL
            ORDER BY s.nome, p.nome
        """
        
        registros = DatabaseConnection.execute_query(query_registros, fetch_all=True)
        
        # Buscar todos os postos e sublinhas
        todos_postos = Posto.listar_todos()
        todas_sublinhas = Sublinha.listar_todas()
        
        # Criar dicionário de postos por sublinha (todos os postos)
        postos_por_sublinha: Dict[int, List[Dict[str, Any]]] = {}
        
        # Inicializar com todos os postos (zerados)
        for posto in todos_postos:
            if posto.sublinha_id not in postos_por_sublinha:
                postos_por_sublinha[posto.sublinha_id] = []
            
            # Buscar informações do dispositivo
            info_dispositivo = _buscar_info_dispositivo_por_toten(posto.toten_id)
            
            # Criar estrutura básica do posto (zerada)
            posto_info = {
                'posto_id': posto.posto_id,
                'posto': posto.nome,
                'sublinha_id': posto.sublinha_id,
                'mod': 'Sem modelo',
                'peca_nome': 'Sem peça',
                'qtd_real': 0,
                'pecas': '0/0',
                'operador': 'Sem operador',
                'habilitado': True,
                'turno': None,
                'operacao_id': None,
                'operacao_nome': None,
                'funcionario_id': None,
                'registro_id': None,
                'comentario': None,
                'comentario_aviso': None,
                'serial': info_dispositivo['serial'],
                'nome': info_dispositivo['nome'],
                'dispositivo_id': info_dispositivo['dispositivo_id']
            }
            postos_por_sublinha[posto.sublinha_id].append(posto_info)
        
        # Processar registros abertos
        postos_em_uso = set()
        funcionarios_ativos = set()
        total_producao_hoje = 0
        
        # Dicionário para rastrear quais postos já foram processados (evitar duplicatas)
        postos_processados: Dict[int, bool] = {}
        
        for registro in registros:
            registro_id = registro[0]
            posto_id = registro[1]
            funcionario_id = registro[2]
            modelo_id = registro[3]
            operacao_id = registro[4]
            quantidade = registro[5] if registro[5] else 0
            peca_id = registro[6]
            data_inicio = registro[7]
            hora_inicio = registro[8]
            comentarios_registro = registro[9] if len(registro) > 9 else None
            posto_nome = registro[10]
            sublinha_id = registro[11]
            funcionario_nome = registro[12]
            matricula = registro[13]
            turno = registro[14]
            modelo_nome = registro[15]
            operacao_id_check = registro[16]
            codigo_operacao = registro[17]
            operacao_nome = registro[18]
            sublinha_nome = registro[19]
            peca_nome = registro[20] if len(registro) > 20 else None
            
            postos_em_uso.add(posto_id)
            funcionarios_ativos.add(funcionario_id)
            
            # Contar produção de hoje
            hoje = datetime.now(TZ_MANAUS).strftime('%Y-%m-%d')
            if data_inicio and str(data_inicio) == hoje:
                total_producao_hoje += quantidade if quantidade else 0
            
            # Se o posto já foi processado, pular (evitar duplicatas)
            # Pegar apenas o primeiro registro aberto para cada posto
            if posto_id in postos_processados:
                continue
            
            # Marcar como processado
            postos_processados[posto_id] = True
            
            # Encontrar o posto na lista e atualizar suas informações
            if sublinha_id in postos_por_sublinha:
                posto_info = next(
                    (p for p in postos_por_sublinha[sublinha_id] if p['posto_id'] == posto_id),
                    None
                )
                
                if posto_info:
                    # Verificar se funcionário está habilitado para a operação
                    habilitado = True
                    comentario_aviso = None
                    comentario_registro = comentarios_registro if comentarios_registro else None
                    
                    if operacao_id_check:
                        # Verificar se funcionário está habilitado para esta operação
                        query_habilitacao = """
                            SELECT COUNT(*) 
                            FROM operacoes_habilitadas 
                            WHERE funcionario_id = %s AND operacao_id = %s AND habilitada = TRUE
                        """
                        resultado = DatabaseConnection.execute_query(
                            query_habilitacao, 
                            (funcionario_id, operacao_id_check), 
                            fetch_one=True
                        )
                        
                        if resultado and resultado[0] == 0:
                            habilitado = False
                            comentario_aviso = f"Funcionário {funcionario_nome} não está habilitado para a operação {operacao_nome or codigo_operacao}"
                    
                    # Buscar quantidade de peças produzidas hoje neste posto
                    query_pecas_hoje = """
                        SELECT COALESCE(SUM(quantidade), 0) as total
                        FROM registros_producao
                        WHERE posto_id = %s 
                        AND data_inicio = %s
                        AND fim IS NOT NULL
                    """
                    resultado_pecas = DatabaseConnection.execute_query(
                        query_pecas_hoje,
                        (posto_id, hoje),
                        fetch_one=True
                    )
                    total_pecas = resultado_pecas[0] if resultado_pecas and resultado_pecas[0] else 0
                    
                    # Meta de peças (pode ser configurável, por enquanto usar 100 como padrão)
                    meta_pecas = 100
                    
                    # Atualizar informações do posto com dados do registro aberto
                    posto_info['mod'] = modelo_nome or 'Sem modelo'
                    posto_info['peca_nome'] = peca_nome or 'Sem peça'
                    posto_info['qtd_real'] = quantidade
                    posto_info['pecas'] = f"{int(total_pecas)}/{meta_pecas}"
                    posto_info['operador'] = funcionario_nome or 'Sem operador'
                    posto_info['habilitado'] = habilitado
                    posto_info['turno'] = turno
                    posto_info['operacao_id'] = operacao_id_check
                    posto_info['operacao_nome'] = operacao_nome or codigo_operacao
                    posto_info['funcionario_id'] = funcionario_id
                    posto_info['registro_id'] = registro_id
                    posto_info['comentario'] = comentario_registro
                    posto_info['comentario_aviso'] = comentario_aviso
        
        # Organizar por sublinha (sempre mostrar todas as sublinhas com 4 cards cada)
        # Numeração sequencial de 1 a 12
        sublinhas_com_postos = []
        numero_posto_global = 1  # Contador global para numeração de 1 a 12
        
        for sublinha in todas_sublinhas:
            # Sempre adicionar a sublinha, mesmo que não tenha postos
            postos_da_sublinha = postos_por_sublinha.get(sublinha.sublinha_id, [])
            
            # Se tiver mais de 4, limitar a 4
            postos_da_sublinha = postos_da_sublinha[:4]
            
            # Atualizar numeração dos postos existentes para sequencial global
            for posto in postos_da_sublinha:
                posto['posto'] = f'Posto {numero_posto_global}'
                numero_posto_global += 1
            
            # Garantir que sempre tenha exatamente 4 cards
            # Se tiver menos de 4, criar cards vazios com IDs únicos negativos
            vazio_counter = 1
            while len(postos_da_sublinha) < 4:
                # Usar ID negativo único para postos vazios (sublinha_id * -1000 - contador)
                posto_vazio_id = (sublinha.sublinha_id * -1000) - vazio_counter
                posto_vazio = {
                    'posto_id': posto_vazio_id,
                    'posto': f'Posto {numero_posto_global}',
                    'sublinha_id': sublinha.sublinha_id,
                    'mod': 'Sem modelo',
                    'peca_nome': 'Sem peça',
                    'qtd_real': 0,
                    'pecas': '0/0',
                    'operador': 'Sem operador',
                    'habilitado': True,
                    'turno': None,
                    'operacao_id': None,
                    'operacao_nome': None,
                    'funcionario_id': None,
                    'registro_id': None,
                    'comentario': None,
                    'comentario_aviso': None,
                    'serial': '',
                    'hostname': '',
                    'dispositivo_id': None
                }
                postos_da_sublinha.append(posto_vazio)
                numero_posto_global += 1
                vazio_counter += 1
            
            sublinhas_com_postos.append({
                'sublinha_id': sublinha.sublinha_id,
                'nome': sublinha.nome,
                'postos': postos_da_sublinha
            })
        
        # Calcular métricas
        metricas = {
            'postosAtivos': len(postos_em_uso),
            'totalPostos': len(todos_postos),
            'producaoHoje': total_producao_hoje,
            'operadoresAtivos': len(funcionarios_ativos)
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

