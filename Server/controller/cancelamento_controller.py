from flask import Blueprint, jsonify, request
from Server.services import cancelamento_operacao_service
from Server.utils.audit_helper import obter_usuario_id_da_requisicao


cancelamento_bp = Blueprint('cancelamento', __name__, url_prefix='/api/cancelamentos')

# CRIAR
@cancelamento_bp.route('', methods=['POST'])
def criar_cancelamento():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400
        
        registro_id = data.get('registro_id')
        motivo = data.get('motivo', '') 
        
        if not registro_id:
            return jsonify({"erro": "Registro ID é obrigatório"}), 400
        
        usuario_id = obter_usuario_id_da_requisicao()
        resultado = cancelamento_operacao_service.criar_cancelamento(
            registro_id=registro_id,
            motivo=motivo,
            cancelado_por_usuario_id=usuario_id
        )
        
        return jsonify(resultado), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# LISTAR
@cancelamento_bp.route('', methods=['GET'])
def listar_cancelamentos():
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        data = request.args.get('data', type=str)
        
        if limit < 1 or limit > 1000:
            return jsonify({"erro": "Limit deve estar entre 1 e 1000"}), 400
        
        if offset < 0:
            return jsonify({"erro": "Offset deve ser maior ou igual a 0"}), 400
        
        resultado = cancelamento_operacao_service.listar_cancelamentos(
            limit=limit,
            offset=offset,
            data=data
        )
        
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ATUALIZAR
@cancelamento_bp.route('/<int:cancelamento_id>/motivo', methods=['PUT'])
def atualizar_motivo(cancelamento_id: int):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400
        
        motivo = data.get('motivo')
        
        if not motivo:
            return jsonify({"erro": "Motivo é obrigatório"}), 400
        
        resultado = cancelamento_operacao_service.atualizar_motivo(
            cancelamento_id=cancelamento_id,
            motivo=motivo
        )
        
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# DELETAR
@cancelamento_bp.route('/<int:cancelamento_id>', methods=['DELETE'])
def excluir_cancelamento(cancelamento_id: int):
    try:
        resultado = cancelamento_operacao_service.excluir_cancelamento(
            cancelamento_id=cancelamento_id
        )
        
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
