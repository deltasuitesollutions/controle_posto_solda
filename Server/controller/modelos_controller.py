from typing import Tuple, Union
from flask import Blueprint, jsonify, Response, request
from Server.services import modelos_service

modelos_bp = Blueprint('modelos', __name__, url_prefix='/api/modelos')

@modelos_bp.route('', methods=['GET'])
def listar_modelos() -> Union[Response, Tuple[Response, int]]:
    """Lista todos os modelos/produtos"""
    try:
        modelos = modelos_service.listar_modelos()
        return jsonify(modelos)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao listar modelos: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500


@modelos_bp.route('/todos', methods=['GET'])
def listar_todos_modelos() -> Union[Response, Tuple[Response, int]]:
    """Lista todos os modelos/produtos com ID"""
    try:
        modelos = modelos_service.listar_todos_modelos()
        return jsonify(modelos)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao listar todos os modelos: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500


@modelos_bp.route('', methods=['POST'])
def criar_modelo() -> Union[Response, Tuple[Response, int]]:
    """Cria um novo modelo/produto"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        codigo = data.get('codigo')
        descricao = data.get('descricao', '')
        
        if not codigo:
            return jsonify({"error": "Código é obrigatório"}), 400
        
        modelo = modelos_service.criar_modelo(
            codigo=codigo,
            descricao=descricao
        )
        
        return jsonify({"status": "success", "data": modelo}), 201
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao criar modelo: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500


@modelos_bp.route('/<int:modelo_id>', methods=['PUT'])
def atualizar_modelo(modelo_id: int) -> Union[Response, Tuple[Response, int]]:
    """Atualiza um modelo/produto existente"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        codigo = data.get('codigo')
        descricao = data.get('descricao', '')
        
        if not codigo:
            return jsonify({"error": "Código é obrigatório"}), 400
        
        modelo = modelos_service.atualizar_modelo(
            modelo_id=modelo_id,
            codigo=codigo,
            descricao=descricao
        )
        
        return jsonify({"status": "success", "data": modelo}), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao atualizar modelo: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500


@modelos_bp.route('/<int:modelo_id>', methods=['DELETE'])
def deletar_modelo(modelo_id: int) -> Union[Response, Tuple[Response, int]]:
    """Deleta um modelo/produto"""
    try:
        modelos_service.deletar_modelo(modelo_id)
        return jsonify({"status": "success"}), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao deletar modelo: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500

