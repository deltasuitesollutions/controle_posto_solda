"""
Controller para gerenciar informações do dispositivo (Raspberry Pi)
"""
from flask import Blueprint, jsonify
from Server.services import device_info_service

device_info_bp = Blueprint('device_info', __name__, url_prefix='/api/device-info')


@device_info_bp.route('', methods=['POST'])
def registrar_device_info():
    """
    Endpoint para registrar as informações do dispositivo pela primeira vez.
    Se já existir um registro com o mesmo UUID, retorna o existente.
    """
    try:
        device_info = device_info_service.registrar_device_info()
        return jsonify(device_info), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@device_info_bp.route('', methods=['GET'])
def buscar_device_info():
    """
    Endpoint para buscar as informações do dispositivo atual no banco de dados
    """
    try:
        device_info = device_info_service.buscar_device_info()
        
        if not device_info:
            return jsonify({"erro": "Dispositivo não encontrado no banco de dados"}), 404
        
        return jsonify(device_info)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@device_info_bp.route('/info', methods=['GET'])
def obter_info_local():
    """
    Endpoint para obter as informações do dispositivo sem salvar no banco.
    Útil para verificar as informações antes de registrar.
    """
    try:
        device_info = device_info_service.get_device_info()
        return jsonify(device_info)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@device_info_bp.route('/todos', methods=['GET'])
def listar_todos_devices():
    """
    Endpoint para listar todos os dispositivos registrados no banco de dados
    """
    try:
        devices = device_info_service.listar_todos_devices()
        return jsonify(devices)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

