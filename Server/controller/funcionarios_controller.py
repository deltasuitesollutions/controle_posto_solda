from typing import Tuple, Union
from flask import Blueprint, jsonify, Response, request
from Server.services import funcionarios_service

funcionarios_bp = Blueprint('funcionarios', __name__, url_prefix='/api/funcionarios')


# Lista todos os funcionários ativos
@funcionarios_bp.route('', methods=['GET'])
def listar_funcionarios() -> Union[Response, Tuple[Response, int]]:
    funcionarios = funcionarios_service.listar_funcionarios()
    return jsonify(funcionarios)


# Lista todos os funcionários (ativos e inativos)
@funcionarios_bp.route('/todos', methods=['GET'])
def listar_todos_funcionarios() -> Union[Response, Tuple[Response, int]]:
    funcionarios = funcionarios_service.listar_todos_funcionarios()
    return jsonify(funcionarios)


# Cria um novo funcionário
@funcionarios_bp.route('', methods=['POST'])
def criar_funcionario() -> Union[Response, Tuple[Response, int]]:
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        matricula = data.get('matricula')
        nome = data.get('nome')
        ativo = data.get('ativo', True)
        tag = data.get('tag')  # Frontend envia tag
        
        if not matricula or not nome:
            return jsonify({"error": "Matrícula e nome são obrigatórios"}), 400
        
        funcionario = funcionarios_service.criar_funcionario(
            matricula=matricula,
            nome=nome,
            ativo=bool(ativo),
            tag=tag
        )
        
        return jsonify({"status": "success", "data": funcionario}), 201
    except Exception as e:
        erros_cliente = ["já existe", "já está em uso", "obrigatória", "não encontrado"]
        status = 400 if any(erro in str(e).lower() for erro in erros_cliente) else 500
        return jsonify({"status": "error", "message": str(e)}), status


# Atualiza um funcionário existente
@funcionarios_bp.route('/<int:funcionario_id>', methods=['PUT'])
def atualizar_funcionario(funcionario_id: int) -> Union[Response, Tuple[Response, int]]:
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        nome = data.get('nome')
        ativo = data.get('ativo', True)
        tag = data.get('tag')  # Frontend envia tag
        
        if not nome:
            return jsonify({"error": "Nome é obrigatório"}), 400
        
        funcionario = funcionarios_service.atualizar_funcionario(
            funcionario_id=funcionario_id,
            nome=nome,
            ativo=bool(ativo),
            tag=tag
        )
        
        return jsonify({"status": "success", "data": funcionario}), 200
    except Exception as e:
        erros_cliente = ["já existe", "já está em uso", "obrigatória", "não encontrado"]
        status = 400 if any(erro in str(e).lower() for erro in erros_cliente) else 500
        return jsonify({"status": "error", "message": str(e)}), status


# Remove um funcionário do sistema
@funcionarios_bp.route('/<int:funcionario_id>', methods=['DELETE'])
def deletar_funcionario(funcionario_id: int) -> Union[Response, Tuple[Response, int]]:
    try:
        funcionarios_service.deletar_funcionario(funcionario_id)
        return jsonify({"status": "success"}), 200
    except Exception as e:
        erros_cliente = ["já existe", "já está em uso", "obrigatória", "não encontrado"]
        status = 400 if any(erro in str(e).lower() for erro in erros_cliente) else 500
        return jsonify({"status": "error", "message": str(e)}), status
