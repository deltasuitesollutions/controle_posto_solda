from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from Server.models.database import DatabaseConnection


class AuditLog:
    """Modelo que representa um log de auditoria de ações administrativas"""
    
    def __init__(
        self,
        usuario_id: int,
        acao: str,
        entidade: str,
        entidade_id: Optional[int] = None,
        dados_anteriores: Optional[Dict[str, Any]] = None,
        dados_novos: Optional[Dict[str, Any]] = None,
        detalhes: Optional[str] = None,
        audit_log_id: Optional[int] = None,
        data_hora: Optional[str] = None
    ) -> None:
        self.audit_log_id: Optional[int] = audit_log_id
        self.usuario_id: int = usuario_id
        self.acao: str = acao  # 'criar', 'atualizar', 'deletar', etc.
        self.entidade: str = entidade  # 'usuario', 'funcionario', 'modelo', etc.
        self.entidade_id: Optional[int] = entidade_id
        self.dados_anteriores: Optional[Dict[str, Any]] = dados_anteriores
        self.dados_novos: Optional[Dict[str, Any]] = dados_novos
        self.detalhes: Optional[str] = detalhes
        self.data_hora: Optional[str] = data_hora
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        result = {
            "usuario_id": self.usuario_id,
            "acao": self.acao,
            "entidade": self.entidade,
            "entidade_id": self.entidade_id,
            "dados_anteriores": self.dados_anteriores,
            "dados_novos": self.dados_novos,
            "detalhes": self.detalhes,
            "data_hora": self.data_hora
        }
        if self.audit_log_id is not None:
            result["id"] = self.audit_log_id
            result["audit_log_id"] = self.audit_log_id
        return result
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'AuditLog':
        """Cria um objeto AuditLog a partir de uma linha do banco"""
        import json
        
        audit_log_id = int(row[0]) if len(row) > 0 and row[0] is not None else None
        usuario_id = int(row[1]) if len(row) > 1 and row[1] is not None else 0
        acao = str(row[2]) if len(row) > 2 and row[2] is not None else ''
        entidade = str(row[3]) if len(row) > 3 and row[3] is not None else ''
        entidade_id = int(row[4]) if len(row) > 4 and row[4] is not None else None
        dados_anteriores_raw = row[5] if len(row) > 5 and row[5] is not None else None
        dados_novos_raw = row[6] if len(row) > 6 and row[6] is not None else None
        detalhes = str(row[7]) if len(row) > 7 and row[7] is not None else None
        data_hora = str(row[8]) if len(row) > 8 and row[8] is not None else None
        
        # Converter JSON/JSONB para dict
        # PostgreSQL pode retornar JSONB como dict diretamente ou como string
        dados_anteriores = None
        dados_novos = None
        
        if dados_anteriores_raw:
            try:
                if isinstance(dados_anteriores_raw, dict):
                    dados_anteriores = dados_anteriores_raw
                elif isinstance(dados_anteriores_raw, str):
                    dados_anteriores = json.loads(dados_anteriores_raw)
                else:
                    dados_anteriores = None
            except:
                dados_anteriores = None
        
        if dados_novos_raw:
            try:
                if isinstance(dados_novos_raw, dict):
                    dados_novos = dados_novos_raw
                elif isinstance(dados_novos_raw, str):
                    dados_novos = json.loads(dados_novos_raw)
                else:
                    dados_novos = None
            except:
                dados_novos = None
        
        return AuditLog(
            audit_log_id=audit_log_id,
            usuario_id=usuario_id,
            acao=acao,
            entidade=entidade,
            entidade_id=entidade_id,
            dados_anteriores=dados_anteriores,
            dados_novos=dados_novos,
            detalhes=detalhes,
            data_hora=data_hora
        )
    
    def save(self) -> 'AuditLog':
        """Salva o log de auditoria no banco de dados"""
        import json
        
        dados_anteriores_json = json.dumps(self.dados_anteriores) if self.dados_anteriores else None
        dados_novos_json = json.dumps(self.dados_novos) if self.dados_novos else None
        
        query = """
            INSERT INTO audit_log (
                usuario_id, acao, entidade, entidade_id, 
                dados_anteriores, dados_novos, detalhes, data_hora
            ) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING id
        """
        params = (
            self.usuario_id,
            self.acao,
            self.entidade,
            self.entidade_id,
            dados_anteriores_json,
            dados_novos_json,
            self.detalhes
        )
        result = DatabaseConnection.execute_query(query, params)
        if isinstance(result, int):
            self.audit_log_id = result
        elif isinstance(result, tuple) and len(result) > 0:
            self.audit_log_id = result[0] if isinstance(result[0], int) else result[0]
        
        return self
    
    @staticmethod
    def listar_todos(
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        usuario_id: Optional[int] = None,
        entidade: Optional[str] = None,
        acao: Optional[str] = None,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None
    ) -> List['AuditLog']:
        """Lista todos os logs de auditoria com filtros opcionais"""
        conditions = []
        params = []
        
        if usuario_id is not None:
            conditions.append("usuario_id = %s")
            params.append(usuario_id)
        
        if entidade:
            conditions.append("entidade = %s")
            params.append(entidade)
        
        if acao:
            conditions.append("acao = %s")
            params.append(acao)
        
        if data_inicio:
            conditions.append("DATE(data_hora) >= %s")
            params.append(data_inicio)
        
        if data_fim:
            conditions.append("DATE(data_hora) <= %s")
            params.append(data_fim)
        
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        query = f"""
            SELECT id, usuario_id, acao, entidade, entidade_id, 
                   dados_anteriores, dados_novos, detalhes, data_hora
            FROM audit_log
            {where_clause}
            ORDER BY data_hora DESC
        """
        
        if limit is not None:
            query += f" LIMIT {limit}"
            if offset is not None:
                query += f" OFFSET {offset}"
        
        result = DatabaseConnection.execute_query(query, tuple(params) if params else None, fetch_all=True)
        if result:
            return [AuditLog.from_row(row) for row in result]
        return []
    
    @staticmethod
    def contar_total(
        usuario_id: Optional[int] = None,
        entidade: Optional[str] = None,
        acao: Optional[str] = None,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None
    ) -> int:
        """Conta o total de logs de auditoria com filtros opcionais"""
        conditions = []
        params = []
        
        if usuario_id is not None:
            conditions.append("usuario_id = %s")
            params.append(usuario_id)
        
        if entidade:
            conditions.append("entidade = %s")
            params.append(entidade)
        
        if acao:
            conditions.append("acao = %s")
            params.append(acao)
        
        if data_inicio:
            conditions.append("DATE(data_hora) >= %s")
            params.append(data_inicio)
        
        if data_fim:
            conditions.append("DATE(data_hora) <= %s")
            params.append(data_fim)
        
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        query = f"""
            SELECT COUNT(*) 
            FROM audit_log
            {where_clause}
        """
        
        result = DatabaseConnection.execute_query(query, tuple(params) if params else None, fetch_one=True)
        if result and isinstance(result, tuple) and len(result) > 0:
            return int(result[0])
        return 0

