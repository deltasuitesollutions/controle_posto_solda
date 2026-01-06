"""
Controller para rotas de tags RFID
"""
from typing import Dict, Any, Tuple, Optional, Union
from flask import Blueprint, jsonify, request, Response
from backend.services import rfid_service

tags_bp = Blueprint('tags', __name__, url_prefix='/api/tags')

@tags_bp.route('', methods=['GET'])
def listar_tags() -> Union[Response, Tuple[Response, int]]:
    """Lista todas as tags RFID"""
    try:
        tags = rfid_service.listar_tags()
        return jsonify(tags)
    except Exception as e:
        import traceback
        print(f"Erro ao listar tags: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@tags_bp.route('', methods=['POST'])
def criar_tag() -> Union[Response, Tuple[Response, int]]:
    """Cria uma nova tag RFID"""
    try:
        data: Optional[Dict[str, Any]] = request.json
        
        if not data or not data.get('tag_id'):
            return jsonify({"status": "error", "message": "ID da tag é obrigatório"}), 400
        
        resultado = rfid_service.criar_tag(
            tag_id=data['tag_id'],
            funcionario_matricula=data.get('funcionario_matricula'),
            ativo=data.get('ativo', True),
            observacoes=data.get('observacoes', '')
        )
        
        return jsonify({"status": "success", **resultado})
        
    except Exception as e:
        status_code = 400 if "já existe" in str(e).lower() or "obrigatório" in str(e).lower() else 500
        return jsonify({"status": "error", "message": str(e)}), status_code

@tags_bp.route('/<int:tag_id>', methods=['PUT'])
def atualizar_tag(tag_id: int) -> Union[Response, Tuple[Response, int]]:
    """Atualiza uma tag RFID existente"""
    try:
        data: Optional[Dict[str, Any]] = request.json
        
        if not data:
            return jsonify({"status": "error", "message": "Dados não fornecidos"}), 400
        
        resultado = rfid_service.atualizar_tag(
            tag_id=tag_id,
            funcionario_matricula=data.get('funcionario_matricula'),
            ativo=data.get('ativo', True),
            observacoes=data.get('observacoes', '')
        )
        
        return jsonify({"status": "success", **resultado})
        
    except Exception as e:
        status_code = 404 if "não encontrada" in str(e).lower() else 500
        return jsonify({"status": "error", "message": str(e)}), status_code

@tags_bp.route('/<int:tag_id>', methods=['DELETE'])
def deletar_tag(tag_id: int) -> Union[Response, Tuple[Response, int]]:
    """Deleta uma tag RFID"""
    try:
        resultado = rfid_service.deletar_tag(tag_id)
        return jsonify({"status": "success", **resultado})
    except Exception as e:
        status_code = 404 if "não encontrada" in str(e).lower() else 500
        return jsonify({"status": "error", "message": str(e)}), status_code

@tags_bp.route('/processar', methods=['POST'])
def processar_rfid() -> Union[Response, Tuple[Response, int]]:
    """Processa uma leitura de RFID e registra entrada ou saída automaticamente
    
    Recebe o código do chip RFID e:
    1. Busca o funcionário associado à tag
    2. Verifica se há registro aberto
    3. Se houver, registra saída
    4. Se não houver, registra entrada
    5. Retorna informações sobre o registro
    """
    try:
        import traceback
        data: Optional[Dict[str, Any]] = request.json
        
        if not data or not data.get('tag_id'):
            return jsonify({
                "status": "error",
                "message": "Código da tag RFID (tag_id) é obrigatório"
            }), 400
        
        tag_id = str(data['tag_id']).strip()
        posto = data.get('posto')  # Opcional
        
        
        resultado = rfid_service.processar_leitura_rfid(tag_id=tag_id, posto=posto)
        
        return jsonify({
            "status": "success",
            **resultado
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        status_code = 400 if any(palavra in str(e).lower() for palavra in ["não encontrada", "não está", "obrigatório", "não foi possível"]) else 500
        return jsonify({
            "status": "error",
            "message": str(e)
        }), status_code

