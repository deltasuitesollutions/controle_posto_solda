from flask import Blueprint, request, jsonify
from Server.services import dispositivo_raspberry_service

dispositivo_raspberry_bp = Blueprint('dispositivos-raspberry', __name__, url_prefix='/api/dispositivos-raspberry')


# REGISTRAR DISPOSITIVO (obtém serial/hostname e salva)
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

