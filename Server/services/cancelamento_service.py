"""
Service para gerenciar cancelamentos de operações
"""
from typing import Dict, Any, List, Optional
from Server.models.cancelamento import CancelamentoOperacao
from Server.models.database import DatabaseConnection
from Server.models.funcionario import Funcionario
from Server.models.posto import Posto
from Server.models.modelo import Modelo
from Server.models.operacao import Operacao
from Server.models.usuario import Usuario


def listar_cancelamentos(
    limit: int = 100,
    offset: int = 0,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None
) -> Dict[str, Any]:
    """Lista cancelamentos com dados relacionados do registro"""
    try:
        cancelamentos = CancelamentoOperacao.listar_todos(
            limit=limit,
            offset=offset,
            data_inicio=data_inicio,
            data_fim=data_fim
        )
        total = CancelamentoOperacao.contar(data_inicio=data_inicio, data_fim=data_fim)
        
        cancelamentos_formatados = []
        
        for cancelamento in cancelamentos:
            # Buscar dados do registro
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
                
                operacao_nome_select = "o.nome" if tem_coluna_nome_operacao else "o.codigo_operacao"
                
                # Buscar dados do registro com joins
                query = f"""
                    SELECT 
                        r.registro_id,
                        r.data_inicio,
                        r.hora_inicio,
                        r.quantidade,
                        -- Funcionário
                        f.funcionario_id as f_id,
                        f.nome as f_nome,
                        f.matricula as f_matricula,
                        -- Posto
                        p.posto_id as p_id,
                        p.nome as p_nome,
                        -- Modelo
                        m.modelo_id as m_id,
                        m.nome as m_nome,
                        -- Operação
                        o.operacao_id as o_id,
                        o.codigo_operacao as o_codigo,
                        {operacao_nome_select} as o_nome
                    FROM registros_producao r
                    LEFT JOIN funcionarios f ON r.funcionario_id = f.funcionario_id
                    LEFT JOIN postos p ON r.posto_id = p.posto_id
                    LEFT JOIN modelos m ON r.modelo_id = m.modelo_id
                    LEFT JOIN operacoes o ON r.operacao_id = o.operacao_id
                    WHERE r.registro_id = %s
                """
                cursor.execute(query, (cancelamento.registro_id,))
                row = cursor.fetchone()
                
                if not row:
                    continue
                
                # Buscar usuário que cancelou
                usuario_cancelou = None
                if cancelamento.cancelado_por_usuario_id:
                    usuario = Usuario.buscar_por_id(cancelamento.cancelado_por_usuario_id)
                    if usuario:
                        usuario_cancelou = {
                            "id": usuario.id,
                            "nome": usuario.nome,
                            "username": usuario.username
                        }
                
                # Formatar data de cancelamento
                data_cancelamento_formatada = None
                if cancelamento.data_cancelamento:
                    try:
                        from datetime import datetime
                        if isinstance(cancelamento.data_cancelamento, str):
                            dt = datetime.fromisoformat(cancelamento.data_cancelamento.replace('Z', '+00:00'))
                            data_cancelamento_formatada = dt.strftime('%Y-%m-%d %H:%M:%S')
                        else:
                            data_cancelamento_formatada = str(cancelamento.data_cancelamento)
                    except:
                        data_cancelamento_formatada = str(cancelamento.data_cancelamento)
                
                # Formatar data de início
                data_inicio_formatada = None
                hora_inicio_formatada = None
                if row[1]:  # data_inicio
                    try:
                        if isinstance(row[1], str):
                            data_inicio_formatada = row[1][:10] if len(row[1]) >= 10 else row[1]
                        else:
                            data_inicio_formatada = str(row[1])[:10]
                    except:
                        data_inicio_formatada = str(row[1])[:10] if row[1] else None
                
                if row[2]:  # hora_inicio
                    try:
                        if isinstance(row[2], str):
                            hora_inicio_formatada = row[2][:5] if ':' in row[2] else row[2]
                        else:
                            hora_inicio_formatada = str(row[2])[:5]
                    except:
                        hora_inicio_formatada = str(row[2]) if row[2] else None
                
                cancelamento_formatado = {
                    "id": cancelamento.cancelamento_id,
                    "registro_id": cancelamento.registro_id,
                    "data_inicio": data_inicio_formatada,
                    "hora_inicio": hora_inicio_formatada,
                    "quantidade": row[3] if len(row) > 3 else None,
                    "funcionario": {
                        "id": row[4] if len(row) > 4 else None,
                        "nome": row[5] if len(row) > 5 else None,
                        "matricula": row[6] if len(row) > 6 else None
                    } if row[4] else None,
                    "posto": {
                        "id": row[7] if len(row) > 7 else None,
                        "nome": row[8] if len(row) > 8 else None
                    } if row[7] else None,
                    "modelo": {
                        "id": row[9] if len(row) > 9 else None,
                        "nome": row[10] if len(row) > 10 else None
                    } if row[9] else None,
                    "operacao": {
                        "id": row[11] if len(row) > 11 else None,
                        "codigo": row[12] if len(row) > 12 else None,
                        "nome": row[13] if len(row) > 13 else None
                    } if row[11] else None,
                    "motivo": cancelamento.motivo,
                    "usuario_cancelou": usuario_cancelou,
                    "data_cancelamento": data_cancelamento_formatada
                }
                
                cancelamentos_formatados.append(cancelamento_formatado)
                
            except Exception as e:
                print(f"Erro ao buscar dados do registro {cancelamento.registro_id}: {e}")
                continue
            finally:
                cursor.close()
                conn.close()
        
        return {
            "cancelamentos": cancelamentos_formatados,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise Exception(f"Erro ao listar cancelamentos: {str(e)}")


def listar_operacoes_iniciadas_por_dia(
    data: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> Dict[str, Any]:
    """Lista operações iniciadas (não finalizadas e não canceladas) por dia"""
    try:
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
            
            operacao_nome_select = "o.nome" if tem_coluna_nome_operacao else "o.codigo_operacao"
            
            # Buscar registros iniciados mas não finalizados e não cancelados
            where_conditions = ["r.fim IS NULL"]
            params = []
            
            if data:
                where_conditions.append("DATE(r.data_inicio) = %s")
                params.append(data)
            
            where_clause = " AND ".join(where_conditions)
            
            # Verificar quais registros estão cancelados
            query_count = f"""
                SELECT COUNT(*)
                FROM registros_producao r
                LEFT JOIN operacoes_canceladas c ON r.registro_id = c.registro_id
                WHERE {where_clause} AND c.id IS NULL
            """
            cursor.execute(query_count, tuple(params))
            total_row = cursor.fetchone()
            total = int(total_row[0]) if total_row and total_row[0] is not None else 0
            
            query = f"""
                SELECT 
                    r.registro_id,
                    r.data_inicio,
                    r.hora_inicio,
                    r.quantidade,
                    -- Funcionário
                    f.funcionario_id as f_id,
                    f.nome as f_nome,
                    f.matricula as f_matricula,
                    -- Posto
                    p.posto_id as p_id,
                    p.nome as p_nome,
                    -- Modelo
                    m.modelo_id as m_id,
                    m.nome as m_nome,
                    -- Operação
                    o.operacao_id as o_id,
                    o.codigo_operacao as o_codigo,
                    {operacao_nome_select} as o_nome,
                    -- Verificar se está cancelado
                    c.id as cancelado_id
                FROM registros_producao r
                LEFT JOIN funcionarios f ON r.funcionario_id = f.funcionario_id
                LEFT JOIN postos p ON r.posto_id = p.posto_id
                LEFT JOIN modelos m ON r.modelo_id = m.modelo_id
                LEFT JOIN operacoes o ON r.operacao_id = o.operacao_id
                LEFT JOIN operacoes_canceladas c ON r.registro_id = c.registro_id
                WHERE {where_clause} AND c.id IS NULL
                ORDER BY r.registro_id DESC
                LIMIT %s OFFSET %s
            """
            params.extend([limit, offset])
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            
            operacoes_formatadas = []
            
            for row in rows:
                # Formatar data de início
                data_inicio_formatada = None
                hora_inicio_formatada = None
                if row[1]:  # data_inicio
                    try:
                        if isinstance(row[1], str):
                            data_inicio_formatada = row[1][:10] if len(row[1]) >= 10 else row[1]
                        else:
                            data_inicio_formatada = str(row[1])[:10]
                    except:
                        data_inicio_formatada = str(row[1])[:10] if row[1] else None
                
                if row[2]:  # hora_inicio
                    try:
                        if isinstance(row[2], str):
                            hora_inicio_formatada = row[2][:5] if ':' in row[2] else row[2]
                        else:
                            hora_inicio_formatada = str(row[2])[:5]
                    except:
                        hora_inicio_formatada = str(row[2]) if row[2] else None
                
                operacao_formatada = {
                    "registro_id": row[0],
                    "data_inicio": data_inicio_formatada,
                    "hora_inicio": hora_inicio_formatada,
                    "quantidade": row[3] if len(row) > 3 else None,
                    "funcionario": {
                        "id": row[4] if len(row) > 4 else None,
                        "nome": row[5] if len(row) > 5 else None,
                        "matricula": row[6] if len(row) > 6 else None
                    } if row[4] else None,
                    "posto": {
                        "id": row[7] if len(row) > 7 else None,
                        "nome": row[8] if len(row) > 8 else None
                    } if row[7] else None,
                    "modelo": {
                        "id": row[9] if len(row) > 9 else None,
                        "nome": row[10] if len(row) > 10 else None
                    } if row[9] else None,
                    "operacao": {
                        "id": row[11] if len(row) > 11 else None,
                        "codigo": row[12] if len(row) > 12 else None,
                        "nome": row[13] if len(row) > 13 else None
                    } if row[11] else None,
                    "cancelado": False,
                    "fim": None
                }
                
                operacoes_formatadas.append(operacao_formatada)
            
            return {
                "operacoes": operacoes_formatadas,
                "total": total,
                "limit": limit,
                "offset": offset
            }
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        raise Exception(f"Erro ao listar operações iniciadas: {str(e)}")


def cancelar_operacao(
    registro_id: int,
    motivo: str,
    cancelado_por_usuario_id: Optional[int] = None
) -> Dict[str, Any]:
    """Cancela uma operação"""
    try:
        # Verificar se o registro existe e não está finalizado
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT registro_id, fim 
                FROM registros_producao 
                WHERE registro_id = %s
            """, (registro_id,))
            registro = cursor.fetchone()
            
            if not registro:
                raise Exception("Registro não encontrado")
            
            if registro[1]:  # fim não é None
                raise Exception("Operação já finalizada, não pode ser cancelada")
            
            # Verificar se já está cancelado
            cursor.execute("""
                SELECT id 
                FROM operacoes_canceladas 
                WHERE registro_id = %s
            """, (registro_id,))
            cancelamento_existente = cursor.fetchone()
            
            if cancelamento_existente:
                raise Exception("Operação já está cancelada")
            
        finally:
            cursor.close()
            conn.close()
        
        # Criar cancelamento
        cancelamento = CancelamentoOperacao(
            registro_id=registro_id,
            motivo=motivo,
            cancelado_por_usuario_id=cancelado_por_usuario_id
        )
        
        cancelamento = cancelamento.save()
        
        return {
            "id": cancelamento.cancelamento_id,
            "registro_id": cancelamento.registro_id,
            "motivo": cancelamento.motivo,
            "data_cancelamento": cancelamento.data_cancelamento
        }
        
    except Exception as e:
        raise Exception(f"Erro ao cancelar operação: {str(e)}")


def atualizar_comentario_cancelamento(
    registro_id: int,
    comentario: str
) -> Dict[str, Any]:
    """Atualiza o comentário de uma operação cancelada"""
    try:
        # Buscar cancelamento
        cancelamento = CancelamentoOperacao.buscar_por_registro_id(registro_id)
        
        if not cancelamento:
            raise Exception("Cancelamento não encontrado")
        
        # Atualizar comentário no registro (se a coluna existir)
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            # Verificar se a coluna comentarios existe
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'registros_producao'
                AND column_name = 'comentarios'
            """)
            tem_coluna_comentarios = cursor.fetchone() is not None
            
            if tem_coluna_comentarios:
                cursor.execute("""
                    UPDATE registros_producao 
                    SET comentarios = %s 
                    WHERE registro_id = %s
                """, (comentario, registro_id))
                conn.commit()
        finally:
            cursor.close()
            conn.close()
        
        return {
            "registro_id": registro_id,
            "comentario": comentario
        }
        
    except Exception as e:
        raise Exception(f"Erro ao atualizar comentário: {str(e)}")
