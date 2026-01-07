"""
Controller para rotas de configuração de postos
"""
from typing import Dict, Any, Tuple, Optional, Union
from flask import Blueprint, jsonify, request, Response
from Server.services import posto_configuracao_service

posto_configuracao_bp = Blueprint('posto_configuracao', __name__, url_prefix='/api/posto-configuracao')

@posto_configuracao_bp.route('/', methods=['GET'])
def listar_configuracoes() -> Union[Response, Tuple[Response, int]]:
    """Lista todas as configurações de postos"""
    try:
        configuracoes = posto_configuracao_service.listar_configuracoes()
        return jsonify({
            "status": "success",
            "configuracoes": configuracoes
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@posto_configuracao_bp.route('/<posto>', methods=['GET'])
def obter_configuracao(posto: str) -> Union[Response, Tuple[Response, int]]:
    """Obtém a configuração de um posto específico"""
    try:
        config = posto_configuracao_service.obter_configuracao_posto(posto)
        if not config:
            return jsonify({
                "status": "success",
                "configuracao": None,
                "message": "Nenhuma configuração encontrada para este posto"
            })
        return jsonify({
            "status": "success",
            "configuracao": config
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@posto_configuracao_bp.route('/', methods=['POST'])
def configurar_posto() -> Union[Response, Tuple[Response, int]]:
    """Configura ou atualiza a configuração de um posto"""
    try:
        data: Optional[Dict[str, Any]] = request.json
        
        if not data or not data.get('posto'):
            return jsonify({
                "status": "error",
                "message": "Código do posto é obrigatório"
            }), 400
        
        resultado = posto_configuracao_service.configurar_posto(
            posto=data['posto'],
            funcionario_matricula=data.get('funcionario_matricula'),
            modelo_codigo=data.get('modelo_codigo'),
            turno=data.get('turno')
        )
        
        return jsonify({
            "status": "success",
            **resultado
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@posto_configuracao_bp.route('/<posto>', methods=['DELETE'])
def remover_configuracao(posto: str) -> Union[Response, Tuple[Response, int]]:
    """Remove a configuração de um posto"""
    try:
        resultado = posto_configuracao_service.remover_configuracao_posto(posto)
        return jsonify({
            "status": "success",
            **resultado
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


