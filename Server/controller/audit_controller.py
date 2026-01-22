from flask import Blueprint, jsonify, request
from Server.services import audit_service
from typing import Union, Tuple

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')


@audit_bp.route('', methods=['GET'])
def listar_logs() -> Union[dict, Tuple[dict, int]]:
    """Lista logs de auditoria com paginação e filtros"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        usuario_id = request.args.get('usuario_id', type=int)
        entidade = request.args.get('entidade', type=str)
        acao = request.args.get('acao', type=str)
        data_inicio = request.args.get('data_inicio', type=str)
        data_fim = request.args.get('data_fim', type=str)
        
        resultado = audit_service.listar_logs(
            limit=limit,
            offset=offset,
            usuario_id=usuario_id,
            entidade=entidade,
            acao=acao,
            data_inicio=data_inicio,
            data_fim=data_fim
        )
        
        return jsonify(resultado), 200
        
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

