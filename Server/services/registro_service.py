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
    operacao: Optional[str] = None,
    turno: Optional[List[str]] = None,
    hora_inicio: Optional[str] = None,
    hora_fim: Optional[str] = None
) -> Dict[str, Any]:
    """Lista registros de produção com todas as informações necessárias usando JOINs para melhor performance"""
    
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
        # Verificar se a coluna nome existe na tabela operacoes
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'operacoes'
            AND column_name = 'nome'
        """)
        tem_coluna_nome_operacao = cursor.fetchone() is not None
        
        # Preparar filtros para a query
        where_conditions = ["1=1"]
        params = []
        
        # Resolver posto_id se posto for fornecido
        posto_id_filtro = None
        if posto:
            postos = Posto.listar_todos()
            posto_obj = next((p for p in postos if p.nome == posto), None)
            if posto_obj:
                posto_id_filtro = posto_obj.posto_id
                where_conditions.append("r.posto_id = %s")
                params.append(posto_id_filtro)
        
        # Resolver operacao_id se operacao for fornecida
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
            # Criar placeholders para cada turno
            placeholders = ','.join(['%s'] * len(turno))
            where_conditions.append(f"f.turno IN ({placeholders})")
            params.extend(turno)
        
        # Filtro por hora de início
        if hora_inicio:
            # Formatar hora_inicio para comparação (HH:MM)
            hora_inicio_formatada = hora_inicio.strip()
            if len(hora_inicio_formatada) == 5 and ':' in hora_inicio_formatada:
                # Formato HH:MM, garantir que tenha segundos para comparação TIME
                hora_com_segundos = hora_inicio_formatada + ':00'
                # Comparar hora_inicio (TIME) ou extrair hora de inicio (TIMESTAMP)
                where_conditions.append("(r.hora_inicio::time >= %s::time OR (r.hora_inicio IS NULL AND r.inicio::time >= %s::time))")
                params.append(hora_com_segundos)
                params.append(hora_com_segundos)
            else:
                where_conditions.append("(r.hora_inicio::time >= %s::time OR (r.hora_inicio IS NULL AND r.inicio::time >= %s::time))")
                params.append(hora_inicio_formatada)
                params.append(hora_inicio_formatada)
        
        # Filtro por hora de fim
        if hora_fim:
            # Formatar hora_fim para comparação (HH:MM)
            hora_fim_formatada = hora_fim.strip()
            if len(hora_fim_formatada) == 5 and ':' in hora_fim_formatada:
                # Formato HH:MM, garantir que tenha segundos para comparação TIME
                hora_com_segundos = hora_fim_formatada + ':59'
                # Comparar hora_inicio ou fim (qualquer um que esteja dentro do intervalo)
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
        
        # Query de contagem otimizada
        # Se houver filtro de turno, precisa fazer JOIN com funcionarios
        if turno and len(turno) > 0:
            count_query = f"SELECT COUNT(*) FROM registros_producao r LEFT JOIN funcionarios f ON r.funcionario_id = f.funcionario_id WHERE {where_clause}"
        else:
            count_query = f"SELECT COUNT(*) FROM registros_producao r WHERE {where_clause}"
        cursor.execute(count_query, tuple(params))
        total_result = cursor.fetchone()
        total = int(total_result[0]) if total_result and total_result[0] else 0
        
        # Query principal com JOINs para buscar todos os dados relacionados de uma vez
        # Isso elimina o problema N+1 queries
        operacao_nome_select = "o.nome" if tem_coluna_nome_operacao else "o.codigo_operacao"
        query = f"""
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
                r.mes_ano,
                -- Funcionário
                f.funcionario_id as f_id,
                f.nome as f_nome,
                f.matricula as f_matricula,
                f.turno as f_turno,
                -- Posto
                p.posto_id as p_id,
                p.nome as p_nome,
                p.toten_id as p_toten_id,
                -- Modelo
                m.modelo_id as m_id,
                m.nome as m_nome,
                -- Operação
                o.operacao_id as o_id,
                o.codigo_operacao as o_codigo,
                {operacao_nome_select} as o_nome,
                o.produto_id as o_produto_id,
                -- Produto
                pr.produto_id as pr_id,
                pr.nome as pr_nome,
                -- Peça
                pc.peca_id as pc_id,
                pc.codigo as pc_codigo,
                pc.nome as pc_nome
            FROM registros_producao r
            LEFT JOIN funcionarios f ON r.funcionario_id = f.funcionario_id
            LEFT JOIN postos p ON r.posto_id = p.posto_id
            LEFT JOIN modelos m ON r.modelo_id = m.modelo_id
            LEFT JOIN operacoes o ON r.operacao_id = o.operacao_id
            LEFT JOIN produtos pr ON o.produto_id = pr.produto_id
            LEFT JOIN pecas pc ON r.peca_id = pc.peca_id
            WHERE {where_clause}
            ORDER BY r.registro_id DESC
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        
        # Buscar totens uma única vez
        totens = TotenID.listar_todos()
        # Garantir que as chaves do dict sejam int para comparação funcionar
        totens_dict = {int(t['id']): t for t in totens}
        
        # Buscar todos os modelos únicos dos registros para buscar peças de uma vez
        modelos_ids_unicos = set()
        for row in rows:
            modelo_id = row[4] if len(row) > 4 and row[4] else None
            if modelo_id:
                modelos_ids_unicos.add(modelo_id)
        
        # Buscar peças de todos os modelos de uma vez (otimização)
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
        
        registros_formatados = []
        
        for row in rows:
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
            if p_toten_id is not None and p_toten_id != 0:
                try:
                    # Garantir que p_toten_id seja int para a comparação funcionar
                    toten_id_int = int(p_toten_id)
                    if toten_id_int in totens_dict:
                        toten_info = totens_dict[toten_id_int]
                        totem_info = {
                            "id": toten_info['id'],
                            "nome": toten_info['nome']
                        }
                    else:
                        # Se não encontrou no dict, criar um totem genérico
                        totem_info = {
                            "id": toten_id_int,
                            "nome": f"Totem {toten_id_int}"
                        }
                except (ValueError, TypeError):
                    # Se não for possível converter para int, não teremos totem
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


def atualizar_comentario(registro_id: int, comentario: str) -> Dict[str, Any]:
    """Atualiza o comentário de um registro de produção"""
    
    if not DatabaseConnection.table_exists('registros_producao'):
        raise Exception("Tabela registros_producao não existe")
    
    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se o registro existe
        cursor.execute("SELECT registro_id FROM registros_producao WHERE registro_id = %s", (registro_id,))
        registro = cursor.fetchone()
        
        if not registro:
            raise Exception(f"Registro com ID {registro_id} não encontrado")
        
        # Atualizar o comentário
        cursor.execute(
            "UPDATE registros_producao SET comentarios = %s WHERE registro_id = %s",
            (comentario, registro_id)
        )
        conn.commit()
        
        return {
            "sucesso": True,
            "mensagem": "Comentário atualizado com sucesso",
            "registro_id": registro_id
        }
        
    except Exception as e:
        conn.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao atualizar comentário: {error_details}")
        raise Exception(f"Erro ao atualizar comentário: {str(e)}")
    finally:
        cursor.close()
        conn.close()

