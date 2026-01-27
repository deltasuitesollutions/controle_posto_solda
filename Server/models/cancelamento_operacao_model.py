from typing import Optional, List, Tuple, Dict, Any
from Server.models.database import DatabaseConnection


class CancelamentoOperacao:
    """Modelo que representa um cancelamento de operação"""
    
    def __init__(
        self,
        id: Optional[int] = None,
        registro_id: Optional[int] = None,
        motivo: Optional[str] = None,
        cancelado_por_usuario_id: Optional[int] = None,
        data_cancelamento: Optional[str] = None
    ) -> None:
        self.id = id
        self.registro_id = registro_id
        self.motivo = motivo
        self.cancelado_por_usuario_id = cancelado_por_usuario_id
        self.data_cancelamento = data_cancelamento
    
    @staticmethod
    def listar_todos(limit: int = 100, offset: int = 0) -> List['CancelamentoOperacao']:
        """Lista todos os cancelamentos da tabela operacoes_canceladas"""
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                SELECT id, registro_id, motivo, cancelado_por_usuario_id, data_cancelamento
                FROM operacoes_canceladas
                ORDER BY data_cancelamento DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))
            rows = cursor.fetchall()
            
            cancelamentos = []
            for row in rows:
                cancelamento = CancelamentoOperacao(
                    id=row[0],
                    registro_id=row[1],
                    motivo=row[2],
                    cancelado_por_usuario_id=row[3],
                    data_cancelamento=str(row[4]) if row[4] else None
                )
                cancelamentos.append(cancelamento)
            
            return cancelamentos
        except Exception as e:
            raise Exception(f"Erro ao listar cancelamentos: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def listar_com_relacionamentos(
        limit: int = 100, 
        offset: int = 0, 
        data: Optional[str] = None
    ) -> List[Tuple[Any, ...]]:
        """
        Lista cancelamentos com dados relacionados (funcionário e operação)
        Retorna tuplas com: (id, registro_id, motivo, data_cancelamento, funcionario_nome, operacao_nome, hora_inicio)
        
        Args:
            limit: Limite de registros
            offset: Offset para paginação
            data: Filtro por data no formato YYYY-MM-DD (opcional)
        """
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            # Construir WHERE clause para filtro de data
            where_clause = ""
            params = []
            
            if data:
                where_clause = "WHERE DATE(c.data_cancelamento) = %s"
                params.append(data)
            
            # Query usando dados salvos diretamente na tabela operacoes_canceladas
            # Não precisa mais fazer JOIN com registros_producao pois os dados já estão salvos
            # Converter hora_inicio para string usando TO_CHAR para evitar problemas de serialização JSON
            query = f"""
                SELECT 
                    c.id,
                    c.registro_id,
                    c.motivo,
                    c.data_cancelamento,
                    COALESCE(c.funcionario_nome, 'N/A') as funcionario_nome,
                    COALESCE(c.operacao_nome, c.operacao_codigo, 'N/A') as operacao_nome,
                    CASE 
                        WHEN c.hora_inicio IS NOT NULL THEN TO_CHAR(c.hora_inicio, 'HH24:MI')
                        ELSE NULL
                    END as hora_inicio
                FROM operacoes_canceladas c
                {where_clause}
                ORDER BY c.data_cancelamento DESC
                LIMIT %s OFFSET %s
            """
            params.extend([limit, offset])
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
        except Exception as e:
            raise Exception(f"Erro ao listar cancelamentos com relacionamentos: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def contar(data: Optional[str] = None) -> int:
        """
        Conta o total de cancelamentos
        
        Args:
            data: Filtro por data no formato YYYY-MM-DD (opcional)
        """
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            where_clause = ""
            params = []
            
            if data:
                where_clause = "WHERE DATE(data_cancelamento) = %s"
                params.append(data)
            
            query = f"SELECT COUNT(*) FROM operacoes_canceladas {where_clause}"
            cursor.execute(query, tuple(params) if params else None)
            result = cursor.fetchone()
            return int(result[0]) if result and result[0] is not None else 0
        except Exception as e:
            raise Exception(f"Erro ao contar cancelamentos: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def atualizar_motivo(cancelamento_id: int, motivo: str) -> bool:
        """
        Atualiza o motivo de um cancelamento
        
        Args:
            cancelamento_id: ID do cancelamento
            motivo: Novo motivo do cancelamento
        
        Returns:
            True se atualizado com sucesso, False caso contrário
        """
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                UPDATE operacoes_canceladas 
                SET motivo = %s
                WHERE id = %s
            """
            cursor.execute(query, (motivo, cancelamento_id))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            raise Exception(f"Erro ao atualizar motivo: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    def to_dict(self) -> dict:
        """Converte o objeto para dicionário"""
        return {
            "id": self.id,
            "registro_id": self.registro_id,
            "motivo": self.motivo,
            "cancelado_por_usuario_id": self.cancelado_por_usuario_id,
            "data_cancelamento": self.data_cancelamento
        }
