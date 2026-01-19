from flask import Blueprint, request, jsonify
from Server.services import operacao_service

operacoes_bp = Blueprint('operacoes', __name__, url_prefix='/api/operacoes')


@operacoes_bp.route('', methods=['GET'])
def listar_operacoes():
    """Lista todas as operações"""
    try:
        operacoes = operacao_service.listar_operacoes()
        return jsonify(operacoes), 200
    except Exception as e:
        print(f'Erro ao listar operações: {e}')
        return jsonify({'erro': 'Erro ao buscar operações'}), 500


@operacoes_bp.route('/<int:operacao_id>', methods=['GET'])
def buscar_operacao(operacao_id):
    """Busca uma operação pelo ID"""
    try:
        resultado = operacao_service.buscar_operacao_por_id(operacao_id)
        
        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar operação: {e}')
        return jsonify({'erro': 'Erro ao buscar operação'}), 500


@operacoes_bp.route('', methods=['POST'])
def criar_operacao():
    """Cria uma nova operação"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        operacao = data.get('operacao')
        produto = data.get('produto')
        modelo = data.get('modelo')
        linha = data.get('linha')
        posto = data.get('posto')
        totens = data.get('totens', [])
        pecas = data.get('pecas', [])
        codigos = data.get('codigos', [])

        if not operacao or not produto or not modelo or not linha or not posto:
            return jsonify({'erro': 'Operação, produto, modelo, linha e posto são obrigatórios'}), 400
        
        resultado = operacao_service.criar_operacao(
            operacao=operacao,
            produto=produto,
            modelo=modelo,
            linha=linha,
            posto=posto,
            totens=totens,
            pecas=pecas,
            codigos=codigos
        )

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado), 201
    except Exception as e:
        print(f'Erro ao criar operação: {e}')
        return jsonify({'erro': 'Erro ao criar operação'}), 500


@operacoes_bp.route('/<int:operacao_id>', methods=['PUT'])
def atualizar_operacao(operacao_id):
    """Atualiza uma operação existente"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        operacao = data.get('operacao')
        produto = data.get('produto')
        modelo = data.get('modelo')
        linha = data.get('linha')
        posto = data.get('posto')
        totens = data.get('totens')
        pecas = data.get('pecas')
        codigos = data.get('codigos')

        resultado = operacao_service.atualizar_operacao(
            operacao_id=operacao_id,
            operacao=operacao,
            produto=produto,
            modelo=modelo,
            linha=linha,
            posto=posto,
            totens=totens,
            pecas=pecas,
            codigos=codigos
        )

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao atualizar operação: {e}')
        return jsonify({'erro': 'Erro ao atualizar operação'}), 500


@operacoes_bp.route('/<int:operacao_id>', methods=['DELETE'])
def deletar_operacao(operacao_id):
    """Deleta uma operação"""
    try:
        resultado = operacao_service.deletar_operacao(operacao_id)

        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao deletar operação: {e}')
        return jsonify({'erro': 'Erro ao deletar operação'}), 500

