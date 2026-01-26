from flask import Blueprint, jsonify, request
from Server.services import pecas_service

pecas_bp = Blueprint('pecas', __name__, url_prefix='/api/pecas')

# LISTAR
@pecas_bp.route('', methods=['GET'])
def listar_pecas():
    try:
        com_relacoes = request.args.get('com_relacoes', 'false').lower() == 'true'
        
        if com_relacoes:
            pecas = pecas_service.listar_todas_com_relacoes()
        else:
            pecas = pecas_service.listar_todas()
        return jsonify(pecas)
    except Exception as e:
        print(f"Erro ao listar peças: {e}")
        return jsonify({"erro": "Erro ao listar peças"}), 500
    
# BUSCAR
@pecas_bp.route('/<int:peca_id>', methods=['GET'])
def buscar_peca(peca_id):
    try:
        peca = pecas_service.buscar_por_id(peca_id)
        if not peca:
            return jsonify({"erro": "Peça não encontrada"}), 404
        return jsonify(peca)
    except Exception as e:
        print(f"Erro ao buscar peça: {e}")
        return jsonify({"erro": "Erro ao buscar peça"}), 500


# BUSCAR PEÇAS POR MODELO
@pecas_bp.route('/modelo/<int:modelo_id>', methods=['GET'])
def buscar_pecas_por_modelo(modelo_id):
    try:
        pecas = pecas_service.buscar_por_modelo_id(modelo_id)
        return jsonify(pecas)
    except Exception as e:
        print(f"Erro ao buscar peças do modelo: {e}")
        return jsonify({"erro": "Erro ao buscar peças"}), 500

# CRIAR
@pecas_bp.route('', methods=['POST'])
def criar_peca():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"erro": "Dados não fornecidos"}), 400
        
        modelo_id = data.get('modelo_id')
        codigo = data.get('codigo')
        nome = data.get('nome')
        
        if not modelo_id or not codigo or not nome:
            return jsonify({"erro": "Modelo ID, código e nome são obrigatórios"}), 400
        
        resultado = pecas_service.criar_peca(modelo_id, codigo, nome)
        
        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado), 201
    except Exception as e:
        print(f"Erro ao criar peça: {e}")
        return jsonify({"erro": "Erro ao criar peça"}), 500

# ATUALIZAR
@pecas_bp.route('/<int:peca_id>', methods=['PUT'])
def atualizar_peca(peca_id):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"erro": "Dados não fornecidos"}), 400
        
        modelo_id = data.get('modelo_id')
        codigo = data.get('codigo')
        nome = data.get('nome')
        
        # Buscar dados anteriores para o log
        peca_anterior = pecas_service.buscar_por_id(peca_id)
        
        resultado = pecas_service.atualizar_peca(peca_id, modelo_id, codigo, nome)
        
        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f"Erro ao atualizar peça: {e}")
        return jsonify({"erro": "Erro ao atualizar peça"}), 500

# DELETAR
@pecas_bp.route('/<int:peca_id>', methods=['DELETE'])
def deletar_peca(peca_id):
    try:
        peca_anterior = pecas_service.buscar_por_id(peca_id)
        
        resultado = pecas_service.deletar_peca(peca_id)
        
        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        return jsonify(resultado)
    except Exception as e:
        print(f"Erro ao deletar peça: {e}")
        return jsonify({"erro": "Erro ao deletar peça"}), 500