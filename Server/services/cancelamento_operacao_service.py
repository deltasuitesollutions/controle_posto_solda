"""
Service para gerenciar cancelamentos de operações
Contém a lógica de negócio para listar cancelamentos
"""
from typing import Dict, Any, Optional
from datetime import datetime, time
from Server.models.cancelamento_operacao_model import CancelamentoOperacao
from Server.models.cancelamento import CancelamentoOperacao as CancelamentoModel


def _formatar_hora(value: Any) -> Optional[str]:
    """
    Converte time object ou string para formato HH:MM
    
    Args:
        value: Valor que pode ser time object, string ou None
    
    Returns:
        String no formato HH:MM ou None
    """
    if value is None:
        return None
    if isinstance(value, time):
        return value.strftime('%H:%M')
    if isinstance(value, str):
        if ':' in value:
            if len(value) >= 8 and value.count(':') >= 2:
                return value[:5]
            if len(value) == 5 and value.count(':') == 1:
                return value
            # Tentar extrair HH:MM de strings mais longas
            try:
                # Se for formato HH:MM:SS, pegar apenas HH:MM
                if len(value) >= 5:
                    return value[:5]
            except:
                pass
    return str(value) if value else None


def _formatar_data_brasileira(data_str: str) -> str:
    """
    Formata data no formato brasileiro (DD/MM/YYYY)
    
    Args:
        data_str: String com data no formato ISO ou timestamp
    
    Returns:
        String formatada como DD/MM/YYYY
    """
    if not data_str:
        return ''
    
    try:
        # Tentar parsear diferentes formatos
        if 'T' in data_str:
            data_str = data_str.split('T')[0]
        elif ' ' in data_str:
            data_str = data_str.split(' ')[0]
        
        # Parsear data no formato YYYY-MM-DD
        data = datetime.strptime(data_str, '%Y-%m-%d')
        # Retornar no formato DD/MM/YYYY
        return data.strftime('%d/%m/%Y')
    except Exception:
        # Se não conseguir formatar, retornar a string original
        return data_str


