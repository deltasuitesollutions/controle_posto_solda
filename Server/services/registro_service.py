"""
Service para lógica de negócio de registros de produção
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from Server.models.database import DatabaseConnection
from Server.models import Funcionario, Modelo, Posto
from Server.models.operacao import Operacao
from Server.models.produto import Produto
from Server.models.peca import Peca
from Server.enums.toten_enum import TotenID


def _formatar_hora(hora: Optional[str]) -> Optional[str]:
    """Formata hora removendo segundos se existirem ou extrai hora de timestamp"""
    if not hora:
        return None
    hora_str = str(hora)
    
    # Se for um timestamp completo (YYYY-MM-DD HH:MM:SS), extrair apenas a hora
    if ' ' in hora_str:
        # É um timestamp, extrair a parte da hora
        partes = hora_str.split(' ')
        if len(partes) >= 2:
            hora_part = partes[1]  # Pega a parte "HH:MM:SS"
            # Remover segundos se existirem
            if hora_part.count(':') >= 2:
                return hora_part[:5]  # Retorna "HH:MM"
            return hora_part
    
    # Se já for só hora com segundos (HH:MM:SS), remover segundos
    if len(hora_str) >= 8 and hora_str.count(':') >= 2:
        return hora_str[:5]
    
    return hora_str


def _formatar_data(data: Optional[str]) -> Optional[str]:
    """Formata data para YYYY-MM-DD"""
    if not data:
        return None
    if isinstance(data, str):
        # Se já está no formato YYYY-MM-DD, retornar como está
        if len(data) == 10 and data.count('-') == 2:
            return data
        # Tentar parsear outros formatos
        try:
            date_obj = datetime.strptime(data, '%Y-%m-%d')
            return date_obj.strftime('%Y-%m-%d')
        except:
            pass
    return str(data)


def _extrair_data_de_timestamp(timestamp: Optional[str]) -> Optional[str]:
    """Extrai a data de um timestamp"""
    if not timestamp:
        return None
    try:
        # Se for timestamp no formato 'YYYY-MM-DD HH:MM:SS'
        if ' ' in str(timestamp):
            return str(timestamp).split(' ')[0]
        # Se já for só data
        return _formatar_data(str(timestamp))
    except:
        return None


def listar_registros(
    limit: int = 100, 
    offset: int = 0, 
    data: Optional[str] = None, 
    posto: Optional[str] = None, 
    operacao: Optional[str] = None
) -> Dict[str, Any]:
    """Lista registros de produção com todas as informações necessárias"""
    
    if not DatabaseConnection.table_exists('registros_producao'):
        return {
            "registros": [],
            "total": 0,
            "limit": limit,
            "offset": offset
        }
    
    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor()
    
    try:
        # Query base com todos os campos necessários
        query = """
            SELECT 
                r.registro_id,
                r.posto_id,
                r.funcionario_id,
                r.operacao_id,
                r.modelo_id,
                r.peca_id,
                r.inicio,
                r.fim,
                r.quantidade,
                r.codigo_producao,
                r.comentarios,
                r.data_inicio,
                r.hora_inicio,
                r.mes_ano
            FROM registros_producao r
            WHERE 1=1
        """
        params = []
        
        if data:
            query += " AND r.data_inicio = %s"
            params.append(data)
        
        if posto:
            postos = Posto.listar_todos()
            posto_obj = next((p for p in postos if p.nome == posto), None)
            if posto_obj:
                query += " AND r.posto_id = %s"
                params.append(posto_obj.posto_id)
        
        if operacao:
            operacoes = Operacao.listar_todas()
            operacao_obj = next((op for op in operacoes if op.codigo_operacao == operacao), None)
            if operacao_obj:
                query += " AND r.operacao_id = %s"
                params.append(operacao_obj.operacao_id)
        
        # Contar total
        count_query = """
            SELECT COUNT(*)
            FROM registros_producao r
            WHERE 1=1
        """
        count_params = []
        if data:
            count_query += " AND r.data_inicio = %s"
            count_params.append(data)
        if posto:
            postos = Posto.listar_todos()
            posto_obj = next((p for p in postos if p.nome == posto), None)
            if posto_obj:
                count_query += " AND r.posto_id = %s"
                count_params.append(posto_obj.posto_id)
        if operacao:
            operacoes = Operacao.listar_todas()
            operacao_obj = next((op for op in operacoes if op.codigo_operacao == operacao), None)
            if operacao_obj:
                count_query += " AND r.operacao_id = %s"
                count_params.append(operacao_obj.operacao_id)
        
        cursor.execute(count_query, tuple(count_params))
        total_result = cursor.fetchone()
        total = int(total_result[0]) if total_result and total_result[0] else 0
        
        # Query com ordenação e paginação
        query += " ORDER BY r.registro_id DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        
        registros_formatados = []
        
        for row in rows:
            registro_id = row[0]
            posto_id = row[1]
            funcionario_id = row[2]
            operacao_id = row[3]
            modelo_id = row[4]
            peca_id = row[5]
            inicio = row[6]  # timestamp
            fim = row[7]  # timestamp
            quantidade = row[8]
            codigo_producao = row[9]
            comentarios = row[10]
            data_inicio = row[11]  # date
            hora_inicio = row[12]  # time
            mes_ano = row[13] if len(row) > 13 else None
            
            # Buscar informações relacionadas
            funcionario = Funcionario.buscar_por_id(funcionario_id) if funcionario_id else None
            modelo = Modelo.buscar_por_id(modelo_id) if modelo_id else None
            posto_obj = Posto.buscar_por_id(posto_id) if posto_id else None
            
            # Buscar operação e suas informações
            operacao_info = None
            produto_info = None
            if operacao_id:
                operacao_obj = Operacao.buscar_por_id(operacao_id)
                if operacao_obj:
                    operacao_info = {
                        "id": operacao_obj.operacao_id,
                        "codigo": operacao_obj.codigo_operacao,
                        "nome": operacao_obj.nome or operacao_obj.codigo_operacao
                    }
                    # Buscar produto da operação
                    if operacao_obj.produto_id:
                        produto = Produto.buscarId(operacao_obj.produto_id)
                        if produto:
                            produto_info = {
                                "id": produto.id,
                                "nome": produto.nome
                            }
            
            # Buscar peça
            peca_info = None
            if peca_id:
                peca = Peca.buscar_por_id(peca_id)
                if peca:
                    peca_info = {
                        "id": peca.id,
                        "codigo": peca.codigo,
                        "nome": peca.nome
                    }
            
            # Buscar todas as peças do modelo (se necessário)
            pecas_modelo = []
            if modelo_id:
                try:
                    pecas_list = Peca.buscar_por_modelo_id(modelo_id)
                    pecas_modelo = [{
                        "id": p.id,
                        "codigo": p.codigo,
                        "nome": p.nome
                    } for p in pecas_list]
                except:
                    pass
            
            # Formatar horários
            hora_inicio_formatada = _formatar_hora(str(hora_inicio) if hora_inicio else None)
            hora_fim_formatada = _formatar_hora(str(fim) if fim else None)
            
            # Extrair datas
            data_inicio_formatada = _formatar_data(str(data_inicio) if data_inicio else None)
            data_fim_formatada = _extrair_data_de_timestamp(str(fim) if fim else None)
            
            # Buscar totem do posto
            totem_info = None
            if posto_obj and posto_obj.toten_id:
                totens = TotenID.listar_todos()
                toten_info = next((t for t in totens if t['id'] == posto_obj.toten_id), None)
                if toten_info:
                    totem_info = {
                        "id": toten_info['id'],
                        "nome": toten_info['nome']
                    }
            
            # Montar registro formatado
            registro_formatado = {
                "id": registro_id,
                "data_inicio": data_inicio_formatada,
                "data_fim": data_fim_formatada,
                "hora_inicio": hora_inicio_formatada,
                "hora_fim": hora_fim_formatada,
                "funcionario": {
                    "id": funcionario.funcionario_id if funcionario else None,
                    "nome": funcionario.nome if funcionario else 'N/A',
                    "matricula": funcionario.matricula if funcionario else 'N/A',
                    "turno": funcionario.turno if funcionario and funcionario.turno else None
                },
                "posto": {
                    "id": posto_obj.posto_id if posto_obj else None,
                    "nome": posto_obj.nome if posto_obj else 'N/A'
                },
                "totem": totem_info,
                "modelo": {
                    "id": modelo.id if modelo else None,
                    "codigo": modelo.codigo if modelo else 'N/A',
                    "descricao": modelo.descricao if modelo else 'N/A'
                },
                "quantidade": quantidade,
                "comentarios": comentarios or None
            }
            
            # Adicionar operação se existir
            if operacao_info:
                registro_formatado["operacao"] = operacao_info
            
            # Adicionar produto se existir
            if produto_info:
                registro_formatado["produto"] = produto_info
            
            # Adicionar peça se existir
            if peca_info:
                registro_formatado["peca"] = peca_info
            
            # Adicionar lista de peças do modelo
            if pecas_modelo:
                registro_formatado["pecas"] = pecas_modelo
            
            # Adicionar código de produção se existir
            if codigo_producao:
                registro_formatado["codigo_producao"] = codigo_producao
            
            registros_formatados.append(registro_formatado)
        
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
    finally:
        cursor.close()
        conn.close()

