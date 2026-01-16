from flask import Blueprint, request, jsonify
from Server.services import sublinha_service

sublinhas_bp = Blueprint('sublinhas', __name__, url_prefix='/api/sublinhas')

# CRIAR
@sublinhas_bp.route('', methods=['POST'])
def criar_sublinha():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        nome = data.get('nome')
        linha_id = data.get('linha_id')

        if not nome or not linha_id:
            return jsonify({'erro': 'Nome e linha_id são obrigatórios'}), 400

        resultado = sublinha_service.criar_sublinha(nome, linha_id)
        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao criar sublinha: {e}')
        return jsonify({'erro': 'Erro ao criar sublinha'}), 500

# ATUALIZAR
@sublinhas_bp.route('/<int:sublinha_id>', methods=['PUT'])
def atualizar_sublinha(sublinha_id):
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        nome = data.get('nome')
        linha_id = data.get('linha_id')

        resultado = sublinha_service.atualizar_sublinha(sublinha_id, nome, linha_id)
        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao atualizar sublinha: {e}')
        return jsonify({'erro': 'Erro ao atualizar sublinha'}), 500

# DELETAR
@sublinhas_bp.route('/<int:sublinha_id>', methods=['DELETE'])
def deletar_sublinha(sublinha_id):
    try:
        resultado = sublinha_service.deletar_sublinha(sublinha_id)

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao deletar sublinha: {e}')
        return jsonify({'erro': 'Erro ao deletar sublinha'}), 500

# LISTAR
@sublinhas_bp.route('', methods=['GET'])
def listar_sublinhas():  
    try:
        com_linha = request.args.get('com_linha', 'false').lower() == 'true'
        resultado = sublinha_service.listar_sublinhas(com_linha=com_linha)  
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao listar sublinhas: {e}')
        return jsonify({'erro': 'Erro ao listar sublinhas'}), 500

# BUSCAR
@sublinhas_bp.route('/<int:sublinha_id>', methods=['GET'])
def buscar_sublinha(sublinha_id):
    try:
        resultado = sublinha_service.buscar_sublinha_por_id(sublinha_id)  
        
        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar sublinha: {e}')
        return jsonify({'erro': 'Erro ao buscar sublinha'}), 500

# BUSCAR POR LINHA
@sublinhas_bp.route('/por-linha/<int:linha_id>', methods=['GET'])
def buscar_sublinhas_por_linha(linha_id):
    try:
        resultado = sublinha_service.buscar_sublinhas_por_linha(linha_id)  
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar sublinhas: {e}')
        return jsonify({'erro': 'Erro ao buscar sublinhas'}), 500


# BUSCAR SUBLINHAS POR NOME
@sublinhas_bp.route('/buscar', methods=['GET'])
def buscar_sublinhas_por_nome():
    try:
        nome = request.args.get('nome', '')
        resultado = sublinha_service.buscar_sublinhas_por_nome(nome)  
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar sublinhas: {e}')
        return jsonify({'erro': 'Erro ao buscar sublinhas'}), 500

