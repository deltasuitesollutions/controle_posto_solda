"""
Controller para rotas de funcionários
"""
from typing import Tuple, Union
from flask import Blueprint, jsonify, Response, request
from backend.services import funcionarios_service

funcionarios_bp = Blueprint('funcionarios', __name__, url_prefix='/api/funcionarios')

@funcionarios_bp.route('', methods=['GET'])
def listar_funcionarios() -> Union[Response, Tuple[Response, int]]:
    """Lista todos os funcionários ativos"""
    try:
        funcionarios = funcionarios_service.listar_funcionarios()
        return jsonify(funcionarios)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao listar funcionários: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500


@funcionarios_bp.route('/todos', methods=['GET'])
def listar_todos_funcionarios() -> Union[Response, Tuple[Response, int]]:
    """Lista todos os funcionários (ativos e inativos)"""
    try:
        funcionarios = funcionarios_service.listar_todos_funcionarios()
        return jsonify(funcionarios)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao listar todos os funcionários: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500


@funcionarios_bp.route('', methods=['POST'])
def criar_funcionario() -> Union[Response, Tuple[Response, int]]:
    """Cria um novo funcionário"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        matricula = data.get('matricula')
        nome = data.get('nome')
        ativo = data.get('ativo', True)
        
        if not matricula or not nome:
            return jsonify({"error": "Matrícula e nome são obrigatórios"}), 400
        
        funcionario = funcionarios_service.criar_funcionario(
            matricula=matricula,
            nome=nome,
            ativo=bool(ativo)
        )
        
        return jsonify({"status": "success", "data": funcionario}), 201
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao criar funcionário: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500


@funcionarios_bp.route('/<int:funcionario_id>', methods=['PUT'])
def atualizar_funcionario(funcionario_id: int) -> Union[Response, Tuple[Response, int]]:
    """Atualiza um funcionário existente"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        nome = data.get('nome')
        ativo = data.get('ativo', True)
        
        if not nome:
            return jsonify({"error": "Nome é obrigatório"}), 400
        
        funcionario = funcionarios_service.atualizar_funcionario(
            funcionario_id=funcionario_id,
            nome=nome,
            ativo=bool(ativo)
        )
        
        return jsonify({"status": "success", "data": funcionario}), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao atualizar funcionário: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500


@funcionarios_bp.route('/<int:funcionario_id>', methods=['DELETE'])
def deletar_funcionario(funcionario_id: int) -> Union[Response, Tuple[Response, int]]:
    """Deleta um funcionário"""
    try:
        funcionarios_service.deletar_funcionario(funcionario_id)
        return jsonify({"status": "success"}), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao deletar funcionário: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500

