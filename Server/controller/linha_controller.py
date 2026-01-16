from flask import Blueprint, request, jsonify
from Server.services import linha_service

linhas_bp = Blueprint('linhas', __name__, url_prefix='/api/linhas')

# CRIAR
@linhas_bp.route('', methods=['POST'])
def criar_linha():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        nome = data.get('nome')

        resultado = linha_service.criar_linha(nome)
        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao criar linha: {e}')
        return jsonify({'erro': 'Erro ao criar linha'}), 500


# ATUALIZAR
@linhas_bp.route('/<int:linha_id>', methods=['PUT'])
def atualizar_linha(linha_id):
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        nome = data.get('nome')

        resultado = linha_service.atualizar_linha(linha_id, nome)
        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao atualizar linha: {e}')
        return jsonify({'erro': 'Erro ao atualizar linha'}), 500


# DELETAR
@linhas_bp.route('/<int:linha_id>', methods=['DELETE'])
def deletar_linha(linha_id):
    try:
        resultado = linha_service.deletar_linha(linha_id)

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao deletar linha: {e}')
        return jsonify({'erro': 'Erro ao deletar linha'}), 500


# LISTAR
@linhas_bp.route('', methods=['GET'])
def listar_linhas():  
    try:
        resultado = linha_service.listar_linhas()  
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao listar linhas: {e}')
        return jsonify({'erro': 'Erro ao listar linhas'}), 500

# BUSCAR POR LINHA
@linhas_bp.route('/<int:linha_id>', methods=['GET'])
def buscar_linha(linha_id):
    try:
        resultado = linha_service.buscar_linha_por_id(linha_id)  
        
        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar linha: {e}')
        return jsonify({'erro': 'Erro ao buscar linha'}), 500

# BUSCAR POR NOME
@linhas_bp.route('/buscar', methods=['GET'])
def buscar_linhas_por_nome():
    try:
        nome = request.args.get('nome', '')
        resultado = linha_service.buscar_linhas_por_nome(nome)  
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar linhas: {e}')
        return jsonify({'erro': 'Erro ao buscar linhas'}), 500

