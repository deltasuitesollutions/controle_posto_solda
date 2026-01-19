from flask import Blueprint, jsonify, request
from Server.services import funcionarios_service

funcionarios_bp = Blueprint('funcionarios', __name__, url_prefix='/api/funcionarios')


# Lista funcionários ativos
@funcionarios_bp.route('', methods=['GET'])
def listar_funcionarios():
    try:
        funcionarios = funcionarios_service.listar_funcionarios()
        return jsonify(funcionarios)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Lista todos os funcionários
@funcionarios_bp.route('/todos', methods=['GET'])
def listar_todos_funcionarios():
    try:
        funcionarios = funcionarios_service.listar_todos_funcionarios()
        return jsonify(funcionarios)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Cria funcionário
@funcionarios_bp.route('', methods=['POST'])
def criar_funcionario():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400

        matricula = data.get('matricula')
        nome = data.get('nome')
        ativo = data.get('ativo', True)
        # Aceita tanto 'tag' quanto 'tag_id' para compatibilidade
        tag_id = data.get('tag_id') or data.get('tag')
        turno = data.get('turno')
        operacoes_ids = data.get('operacoes_ids', [])

        if not matricula or not nome:
            return jsonify({"erro": "Matrícula e nome são obrigatórios"}), 400

        funcionario = funcionarios_service.criar_funcionario(
            matricula,
            nome,
            ativo,
            tag_id,
            turno,
            operacoes_ids if operacoes_ids else None
        )

        return jsonify(funcionario), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Editar funcionário
@funcionarios_bp.route('/<int:funcionario_id>', methods=['PUT'])
def atualizar_funcionario(funcionario_id):
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400

        nome = data.get('nome')
        ativo = data.get('ativo', True)
        # Aceita tanto 'tag' quanto 'tag_id' para compatibilidade
        tag_id = data.get('tag_id') or data.get('tag')
        turno = data.get('turno')
        operacoes_ids = data.get('operacoes_ids')

        if not nome:
            return jsonify({"erro": "Nome é obrigatório"}), 400

        funcionario = funcionarios_service.atualizar_funcionario(
            funcionario_id,
            nome,
            ativo,
            tag_id,
            turno,
            operacoes_ids if operacoes_ids is not None else None
        )

        return jsonify(funcionario)

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Deleta funcionário
@funcionarios_bp.route('/<int:funcionario_id>', methods=['DELETE'])
def deletar_funcionario(funcionario_id):
    try:
        funcionarios_service.deletar_funcionario(funcionario_id)
        return jsonify({"mensagem": "Funcionário removido com sucesso"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Busca por tag RFID
@funcionarios_bp.route('/tag/<string:tag_id>', methods=['GET'])
def buscar_por_tag(tag_id):
    try:
        funcionario = funcionarios_service.buscar_funcionario_por_tag(tag_id)

        if not funcionario:
            return jsonify({"erro": "Tag não encontrada"}), 404

        return jsonify(funcionario)

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Busca por matrícula
@funcionarios_bp.route('/matricula/<string:matricula>', methods=['GET'])
def buscar_por_matricula(matricula):
    try:
        funcionario = funcionarios_service.buscar_por_matricula(matricula)

        if not funcionario:
            return jsonify({"erro": "Matrícula não encontrada"}), 404

        return jsonify(funcionario)

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Busca operações habilitadas de um funcionário
@funcionarios_bp.route('/<int:funcionario_id>/operacoes-habilitadas', methods=['GET'])
def buscar_operacoes_habilitadas(funcionario_id):
    try:
        operacoes = funcionarios_service.buscar_operacoes_habilitadas(funcionario_id)
        return jsonify(operacoes)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Atualiza operações habilitadas de um funcionário
@funcionarios_bp.route('/<int:funcionario_id>/operacoes-habilitadas', methods=['PUT'])
def atualizar_operacoes_habilitadas(funcionario_id):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400
        
        operacoes_ids = data.get('operacoes_ids', [])
        
        funcionarios_service.atualizar_operacoes_habilitadas(funcionario_id, operacoes_ids)
        
        operacoes = funcionarios_service.buscar_operacoes_habilitadas(funcionario_id)
        return jsonify(operacoes)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500