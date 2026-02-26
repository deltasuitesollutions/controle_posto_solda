from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Set
from Server.models.database import DatabaseConnection
from Server.models.posto import Posto
from Server.models.sublinha import Sublinha
from Server.models.tag_temporaria import TZ_MANAUS


def buscar_registros_abertos() -> List[Tuple]:
    query = """
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
            (SELECT STRING_AGG(ft.turno, ', ' ORDER BY ft.turno)
             FROM funcionarios_turnos ft
             WHERE ft.funcionario_id = f.funcionario_id) as turno,
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
    return DatabaseConnection.execute_query(query, fetch_all=True)


def buscar_habilitacoes_ativas() -> Set[Tuple[int, int]]:
    query = """
        SELECT funcionario_id, operacao_id
        FROM operacoes_habilitadas
        WHERE habilitada = TRUE
    """
    resultados = DatabaseConnection.execute_query(query, fetch_all=True)
    return {(r[0], r[1]) for r in resultados} if resultados else set()


def buscar_pecas_hoje_por_posto(data_hoje: str) -> Dict[int, int]:
    query = """
        SELECT posto_id, COALESCE(SUM(quantidade), 0) as total
        FROM registros_producao
        WHERE data_inicio = %s
        AND fim IS NOT NULL
        GROUP BY posto_id
    """
    resultados = DatabaseConnection.execute_query(query, (data_hoje,), fetch_all=True)
    return {r[0]: r[1] for r in resultados} if resultados else {}


def contar_producao_finalizada_hoje(data_hoje: str) -> int:
    """Conta registros de produção FINALIZADOS (fim IS NOT NULL) do dia."""
    query = """
        SELECT COUNT(*)
        FROM registros_producao
        WHERE data_inicio = %s
        AND fim IS NOT NULL
    """
    resultado = DatabaseConnection.execute_query(query, (data_hoje,), fetch_one=True)
    if resultado and resultado[0] is not None:
        return int(resultado[0])
    return 0


def listar_todos_postos() -> List:
    return Posto.listar_todos()


def listar_todas_sublinhas() -> List:
    return Sublinha.listar_todas()
