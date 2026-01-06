"""
Controller para rotas de limpeza de dados
"""
from typing import Tuple, Union
from flask import Blueprint, jsonify, Response
from backend.services import limpeza_service

limpeza_bp = Blueprint('limpeza', __name__, url_prefix='/api/limpeza')

@limpeza_bp.route('/registros', methods=['DELETE'])
def apagar_registros() -> Union[Response, Tuple[Response, int]]:
    """Apaga todos os registros de produção"""
    try:
        resultado = limpeza_service.apagar_todos_registros()
        return jsonify({
            "status": "success",
            "message": resultado["mensagem"],
            "total_apagado": resultado["total_apagado"]
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