def listar_cancelamentos(
    limit: int = 100, 
    offset: int = 0, 
    data: Optional[str] = None
) -> Dict[str, Any]:
    """
    Lista cancelamentos da tabela operacoes_canceladas com dados relacionados
    Busca informações através do registro_id que referencia registros_producao
    
    Args:
        limit: Limite de registros por página
        offset: Offset para paginação
        data: Filtro por data no formato YYYY-MM-DD (opcional)
    
    Returns:
        Dicionário com lista de cancelamentos e informações de paginação
    """
    try:
        # Buscar cancelamentos com relacionamentos do model
        rows = CancelamentoOperacao.listar_com_relacionamentos(
            limit=limit, 
            offset=offset, 
            data=data
        )
        total = CancelamentoOperacao.contar(data=data)
        
        # Formatar cancelamentos (regra de negócio)
        cancelamentos_formatados = []
        for row in rows:
            # Formatar data de cancelamento no formato brasileiro (DD/MM/YYYY)
            data_cancelamento = _formatar_data_brasileira(str(row[3]) if row[3] else '')
            
            # Extrair funcionario_nome e operacao_nome
            # row[4] = funcionario_nome, row[5] = operacao_nome, row[6] = hora_inicio
            funcionario_nome = row[4] if len(row) > 4 and row[4] else 'N/A'
            operacao_nome = row[5] if len(row) > 5 and row[5] else 'N/A'
            # hora_inicio já vem como string da query (TO_CHAR), mas vamos garantir formatação
            hora_inicio = row[6] if len(row) > 6 and row[6] else None
            
            # Se ainda for N/A, pode ser que as colunas não existam ou estejam NULL
            # Tentar usar os dados salvos diretamente se disponíveis
            if funcionario_nome == 'N/A' or not funcionario_nome:
                funcionario_nome = 'N/A'
            if operacao_nome == 'N/A' or not operacao_nome:
                operacao_nome = 'N/A'
            
            cancelamento_formatado = {
                "id": row[0],
                "registro_id": row[1],
                "motivo": row[2] if row[2] else '',
                "data_cancelamento": data_cancelamento,
                "funcionario_nome": funcionario_nome,
                "operacao_nome": operacao_nome,
                "hora_inicio": hora_inicio,
                "status": "Cancelado"
            }
            cancelamentos_formatados.append(cancelamento_formatado)
        
        return {
            "cancelamentos": cancelamentos_formatados,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise Exception(f"Erro ao listar cancelamentos: {str(e)}")


def criar_cancelamento(
    registro_id: int,
    motivo: str,
    cancelado_por_usuario_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Cria um novo cancelamento de operação e fecha o registro de produção
    
    Args:
        registro_id: ID do registro de produção a ser cancelado
        motivo: Motivo do cancelamento
        cancelado_por_usuario_id: ID do usuário que está cancelando (opcional)
    
    Returns:
        Dicionário com resultado da operação
    """
    try:
        # Validação de negócio
        if not registro_id:
            raise Exception("Registro ID é obrigatório")
        
        # Motivo pode ser vazio - será preenchido pelo admin depois
        # Se for None ou vazio, usar string vazia
        if motivo is None:
            motivo = ''
        else:
            motivo = str(motivo).strip()
        
        # Verificar se já existe cancelamento para este registro
        cancelamento_existente = CancelamentoModel.buscar_por_registro_id(registro_id)
        if cancelamento_existente:
            raise Exception("Já existe um cancelamento para este registro")
        
        # Buscar todos os dados do registro usando uma query SQL com JOINs
        # Isso garante que pegamos todos os dados antes de deletar
        from Server.models.database import DatabaseConnection
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            # Verificar se as colunas existem na tabela operacoes_canceladas
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'operacoes_canceladas'
                AND column_name IN ('funcionario_nome', 'operacao_nome')
            """)
            colunas_existentes = [row[0] for row in cursor.fetchall()]
            tem_funcionario_nome = 'funcionario_nome' in colunas_existentes
            tem_operacao_nome = 'operacao_nome' in colunas_existentes
            
            if not tem_funcionario_nome or not tem_operacao_nome:
                raise Exception("Colunas funcionario_nome ou operacao_nome não existem na tabela operacoes_canceladas. Execute a migração migrate_add_dados_cancelamentos.py")
            
            # Verificar se a coluna nome existe na tabela operacoes
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'operacoes'
                AND column_name = 'nome'
            """)
            tem_coluna_nome_operacao = cursor.fetchone() is not None
            operacao_nome_select = "COALESCE(o.nome, o.codigo_operacao)" if tem_coluna_nome_operacao else "o.codigo_operacao"
            
            query_registro = f"""
                SELECT 
                    r.registro_id,
                    r.posto_id,
                    r.funcionario_id,
                    r.operacao_id,
                    r.modelo_id,
                    r.peca_id,
                    r.sublinha_id,
                    r.data_inicio,
                    r.hora_inicio,
                    r.inicio,
                    r.fim,
                    r.quantidade,
                    r.codigo_producao,
                    r.comentarios,
                    f.nome as funcionario_nome,
                    f.matricula as funcionario_matricula,
                    p.nome as posto_nome,
                    m.nome as modelo_nome,
                    m.nome as modelo_codigo,
                    o.codigo_operacao as operacao_codigo,
                    {operacao_nome_select} as operacao_nome
                FROM registros_producao r
                LEFT JOIN funcionarios f ON r.funcionario_id = f.funcionario_id
                LEFT JOIN postos p ON r.posto_id = p.posto_id
                LEFT JOIN modelos m ON r.modelo_id = m.modelo_id
                LEFT JOIN operacoes o ON r.operacao_id = o.operacao_id
                WHERE r.registro_id = %s
            """
            cursor.execute(query_registro, (registro_id,))
            row = cursor.fetchone()
            
            if not row:
                raise Exception(f"Registro de produção {registro_id} não encontrado")
            
            # Extrair dados do registro
            (reg_id, posto_id, funcionario_id, operacao_id, modelo_id, peca_id, 
             sublinha_id, data_inicio, hora_inicio, inicio, fim, quantidade,
             codigo_producao, comentarios, funcionario_nome, funcionario_matricula,
             posto_nome, modelo_nome, modelo_codigo, operacao_codigo, operacao_nome) = row
            
            # Garantir que os valores não sejam None (usar string vazia ou manter None para campos opcionais)
            funcionario_nome = funcionario_nome if funcionario_nome else None
            funcionario_matricula = funcionario_matricula if funcionario_matricula else None
            posto_nome = posto_nome if posto_nome else None
            modelo_nome = modelo_nome if modelo_nome else None
            modelo_codigo = modelo_codigo if modelo_codigo else None
            operacao_codigo = operacao_codigo if operacao_codigo else None
            operacao_nome = operacao_nome if operacao_nome else None
            
            # Debug: verificar dados extraídos
            print(f"DEBUG - Dados extraídos do registro {registro_id}:")
            print(f"  Funcionário: {funcionario_nome} (ID: {funcionario_id})")
            print(f"  Operação: {operacao_nome} (ID: {operacao_id})")
            print(f"  Posto: {posto_nome} (ID: {posto_id})")
            print(f"  Modelo: {modelo_nome} (ID: {modelo_id})")
            
            # Inserir cancelamento com os dados do registro (apenas colunas que existem na tabela)
            query_insert = """
                INSERT INTO operacoes_canceladas (
                    registro_id, motivo, cancelado_por_usuario_id,
                    funcionario_nome, operacao_codigo, operacao_nome, hora_inicio
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, data_cancelamento
            """
            
            cursor.execute(query_insert, (
                registro_id,
                motivo,
                cancelado_por_usuario_id,
                funcionario_nome,
                operacao_codigo,
                operacao_nome,
                inicio  # usar o timestamp completo de inicio como hora_inicio
            ))
            result = cursor.fetchone()
            cancelamento_id = result[0] if result else None
            data_cancelamento = str(result[1]) if result and result[1] else None
            
            conn.commit()
            
            # Deletar o registro da tabela registros_producao
            query_delete = "DELETE FROM registros_producao WHERE registro_id = %s"
            cursor.execute(query_delete, (registro_id,))
            if cursor.rowcount == 0:
                raise Exception(f"Erro ao deletar registro de produção {registro_id}")
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise Exception(f"Erro ao criar cancelamento: {str(e)}")
        finally:
            cursor.close()
            conn.close()
        
        return {
            "sucesso": True,
            "mensagem": "Cancelamento criado e registro removido com sucesso",
            "cancelamento_id": cancelamento_id,
            "registro_id": registro_id
        }
    except Exception as e:
        raise Exception(f"Erro ao criar cancelamento: {str(e)}")


def atualizar_motivo(cancelamento_id: int, motivo: str) -> Dict[str, Any]:
    """
    Atualiza o motivo de um cancelamento
    
    Args:
        cancelamento_id: ID do cancelamento
        motivo: Novo motivo do cancelamento
    
    Returns:
        Dicionário com resultado da operação
    """
    try:
        # Validação de negócio
        if not motivo or not motivo.strip():
            raise Exception("Motivo não pode estar vazio")
        
        # Atualizar no model
        sucesso = CancelamentoOperacao.atualizar_motivo(cancelamento_id, motivo.strip())
        
        if not sucesso:
            raise Exception("Cancelamento não encontrado")
        
        return {
            "sucesso": True,
            "mensagem": "Motivo atualizado com sucesso"
        }
    except Exception as e:
        raise Exception(f"Erro ao atualizar motivo: {str(e)}")


def excluir_cancelamento(cancelamento_id: int) -> Dict[str, Any]:
    """
    Exclui um cancelamento pelo ID
    
    Args:
        cancelamento_id: ID do cancelamento a ser excluído
    
    Returns:
        Dicionário com resultado da operação
    """
    try:
        # Validação de negócio
        if not cancelamento_id:
            raise Exception("ID do cancelamento é obrigatório")
        
        # Excluir no model
        sucesso = CancelamentoOperacao.excluir(cancelamento_id)
        
        if not sucesso:
            raise Exception("Cancelamento não encontrado")
        
        return {
            "sucesso": True,
            "mensagem": "Cancelamento excluído com sucesso"
        }
    except Exception as e:
        raise Exception(f"Erro ao excluir cancelamento: {str(e)}")