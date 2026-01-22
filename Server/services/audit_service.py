from typing import Dict, Any, List, Optional
from Server.models.audit_log import AuditLog


def registrar_acao(
    usuario_id: int,
    acao: str,
    entidade: str,
    entidade_id: Optional[int] = None,
    dados_anteriores: Optional[Dict[str, Any]] = None,
    dados_novos: Optional[Dict[str, Any]] = None,
    detalhes: Optional[str] = None
) -> None:
    """
    Registra uma ação administrativa no log de auditoria
    
    Args:
        usuario_id: ID do usuário que realizou a ação
        acao: Tipo de ação ('criar', 'atualizar', 'deletar', etc.)
        entidade: Tipo de entidade afetada ('usuario', 'funcionario', 'modelo', etc.)
        entidade_id: ID da entidade afetada (opcional)
        dados_anteriores: Dados antes da alteração (opcional)
        dados_novos: Dados após a alteração (opcional)
        detalhes: Detalhes adicionais sobre a ação (opcional)
    """
    try:
        log = AuditLog(
            usuario_id=usuario_id,
            acao=acao,
            entidade=entidade,
            entidade_id=entidade_id,
            dados_anteriores=dados_anteriores,
            dados_novos=dados_novos,
            detalhes=detalhes
        )
        log.save()
    except Exception as e:
        # Não falhar a operação principal se o log falhar
        # Apenas logar o erro (sem usar o sistema de log para evitar loop)
        print(f"Erro ao registrar log de auditoria: {e}")


def listar_logs(
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    usuario_id: Optional[int] = None,
    entidade: Optional[str] = None,
    acao: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None
) -> Dict[str, Any]:
    """
    Lista logs de auditoria com paginação e filtros
    
    Returns:
        Dict com 'logs' (lista de logs) e 'total' (total de registros)
    """
    logs = AuditLog.listar_todos(
        limit=limit,
        offset=offset,
        usuario_id=usuario_id,
        entidade=entidade,
        acao=acao,
        data_inicio=data_inicio,
        data_fim=data_fim
    )
    
    total = AuditLog.contar_total(
        usuario_id=usuario_id,
        entidade=entidade,
        acao=acao,
        data_inicio=data_inicio,
        data_fim=data_fim
    )
    
    # Buscar informações do usuário para cada log
    from Server.models import Usuario
    logs_com_usuario = []
    for log in logs:
        log_dict = log.to_dict()
        usuario = Usuario.buscar_por_id(log.usuario_id)
        if usuario:
            log_dict['usuario_nome'] = usuario.nome
            log_dict['usuario_username'] = usuario.username
        logs_com_usuario.append(log_dict)
    
    return {
        "logs": logs_com_usuario,
        "total": total
    }

