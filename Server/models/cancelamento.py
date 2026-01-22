"""
Modelo para a entidade Cancelamento de Operação
"""
from typing import Optional, List, Tuple, Any, Dict
from Server.models.database import DatabaseConnection


class CancelamentoOperacao:
    """Modelo que representa um cancelamento de operação"""
    
    def __init__(
        self,
        registro_id: int,
        motivo: str,
        cancelado_por_usuario_id: Optional[int] = None,
        cancelamento_id: Optional[int] = None,
        data_cancelamento: Optional[str] = None
    ) -> None:
        self.cancelamento_id = cancelamento_id
        self.registro_id = registro_id
        self.motivo = motivo
        self.cancelado_por_usuario_id = cancelado_por_usuario_id
        self.data_cancelamento = data_cancelamento
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'CancelamentoOperacao':
        """Cria um objeto CancelamentoOperacao a partir de uma linha do banco"""
        return CancelamentoOperacao(
            cancelamento_id=int(row[0]) if len(row) > 0 and row[0] is not None else None,
            registro_id=int(row[1]) if len(row) > 1 and row[1] is not None else 0,
            motivo=str(row[2]) if len(row) > 2 and row[2] is not None else '',
            cancelado_por_usuario_id=int(row[3]) if len(row) > 3 and row[3] is not None else None,
            data_cancelamento=str(row[4]) if len(row) > 4 and row[4] is not None else None
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        result = {
            "registro_id": self.registro_id,
            "motivo": self.motivo,
            "data_cancelamento": self.data_cancelamento
        }
        if self.cancelamento_id is not None:
            result["id"] = self.cancelamento_id
        if self.cancelado_por_usuario_id is not None:
            result["cancelado_por_usuario_id"] = self.cancelado_por_usuario_id
        return result
    
    def save(self) -> 'CancelamentoOperacao':
        """Salva o cancelamento no banco de dados"""
        if not DatabaseConnection.table_exists('operacoes_canceladas'):
            raise Exception("Tabela 'operacoes_canceladas' não existe")
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            if self.cancelamento_id:
                # Atualizar
                query = """
                    UPDATE operacoes_canceladas 
                    SET motivo = %s, cancelado_por_usuario_id = %s
                    WHERE id = %s
                """
                cursor.execute(query, (self.motivo, self.cancelado_por_usuario_id, self.cancelamento_id))
            else:
                # Inserir
                query = """
                    INSERT INTO operacoes_canceladas (registro_id, motivo, cancelado_por_usuario_id)
                    VALUES (%s, %s, %s)
                    RETURNING id, data_cancelamento
                """
                cursor.execute(query, (self.registro_id, self.motivo, self.cancelado_por_usuario_id))
                result = cursor.fetchone()
                if result:
                    self.cancelamento_id = result[0]
                    self.data_cancelamento = str(result[1]) if result[1] else None
            
            conn.commit()
            return self
        except Exception as e:
            conn.rollback()
            raise Exception(f"Erro ao salvar cancelamento: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def buscar_por_registro_id(registro_id: int) -> Optional['CancelamentoOperacao']:
        """Busca cancelamento por ID do registro"""
        if not DatabaseConnection.table_exists('operacoes_canceladas'):
            return None
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                SELECT id, registro_id, motivo, cancelado_por_usuario_id, data_cancelamento
                FROM operacoes_canceladas
                WHERE registro_id = %s
            """
            cursor.execute(query, (registro_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            return CancelamentoOperacao.from_row(row)
        except Exception as e:
            raise Exception(f"Erro ao buscar cancelamento: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def listar_todos(
        limit: int = 100,
        offset: int = 0,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None
    ) -> List['CancelamentoOperacao']:
        """Lista todos os cancelamentos com filtros"""
        if not DatabaseConnection.table_exists('operacoes_canceladas'):
            return []
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                SELECT id, registro_id, motivo, cancelado_por_usuario_id, data_cancelamento
                FROM operacoes_canceladas
                WHERE 1=1
            """
            params = []
            
            if data_inicio:
                query += " AND DATE(data_cancelamento) >= %s"
                params.append(data_inicio)
            if data_fim:
                query += " AND DATE(data_cancelamento) <= %s"
                params.append(data_fim)
            
            query += " ORDER BY data_cancelamento DESC LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            return [CancelamentoOperacao.from_row(row) for row in rows]
        except Exception as e:
            raise Exception(f"Erro ao listar cancelamentos: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def contar(data_inicio: Optional[str] = None, data_fim: Optional[str] = None) -> int:
        """Conta o total de cancelamentos"""
        if not DatabaseConnection.table_exists('operacoes_canceladas'):
            return 0
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = "SELECT COUNT(*) FROM operacoes_canceladas WHERE 1=1"
            params = []
            
            if data_inicio:
                query += " AND DATE(data_cancelamento) >= %s"
                params.append(data_inicio)
            if data_fim:
                query += " AND DATE(data_cancelamento) <= %s"
                params.append(data_fim)
            
            cursor.execute(query, tuple(params))
            result = cursor.fetchone()
            return int(result[0]) if result and result[0] is not None else 0
        except Exception as e:
            raise Exception(f"Erro ao contar cancelamentos: {str(e)}")
        finally:
            cursor.close()
            conn.close()

