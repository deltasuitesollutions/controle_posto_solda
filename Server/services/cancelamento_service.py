"""
Service para gerenciar cancelamentos de operações
"""
from typing import Dict, Any, List, Optional
from Server.models import CancelamentoOperacao, ProducaoRegistro
from Server.models.database import DatabaseConnection


def cancelar_operacao(
    registro_id: int,
    motivo: str,
    cancelado_por_usuario_id: Optional[int] = None
) -> Dict[str, Any]:
    """Cancela uma operação (registro de produção) e deleta o registro"""
    if not motivo or not motivo.strip():
        raise Exception("Motivo do cancelamento é obrigatório")
    
    # Verificar se o registro existe
    registro = ProducaoRegistro.buscar_por_id(registro_id)
    if not registro:
        raise Exception(f"Registro de produção com ID {registro_id} não encontrado")
    
    # Verificar se já foi cancelado
    cancelamento_existente = CancelamentoOperacao.buscar_por_registro_id(registro_id)
    if cancelamento_existente:
        raise Exception("Esta operação já foi cancelada")
    
    # Buscar informações completas do registro antes de deletar
    from Server.models.funcionario import Funcionario
    from Server.models.posto import Posto
    from Server.models.modelo import Modelo
    from Server.models.operacao import Operacao
    
    funcionario = Funcionario.buscar_por_id(registro.funcionario_id) if registro.funcionario_id else None
    posto = Posto.buscar_por_id(registro.posto_id) if registro.posto_id else None
    modelo = Modelo.buscar_por_id(registro.modelo_id) if registro.modelo_id else None
    operacao = Operacao.buscar_por_id(registro.operacao_id) if registro.operacao_id else None
    
    # Verificar se a tabela operacoes_canceladas existe
    if not DatabaseConnection.table_exists('operacoes_canceladas'):
        raise Exception("Tabela 'operacoes_canceladas' não existe. Execute as migrações necessárias.")
    
    # Criar cancelamento ANTES de deletar o registro, salvando TODOS os dados
    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor()
    
    try:
        # Preparar dados para inserção
        dados_cancelamento = (
            registro_id, 
            motivo.strip(), 
            cancelado_por_usuario_id,
            registro.posto_id, 
            registro.funcionario_id, 
            registro.operacao_id,
            registro.modelo_id, 
            registro.peca_id, 
            registro.sublinha_id,
            registro.data_inicio, 
            registro.hora_inicio, 
            registro.fim,
            registro.quantidade, 
            registro.codigo_producao, 
            registro.comentarios, 
            registro.inicio,
            funcionario.nome if funcionario else None,
            funcionario.matricula if funcionario else None,
            posto.nome if posto else None,
            modelo.descricao if modelo else None,  # descricao é o nome do modelo
            modelo.codigo if modelo else None,
            operacao.codigo_operacao if operacao else None,
            operacao.nome if operacao else None
        )
        
        # Verificar quais colunas existem na tabela para fazer INSERT adaptativo
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'operacoes_canceladas'
            ORDER BY ordinal_position
        """)
        colunas_existentes = [row[0] for row in cursor.fetchall()]
        
        # Colunas básicas obrigatórias
        colunas_basicas = ['registro_id', 'motivo', 'data_cancelamento']
        if not all(col in colunas_existentes for col in colunas_basicas):
            raise Exception(f"Tabela 'operacoes_canceladas' não tem as colunas básicas necessárias: {colunas_basicas}")
        
        # Construir query INSERT adaptativa baseada nas colunas existentes
        colunas_para_inserir = ['registro_id', 'motivo', 'data_cancelamento']
        valores_para_inserir = [registro_id, motivo.strip(), 'CURRENT_TIMESTAMP']
        
        # Adicionar colunas opcionais se existirem
        colunas_opcionais = [
            ('cancelado_por_usuario_id', cancelado_por_usuario_id),
            ('posto_id', registro.posto_id),
            ('funcionario_id', registro.funcionario_id),
            ('operacao_id', registro.operacao_id),
            ('modelo_id', registro.modelo_id),
            ('peca_id', registro.peca_id),
            ('sublinha_id', registro.sublinha_id),
            ('data_inicio', registro.data_inicio),
            ('hora_inicio', registro.hora_inicio),
            ('fim', registro.fim),
            ('quantidade', registro.quantidade),
            ('codigo_producao', registro.codigo_producao),
            ('comentarios', registro.comentarios),
            ('inicio', registro.inicio),
            ('funcionario_nome', funcionario.nome if funcionario else None),
            ('funcionario_matricula', funcionario.matricula if funcionario else None),
            ('posto_nome', posto.nome if posto else None),
            ('modelo_nome', modelo.descricao if modelo else None),
            ('modelo_codigo', modelo.codigo if modelo else None),
            ('operacao_codigo', operacao.codigo_operacao if operacao else None),
            ('operacao_nome', operacao.nome if operacao else None)
        ]
        
        for coluna, valor in colunas_opcionais:
            if coluna in colunas_existentes:
                colunas_para_inserir.append(coluna)
                if coluna == 'data_cancelamento':
                    valores_para_inserir.append('CURRENT_TIMESTAMP')
                else:
                    valores_para_inserir.append(valor)
        
        # Construir query INSERT
        placeholders = []
        valores_finais = []
        for i, valor in enumerate(valores_para_inserir):
            if valor == 'CURRENT_TIMESTAMP':
                placeholders.append('CURRENT_TIMESTAMP')
            else:
                placeholders.append('%s')
                valores_finais.append(valor)
        
        query_cancelamento = f"""
            INSERT INTO operacoes_canceladas ({', '.join(colunas_para_inserir)})
            VALUES ({', '.join(placeholders)})
            RETURNING id, data_cancelamento
        """
        
        # Executar inserção
        cursor.execute(query_cancelamento, tuple(valores_finais))
        result = cursor.fetchone()
        
        if not result:
            raise Exception("Falha ao inserir cancelamento na tabela operacoes_canceladas")
        
        cancelamento_id = result[0] if result else None
        data_cancelamento = str(result[1]) if result and result[1] else None
        
        # Verificar se o cancelamento foi realmente inserido
        cursor.execute("SELECT COUNT(*) FROM operacoes_canceladas WHERE id = %s", (cancelamento_id,))
        count = cursor.fetchone()[0]
        if count == 0:
            raise Exception("Cancelamento não foi inserido na tabela operacoes_canceladas")
        
        # IMPORTANTE: Remover a foreign key temporariamente se existir para evitar CASCADE
        # Ou garantir que a foreign key não cause problemas
        # Primeiro, verificar se há foreign key com CASCADE
        cursor.execute("""
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'operacoes_canceladas'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'registro_id'
        """)
        fk_constraint = cursor.fetchone()
        
        fk_removida = False
        fk_name = None
        if fk_constraint:
            fk_name = fk_constraint[0]
            # Remover temporariamente a foreign key para evitar CASCADE
            try:
                cursor.execute(f"ALTER TABLE operacoes_canceladas DROP CONSTRAINT IF EXISTS {fk_name}")
                fk_removida = True
                print(f"Foreign key '{fk_name}' removida temporariamente para evitar CASCADE")
            except Exception as e:
                print(f"Aviso: Não foi possível remover foreign key: {e}")
        
        # Agora deletar o registro de produção APENAS se o cancelamento foi inserido com sucesso
        query_delete = "DELETE FROM registros_producao WHERE registro_id = %s"
        cursor.execute(query_delete, (registro_id,))
        
        # Verificar se o cancelamento ainda existe após deletar o registro
        cursor.execute("SELECT COUNT(*) FROM operacoes_canceladas WHERE id = %s", (cancelamento_id,))
        count_apos_delete = cursor.fetchone()[0]
        if count_apos_delete == 0:
            raise Exception("Cancelamento foi deletado após remover o registro. Verifique a foreign key.")
        
        # Se removemos a foreign key, não vamos recriá-la (deixar sem foreign key é mais seguro)
        # Pois o registro_id é apenas uma referência histórica
        
        conn.commit()
        
        return {
            "id": cancelamento_id,
            "registro_id": registro_id,
            "motivo": motivo.strip(),
            "cancelado_por_usuario_id": cancelado_por_usuario_id,
            "data_cancelamento": data_cancelamento
        }
    except Exception as e:
        conn.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao cancelar operação: {str(e)}")
        print(f"Detalhes: {error_details}")
        raise Exception(f"Erro ao cancelar operação: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def listar_cancelamentos(
    limit: int = 100,
    offset: int = 0,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None
) -> Dict[str, Any]:
    """Lista cancelamentos com informações completas"""
    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor()
    
    try:
        # Buscar cancelamentos diretamente da tabela com todos os dados
        query = """
            SELECT 
                c.id,
                c.registro_id,
                c.motivo,
                c.cancelado_por_usuario_id,
                c.data_cancelamento,
                c.posto_id,
                c.funcionario_id,
                c.operacao_id,
                c.modelo_id,
                c.peca_id,
                c.sublinha_id,
                c.data_inicio,
                c.hora_inicio,
                c.fim,
                c.quantidade,
                c.codigo_producao,
                c.comentarios,
                c.inicio,
                c.funcionario_nome,
                c.funcionario_matricula,
                c.posto_nome,
                c.modelo_nome,
                c.modelo_codigo,
                c.operacao_codigo,
                c.operacao_nome,
                u.nome as usuario_cancelou_nome,
                u.username as usuario_cancelou_username
            FROM operacoes_canceladas c
            LEFT JOIN usuarios u ON c.cancelado_por_usuario_id = u.id
            WHERE 1=1
        """
        params = []
        
        if data_inicio:
            query += " AND DATE(c.data_cancelamento) >= %s"
            params.append(data_inicio)
        if data_fim:
            query += " AND DATE(c.data_cancelamento) <= %s"
            params.append(data_fim)
        
        # Contar total
        count_query = "SELECT COUNT(*) FROM operacoes_canceladas WHERE 1=1"
        count_params = []
        if data_inicio:
            count_query += " AND DATE(data_cancelamento) >= %s"
            count_params.append(data_inicio)
        if data_fim:
            count_query += " AND DATE(data_cancelamento) <= %s"
            count_params.append(data_fim)
        
        cursor.execute(count_query, tuple(count_params))
        count_result = cursor.fetchone()
        total = int(count_result[0]) if count_result and count_result[0] is not None else 0
        
        # Buscar cancelamentos
        query += " ORDER BY c.data_cancelamento DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        
        cancelamentos_completos = []
        for row in rows:
            cancelamento_dict = {
                "id": row[0],
                "registro_id": row[1],
                "motivo": row[2],
                "cancelado_por_usuario_id": row[3],
                "data_cancelamento": str(row[4]) if row[4] else None,
                "funcionario": {
                    "nome": row[19] if row[19] else None,
                    "matricula": row[20] if row[20] else None
                } if row[19] or row[20] else None,
                "posto": {
                    "nome": row[22] if row[22] else None
                } if row[22] else None,
                "modelo": {
                    "nome": row[23] if row[23] else None,
                    "codigo": row[24] if row[24] else None
                } if row[23] or row[24] else None,
                "operacao": {
                    "codigo": row[25] if row[25] else None,
                    "nome": row[26] if row[26] else None
                } if row[25] or row[26] else None,
                "usuario_cancelou": {
                    "nome": row[27] if row[27] else None,
                    "username": row[28] if row[28] else None
                } if row[27] or row[28] else None,
                "data_inicio": str(row[12]) if row[12] else None,
                "hora_inicio": str(row[13]) if row[13] else None,
                "fim": str(row[14]) if row[14] else None,
                "quantidade": row[15],
                "codigo_producao": row[16],
                "comentarios": row[17]
            }
            cancelamentos_completos.append(cancelamento_dict)
        
        return {
            "cancelamentos": cancelamentos_completos,
            "total": total
        }
    except Exception as e:
        raise Exception(f"Erro ao listar cancelamentos: {str(e)}")
    finally:
        cursor.close()
        conn.close()


def listar_operacoes_iniciadas_por_dia(
    data: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Lista operações iniciadas por dia que podem ser canceladas ou foram canceladas.
    
    Retorna apenas:
    - Operações iniciadas que ainda podem ser canceladas (não finalizadas e não canceladas)
    - Operações que foram canceladas (independente de terem sido finalizadas ou não)
    """
    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor()
    
    try:
        # Preparar filtro de data
        if data:
            data_filtro = data
        else:
            from datetime import datetime
            data_filtro = datetime.now().strftime('%Y-%m-%d')
        
        # Query para buscar apenas:
        # 1. Registros que ainda existem, não foram finalizados e não foram cancelados (podem ser cancelados)
        # 2. Todos os cancelamentos (independente de terem sido finalizados ou não)
        # Usando UNION para combinar ambos
        query = """
            -- Registros que ainda existem, não foram finalizados e não foram cancelados (podem ser cancelados)
            SELECT 
                r.registro_id,
                CAST(r.data_inicio AS TEXT) as data_inicio,
                CAST(r.hora_inicio AS TEXT) as hora_inicio,
                CAST(r.fim AS TEXT) as fim,
                r.quantidade,
                r.codigo_producao,
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
                m.nome as m_codigo,
                -- Operação
                o.operacao_id as o_id,
                o.codigo_operacao as o_codigo,
                o.nome as o_nome,
                -- Verificar se foi cancelado
                CASE WHEN c.id IS NOT NULL THEN true ELSE false END as cancelado,
                c.motivo as motivo_cancelamento,
                CAST(c.data_cancelamento AS TEXT) as data_cancelamento,
                u.nome as usuario_cancelou_nome,
                u.username as usuario_cancelou_username
            FROM registros_producao r
            LEFT JOIN funcionarios f ON r.funcionario_id = f.funcionario_id
            LEFT JOIN postos p ON r.posto_id = p.posto_id
            LEFT JOIN modelos m ON r.modelo_id = m.modelo_id
            LEFT JOIN operacoes o ON r.operacao_id = o.operacao_id
            LEFT JOIN operacoes_canceladas c ON r.registro_id = c.registro_id
            LEFT JOIN usuarios u ON c.cancelado_por_usuario_id = u.id
            WHERE r.data_inicio = %s
            AND r.fim IS NULL  -- Apenas operações não finalizadas
            AND c.id IS NULL    -- Apenas operações não canceladas
            
            UNION ALL
            
            -- Todos os cancelamentos (registros deletados após cancelamento)
            SELECT 
                c.registro_id,
                CAST(c.data_inicio AS TEXT) as data_inicio,
                CAST(c.hora_inicio AS TEXT) as hora_inicio,
                CAST(c.fim AS TEXT) as fim,
                c.quantidade,
                c.codigo_producao,
                -- Funcionário (dados salvos no cancelamento)
                c.funcionario_id as f_id,
                c.funcionario_nome as f_nome,
                c.funcionario_matricula as f_matricula,
                -- Posto (dados salvos no cancelamento)
                c.posto_id as p_id,
                c.posto_nome as p_nome,
                -- Modelo (dados salvos no cancelamento)
                c.modelo_id as m_id,
                c.modelo_nome as m_nome,
                c.modelo_codigo as m_codigo,
                -- Operação (dados salvos no cancelamento)
                c.operacao_id as o_id,
                c.operacao_codigo as o_codigo,
                c.operacao_nome as o_nome,
                -- Sempre cancelado
                true as cancelado,
                c.motivo as motivo_cancelamento,
                CAST(c.data_cancelamento AS TEXT) as data_cancelamento,
                u.nome as usuario_cancelou_nome,
                u.username as usuario_cancelou_username
            FROM operacoes_canceladas c
            LEFT JOIN usuarios u ON c.cancelado_por_usuario_id = u.id
            WHERE NOT EXISTS (
                SELECT 1 FROM registros_producao r WHERE r.registro_id = c.registro_id
            )
            AND (c.data_inicio::date = %s::date OR DATE(c.data_cancelamento) = %s::date)
            
            UNION ALL
            
            -- Cancelamentos de registros que ainda existem (caso raro, mas possível)
            SELECT 
                r.registro_id,
                CAST(r.data_inicio AS TEXT) as data_inicio,
                CAST(r.hora_inicio AS TEXT) as hora_inicio,
                CAST(r.fim AS TEXT) as fim,
                r.quantidade,
                r.codigo_producao,
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
                m.nome as m_codigo,
                -- Operação
                o.operacao_id as o_id,
                o.codigo_operacao as o_codigo,
                o.nome as o_nome,
                -- Sempre cancelado
                true as cancelado,
                c.motivo as motivo_cancelamento,
                CAST(c.data_cancelamento AS TEXT) as data_cancelamento,
                u.nome as usuario_cancelou_nome,
                u.username as usuario_cancelou_username
            FROM registros_producao r
            INNER JOIN operacoes_canceladas c ON r.registro_id = c.registro_id
            LEFT JOIN funcionarios f ON r.funcionario_id = f.funcionario_id
            LEFT JOIN postos p ON r.posto_id = p.posto_id
            LEFT JOIN modelos m ON r.modelo_id = m.modelo_id
            LEFT JOIN operacoes o ON r.operacao_id = o.operacao_id
            LEFT JOIN usuarios u ON c.cancelado_por_usuario_id = u.id
            WHERE r.data_inicio = %s
            AND c.id IS NOT NULL  -- Apenas registros cancelados
            
            ORDER BY data_inicio DESC NULLS LAST, hora_inicio DESC NULLS LAST, data_cancelamento DESC NULLS LAST
            LIMIT %s OFFSET %s
        """
        
        params = [data_filtro, data_filtro, data_filtro, data_filtro, limit, offset]
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        
        # Contar total (registros não finalizados e não cancelados + todos os cancelamentos)
        count_query = """
            SELECT 
                -- Registros não finalizados e não cancelados (podem ser cancelados)
                (SELECT COUNT(*) FROM registros_producao r
                 LEFT JOIN operacoes_canceladas c ON r.registro_id = c.registro_id
                 WHERE r.data_inicio = %s
                 AND r.fim IS NULL
                 AND c.id IS NULL) +
                -- Cancelamentos de registros deletados
                (SELECT COUNT(*) FROM operacoes_canceladas c 
                 WHERE NOT EXISTS (SELECT 1 FROM registros_producao r WHERE r.registro_id = c.registro_id)
                 AND (c.data_inicio::date = %s::date OR DATE(c.data_cancelamento) = %s::date)) +
                -- Cancelamentos de registros que ainda existem
                (SELECT COUNT(*) FROM registros_producao r
                 INNER JOIN operacoes_canceladas c ON r.registro_id = c.registro_id
                 WHERE r.data_inicio = %s
                 AND c.id IS NOT NULL)
        """
        cursor.execute(count_query, (data_filtro, data_filtro, data_filtro, data_filtro))
        count_result = cursor.fetchone()
        total = int(count_result[0]) if count_result and count_result[0] is not None else 0
        
        operacoes = []
        for row in rows:
            operacoes.append({
                "registro_id": row[0],
                "data_inicio": str(row[1]) if row[1] else None,
                "hora_inicio": str(row[2]) if row[2] else None,
                "fim": str(row[3]) if row[3] else None,
                "quantidade": row[4],
                "codigo_producao": row[5],
                "funcionario": {
                    "id": row[6],
                    "nome": row[7],
                    "matricula": row[8]
                } if row[6] else None,
                "posto": {
                    "id": row[9],
                    "nome": row[10]
                } if row[9] else None,
                "modelo": {
                    "id": row[11],
                    "nome": row[12],
                    "codigo": row[13]
                } if row[11] else None,
                "operacao": {
                    "id": row[14],
                    "codigo": row[15],
                    "nome": row[16]
                } if row[14] else None,
                "cancelado": row[17] if row[17] is not None else False,
                "motivo_cancelamento": row[18],
                "data_cancelamento": str(row[19]) if row[19] else None,
                "usuario_cancelou": {
                    "nome": row[20],
                    "username": row[21]
                } if row[20] else None
            })
        
        return {
            "operacoes": operacoes,
            "total": total
        }
    except Exception as e:
        raise Exception(f"Erro ao listar operações iniciadas: {str(e)}")
    finally:
        cursor.close()
        conn.close()

