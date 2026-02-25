from flask import Blueprint, request, jsonify
from Server.services import dispositivo_raspberry_service

dispositivo_raspberry_bp = Blueprint('dispositivos-raspberry', __name__, url_prefix='/api/dispositivos-raspberry')


# CRIAR DISPOSITIVO MANUALMENTE (pela tela web - serial + nome opcional)
@dispositivo_raspberry_bp.route('', methods=['POST'])
def criar_dispositivo():
    try:
        data = request.get_json() or {}
        serial = (data.get('serial') or '').strip()
        if not serial:
            return jsonify({'erro': 'Serial é obrigatório'}), 400
        nome = (data.get('nome') or '').strip() or None
        resultado = dispositivo_raspberry_service.criar_dispositivo_manual(serial, nome)
        if not resultado:
            return jsonify({'erro': 'Não foi possível cadastrar o dispositivo'}), 500
        return jsonify(resultado), 201
    except Exception as e:
        print(f'Erro ao criar dispositivo: {e}')
        return jsonify({'erro': str(e)}), 500


# REGISTRAR DISPOSITIVO (obtém apenas serial e salva - chamado pelo Raspberry no login)
@dispositivo_raspberry_bp.route('/registrar', methods=['POST'])
def registrar_dispositivo():
    try:
        resultado = dispositivo_raspberry_service.registrar_dispositivo_raspberry()
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao registrar dispositivo: {e}')
        return jsonify({'erro': str(e)}), 500


# LISTAR TODOS OS DISPOSITIVOS
@dispositivo_raspberry_bp.route('', methods=['GET'])
def listar_dispositivos():
    try:
        resultado = dispositivo_raspberry_service.listar_dispositivos()
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao listar dispositivos: {e}')
        return jsonify({'erro': 'Erro ao listar dispositivos'}), 500


# BUSCAR POR ID
@dispositivo_raspberry_bp.route('/<int:dispositivo_id>', methods=['GET'])
def buscar_dispositivo(dispositivo_id):
    try:
        resultado = dispositivo_raspberry_service.buscar_dispositivo_por_id(dispositivo_id)
        if not resultado:
            return jsonify({'erro': 'Dispositivo não encontrado'}), 404
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar dispositivo: {e}')
        return jsonify({'erro': 'Erro ao buscar dispositivo'}), 500


# BUSCAR POR SERIAL
@dispositivo_raspberry_bp.route('/por-serial/<serial>', methods=['GET'])
def buscar_dispositivo_por_serial(serial):
    try:
        resultado = dispositivo_raspberry_service.buscar_dispositivo_por_serial(serial)
        if not resultado:
            return jsonify({'erro': 'Dispositivo não encontrado'}), 404
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar dispositivo por serial: {e}')
        return jsonify({'erro': 'Erro ao buscar dispositivo'}), 500


# ATUALIZAR NOME DO DISPOSITIVO
@dispositivo_raspberry_bp.route('/<int:dispositivo_id>/nome', methods=['PUT'])
def atualizar_nome_dispositivo(dispositivo_id):
    try:
        data = request.get_json()
        if not data or 'nome' not in data:
            return jsonify({'erro': 'Nome não fornecido'}), 400
        
        nome = data.get('nome', '').strip()
        resultado = dispositivo_raspberry_service.atualizar_nome_dispositivo(dispositivo_id, nome)
        
        if not resultado:
            return jsonify({'erro': 'Dispositivo não encontrado'}), 404
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao atualizar nome do dispositivo: {e}')
        return jsonify({'erro': 'Erro ao atualizar nome do dispositivo'}), 500


# REMOVER DISPOSITIVO
@dispositivo_raspberry_bp.route('/<int:dispositivo_id>', methods=['DELETE'])
def remover_dispositivo(dispositivo_id):
    try:
        removido = dispositivo_raspberry_service.remover_dispositivo(dispositivo_id)
        if not removido:
            return jsonify({'erro': 'Dispositivo não encontrado'}), 404
        return jsonify({'mensagem': 'Dispositivo removido com sucesso'}), 200
    except Exception as e:
        print(f'Erro ao remover dispositivo: {e}')
        return jsonify({'erro': 'Erro ao remover dispositivo'}), 500

