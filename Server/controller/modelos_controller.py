from flask import Blueprint, request, jsonify
from Server.services import modelos_service
from Server.services import audit_service
from Server.utils.audit_helper import obter_usuario_id_da_requisicao

modelos_bp = Blueprint('modelos', __name__, url_prefix='/api/modelos')

@modelos_bp.route('', methods=['GET'])
def listar_modelos():
    """Lista todos os modelos"""
    try:
        modelos = modelos_service.listar_modelos()
        return jsonify(modelos)
    except Exception as e:
        print(f'Erro ao listar modelos: {e}')
        return jsonify({'erro': 'Erro ao buscar modelos'}), 500
    
@modelos_bp.route('/<string:codigo>', methods=['GET'])
def buscar_modelo(codigo):
    """Busca um modelo pelo código"""
    try:
        modelo = modelos_service.buscar_modelo_por_codigo(codigo)
        if 'erro' in modelo:
            return jsonify(modelo), 404
        return jsonify(modelo)
    except Exception as e:
        print(f'Erro ao buscar modelo: {e}')
        return jsonify({'erro': 'Erro ao buscar modelo'}), 500
    
@modelos_bp.route('', methods=['POST'])
def criar_modelo():
    """Cria um novo modelo"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não fornecidos"}), 400
        
        codigo = data.get('codigo')
        nome = data.get('nome')
        pecas = data.get('pecas', [])

        if not nome:
            return jsonify({"erro": "Nome é obrigatório"}), 400
        
        # Se codigo não for fornecido, usar nome como codigo
        if not codigo:
            codigo = nome
        
        resultado = modelos_service.criar_modelo(codigo, nome, pecas)

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='criar',
                entidade='modelo',
                entidade_id=resultado.get('id'),
                dados_novos={'codigo': codigo, 'nome': nome, 'pecas': pecas},
                detalhes=f"Modelo '{nome}' (código: {codigo}) criado"
            )
        
        return jsonify(resultado)
    except Exception as e:
        print(f"Erro ao criar modelo: {e}")
        return jsonify({"erro": "Erro ao criar modelo"}), 500
    
@modelos_bp.route('/<int:modelo_id>', methods=['PUT'])
def atualizar_modelo(modelo_id):
    """Atualiza um modelo existente"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não fornecidos"}), 400
        
        codigo = data.get('codigo')
        nome = data.get('nome')
        pecas = data.get('pecas')

        # Buscar dados anteriores para o log
        modelos_anteriores = modelos_service.listar_modelos()
        modelo_anterior = next((m for m in modelos_anteriores if m.get('id') == modelo_id), None)

        resultado = modelos_service.atualizar_modelo(modelo_id, codigo, nome, pecas)

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            dados_novos = {}
            if codigo is not None:
                dados_novos['codigo'] = codigo
            if nome is not None:
                dados_novos['nome'] = nome
            if pecas is not None:
                dados_novos['pecas'] = pecas
            
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='atualizar',
                entidade='modelo',
                entidade_id=modelo_id,
                dados_anteriores=modelo_anterior,
                dados_novos=dados_novos if dados_novos else None,
                detalhes=f"Modelo ID {modelo_id} atualizado"
            )
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao atualizar modelo: {e}')
        return jsonify({'erro': 'Erro ao atualizar modelo'}), 500
    
@modelos_bp.route('/<int:modelo_id>', methods=['DELETE'])
def deletar_modelo(modelo_id):
    """Deleta um modelo"""
    try:
        # Buscar dados do modelo antes de deletar
        modelos_anteriores = modelos_service.listar_modelos()
        modelo_anterior = next((m for m in modelos_anteriores if m.get('id') == modelo_id), None)

        resultado = modelos_service.deletar_modelo(modelo_id)

        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='deletar',
                entidade='modelo',
                entidade_id=modelo_id,
                dados_anteriores=modelo_anterior,
                detalhes=f"Modelo ID {modelo_id} deletado"
            )
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao deletar modelo: {e}')
        return jsonify({'erro': 'Erro ao deletar modelo'}), 500