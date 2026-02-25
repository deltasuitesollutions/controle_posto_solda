from flask import Blueprint, jsonify, request
from Server.services import rfid_service

tags_bp = Blueprint('tags', __name__, url_prefix='/api/tags')


# Processa leitura RFID e registra entrada/saída
@tags_bp.route('/processar', methods=['POST'])
def processar_rfid():
    try:
        data = request.json
        if not data or not data.get('tag_id'):
            return jsonify({"status": "error", "message": "Código da tag RFID (tag_id) é obrigatório"}), 400
        
        tag_id = str(data['tag_id']).strip()
        posto = data.get('posto')
        
        resultado = rfid_service.processar_leitura_rfid(tag_id=tag_id, posto=posto)
        return jsonify({"status": "success", **resultado})
    except Exception as e:
        erros_cliente = ["não encontrada", "não está", "obrigatório", "não foi possível"]
        status = 400 if any(erro in str(e).lower() for erro in erros_cliente) else 500
        return jsonify({"status": "error", "message": str(e)}), status
