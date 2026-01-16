from typing import Tuple, Union
from flask import Blueprint, jsonify, request, Response
from Server.services import producao_service

registros_bp = Blueprint('registros', __name__, url_prefix='/api/registros')

@registros_bp.route('', methods=['GET'])
def listar_registros() -> Union[Response, Tuple[Response, int]]:
    """Lista registros de produção com filtros"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        data_filtro = request.args.get('data')
        posto_filtro = request.args.get('posto')
        turno_filtro = request.args.get('turno')
        
        resultado = producao_service.listar_registros(
            limit=limit,
            offset=offset,
            data=data_filtro,
            posto=posto_filtro,
            turno=turno_filtro
        )
        
        return jsonify(resultado)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao listar registros: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500

