from flask import Blueprint, request, jsonify
from Server.services import modelos_service

modelos_bp = Blueprint('modelos', __name__, url_prefix='/modelos')

@modelos_bp.route('', methods=['GET'])
def listar_modelos():
    """Lista todos os modelos"""
    try:
        modelos = modelos_service.listar_modelos()
        return jsonify(modelos)
    except Exception as e:
        print(f'Erro ao listar modelos: {e}')
        return jsonify({'erro': 'Erro ao buscar modelos'}), 500
    
@modelos_bp.route('/<string:codigo>', methods=['GET'])
def buscar_modelo(codigo):
    """Busca um modelo pelo código"""
    try:
        modelo = modelos_service.buscar_modelo_por_codigo(codigo)
        if 'erro' in modelo:
            return jsonify(modelo), 404
        return jsonify(modelo)
    except Exception as e:
        print(f'Erro ao buscar modelo: {e}')
        return jsonify({'erro': 'Erro ao buscar modelo'}), 500
    
@modelos_bp.route('', methods=['POST'])
def criar_modelo():
    """Cria um novo modelo"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não fornecidos"}), 400
        
        codigo = data.get('codigo')
        nome = data.get('nome')
        pecas = data.get('pecas', [])

        if not codigo or not nome:
            return jsonify({"erro": "Código e nome são obrigatórios"}), 400
        
        resultado = modelos_service.criar_modelo(codigo, nome, pecas)

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f"Erro ao criar modelo: {e}")
        return jsonify({"erro": "Erro ao criar modelo"}), 500
    
@modelos_bp.route('/<int:modelo_id>', methods=['PUT'])
def atualizar_modelo(modelo_id):
    """Atualiza um modelo existente"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não fornecidos"}), 400
        
        codigo = data.get('codigo')
        nome = data.get('nome')
        pecas = data.get('pecas')

        resultado = modelos_service.atualizar_modelo(modelo_id, codigo, nome, pecas)

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao atualizar modelo: {e}')
        return jsonify({'erro': 'Erro ao atualizar modelo'}), 500
    
@modelos_bp.route('/<int:modelo_id>', methods=['DELETE'])
def deletar_modelo(modelo_id):
    """Deleta um modelo"""
    try:
        resultado = modelos_service.deletar_modelo(modelo_id)

        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao deletar modelo: {e}')
        return jsonify({'erro': 'Erro ao deletar modelo'}), 500