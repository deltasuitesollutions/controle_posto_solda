"""
Função auxiliar para obter o ID do usuário da requisição
"""
from flask import request
from typing import Optional


def obter_usuario_id_da_requisicao() -> Optional[int]:
    """
    Tenta obter o ID do usuário da requisição.
    Verifica no body JSON primeiro, depois nos headers.
    
    Returns:
        ID do usuário ou None se não encontrado
    """
    try:
        # Tentar obter do body JSON
        if request.is_json:
            data = request.get_json(silent=True)
            if data and isinstance(data, dict):
                usuario_id = data.get('usuario_id') or data.get('usuarioId')
                if usuario_id:
                    return int(usuario_id) if isinstance(usuario_id, (int, str)) else None
        
        # Tentar obter do header
        usuario_id_header = request.headers.get('X-User-Id') or request.headers.get('X-Usuario-Id')
        if usuario_id_header:
            try:
                return int(usuario_id_header)
            except (ValueError, TypeError):
                pass
        
        # Tentar obter dos query params
        usuario_id_param = request.args.get('usuario_id', type=int)
        if usuario_id_param:
            return usuario_id_param
            
    except Exception:
        pass
    
    return None

