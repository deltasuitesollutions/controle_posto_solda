from flask import Blueprint, jsonify, request
from Server.services import tags_temporarias_service

tags_temporarias_bp = Blueprint('tags_temporarias', __name__, url_prefix='/api/tags-temporarias')


# Criar tag temporária
@tags_temporarias_bp.route('', methods=['POST'])
def criar_tag_temporaria():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400

        funcionario_id = data.get('funcionario_id')
        tag_id = data.get('tag_id') or data.get('tag')
        horas_duracao = data.get('horas_duracao', 10)

        if not funcionario_id:
            return jsonify({"erro": "ID do funcionário é obrigatório"}), 400

        if not tag_id:
            return jsonify({"erro": "Tag RFID é obrigatória"}), 400

        tag = tags_temporarias_service.criar_tag_temporaria(
            funcionario_id=funcionario_id,
            tag_id=tag_id,
            horas_duracao=horas_duracao
        )

        return jsonify(tag), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Listar tags temporárias 
@tags_temporarias_bp.route('/funcionario/<int:funcionario_id>', methods=['GET'])
def listar_tags_temporarias_funcionario(funcionario_id):
    try:
        tags = tags_temporarias_service.listar_tags_temporarias_funcionario(funcionario_id)
        return jsonify(tags)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Excluir tag temporária
@tags_temporarias_bp.route('/<string:tag_id>', methods=['DELETE'])
def excluir_tag_temporaria(tag_id):
    try:
        # Buscar tag antes de excluir para auditoria
        from Server.models.tag_temporaria import TagTemporaria
        tag = TagTemporaria.buscar_por_tag_id(tag_id)
        tags_temporarias_service.excluir_tag_temporaria(tag_id)

        return jsonify({"mensagem": "Tag temporária removida com sucesso"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Limpar tags expiradas
@tags_temporarias_bp.route('/limpar-expiradas', methods=['POST'])
def limpar_tags_expiradas():
    try:
        tags_temporarias_service.limpar_tags_expiradas()
        return jsonify({"mensagem": "Tags expiradas removidas com sucesso"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

