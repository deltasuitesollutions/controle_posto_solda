from flask import Blueprint, request, jsonify
from Server.services import modelos_service

modelos_bp = Blueprint('modelos', __name__, url_prefix='/api/modelos')

# LISTAR
@modelos_bp.route('', methods=['GET'])
def listar_modelos():
    try:
        modelos = modelos_service.listar_modelos()
        return jsonify(modelos)
    except Exception as e:
        print(f'Erro ao listar modelos: {e}')
        return jsonify({'erro': 'Erro ao buscar modelos'}), 500
    
# BUSCAR
@modelos_bp.route('/<string:codigo>', methods=['GET'])
def buscar_modelo(codigo):
    try:
        modelo = modelos_service.buscar_modelo_por_codigo(codigo)
        if 'erro' in modelo:
            return jsonify(modelo), 404
        return jsonify(modelo)
    except Exception as e:
        print(f'Erro ao buscar modelo: {e}')
        return jsonify({'erro': 'Erro ao buscar modelo'}), 500

# CRIAR  
@modelos_bp.route('', methods=['POST'])
def criar_modelo():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não fornecidos"}), 400
        
        codigo = data.get('codigo')
        nome = data.get('nome')
        pecas = data.get('pecas', [])
        produto_id = data.get('produto_id')

        if not nome:
            return jsonify({"erro": "Nome é obrigatório"}), 400
        
        if not codigo:
            codigo = nome
        
        resultado = modelos_service.criar_modelo(codigo, nome, pecas, produto_id)

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f"Erro ao criar modelo: {e}")
        return jsonify({"erro": "Erro ao criar modelo"}), 500

# ATUALIZAR 
@modelos_bp.route('/<int:modelo_id>', methods=['PUT'])
def atualizar_modelo(modelo_id):
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não fornecidos"}), 400
        
        codigo = data.get('codigo')
        nome = data.get('nome')
        pecas = data.get('pecas')
        produto_id = data.get('produto_id')
        modelos_anteriores = modelos_service.listar_modelos()
        modelo_anterior = next((m for m in modelos_anteriores if m.get('id') == modelo_id), None)

        resultado = modelos_service.atualizar_modelo(modelo_id, codigo, nome, pecas, produto_id)

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao atualizar modelo: {e}')
        return jsonify({'erro': 'Erro ao atualizar modelo'}), 500

# DELETAR
@modelos_bp.route('/<int:modelo_id>', methods=['DELETE'])
def deletar_modelo(modelo_id):
    try:
        modelos_anteriores = modelos_service.listar_modelos()
        modelo_anterior = next((m for m in modelos_anteriores if m.get('id') == modelo_id), None)

        resultado = modelos_service.deletar_modelo(modelo_id)

        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao deletar modelo: {e}')
        return jsonify({'erro': 'Erro ao deletar modelo'}), 500