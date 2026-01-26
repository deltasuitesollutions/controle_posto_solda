from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from Server.models.database import DatabaseConnection


class RegistroProducao:
    """Model para operações com registros de produção"""
    
    @staticmethod
    def verificar_tabela_existe() -> bool:
        """Verifica se a tabela registros_producao existe"""
        return DatabaseConnection.table_exists('registros_producao')
    
    @staticmethod
    def verificar_coluna_nome_operacao() -> bool:
        """Verifica se a coluna nome existe na tabela operacoes"""
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'operacoes'
                AND column_name = 'nome'
            """)
            
            return cursor.fetchone() is not None
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    @staticmethod
    def contar_registros(
        where_clause: str, 
        params: List[Any], 
        filtro_turno: bool = False
    ) -> int:
        """Conta o total de registros com base nos filtros"""
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            if filtro_turno:
                # Se houver filtro de turno, precisa do JOIN com funcionarios
                query = f"""
                    SELECT COUNT(*) 
                    FROM registros_producao r 
                    LEFT JOIN funcionarios f ON r.funcionario_id = f.funcionario_id 
                    WHERE {where_clause}
                """
            else:
                query = f"SELECT COUNT(*) FROM registros_producao r WHERE {where_clause}"
            
            cursor.execute(query, tuple(params))
            total_result = cursor.fetchone()
            return int(total_result[0]) if total_result and total_result[0] else 0
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    @staticmethod
    def buscar_registros_com_relacionamentos(
        where_clause: str, 
        params: List[Any], 
        limit: int, 
        offset: int,
        tem_coluna_nome_operacao: bool
    ) -> List[Tuple]:
        """Busca registros com todos os relacionamentos via JOINs"""
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
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
            
            # Adicionar limit e offset aos parâmetros
            params_extended = params.copy()
            params_extended.extend([limit, offset])
            
            cursor.execute(query, tuple(params_extended))
            return cursor.fetchall()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    @staticmethod
    def atualizar_comentario(registro_id: int, comentario: str) -> Dict[str, Any]:
        """Atualiza o comentário de um registro de produção"""
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            # Verificar se o registro existe
            cursor.execute(
                "SELECT registro_id FROM registros_producao WHERE registro_id = %s", 
                (registro_id,)
            )
            registro = cursor.fetchone()
            
            if not registro:
                raise ValueError(f"Registro com ID {registro_id} não encontrado")
            
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
            if conn:
                conn.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    @staticmethod
    def buscar_registro_por_id(registro_id: int) -> Optional[Dict[str, Any]]:
        """Busca um registro específico pelo ID"""
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT 
                    r.*,
                    f.nome as funcionario_nome,
                    f.matricula as funcionario_matricula,
                    f.turno as funcionario_turno,
                    p.nome as posto_nome,
                    p.toten_id as posto_toten_id,
                    m.nome as modelo_nome,
                    o.codigo_operacao as operacao_codigo,
                    pr.nome as produto_nome,
                    pc.codigo as peca_codigo,
                    pc.nome as peca_nome
                FROM registros_producao r
                LEFT JOIN funcionarios f ON r.funcionario_id = f.funcionario_id
                LEFT JOIN postos p ON r.posto_id = p.posto_id
                LEFT JOIN modelos m ON r.modelo_id = m.modelo_id
                LEFT JOIN operacoes o ON r.operacao_id = o.operacao_id
                LEFT JOIN produtos pr ON o.produto_id = pr.produto_id
                LEFT JOIN pecas pc ON r.peca_id = pc.peca_id
                WHERE r.registro_id = %s
            """
            
            cursor.execute(query, (registro_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            # Converter para dicionário
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, row))
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()