from flask import Blueprint, request, jsonify
from Server.services import posto_service
from Server.services import audit_service
from Server.utils.audit_helper import obter_usuario_id_da_requisicao

postos_bp = Blueprint('postos', __name__, url_prefix='/api/postos')


# CRIAR
@postos_bp.route('', methods=['POST'])
def criar_posto():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        nome = data.get('nome')
        sublinha_id = data.get('sublinha_id')
        toten_id = data.get('toten_id')

        if not nome or sublinha_id is None or toten_id is None:
            return jsonify({'erro': 'Nome, sublinha_id e toten_id são obrigatórios'}), 400

        resultado = posto_service.criar_posto(nome, sublinha_id, toten_id)
        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='criar',
                entidade='posto',
                entidade_id=resultado.get('id'),
                dados_novos={'nome': nome, 'sublinha_id': sublinha_id, 'toten_id': toten_id},
                detalhes=f"Posto '{nome}' criado"
            )
        
        return jsonify(resultado), 201
    except Exception as e:
        print(f'Erro ao criar posto: {e}')
        return jsonify({'erro': 'Erro ao criar posto'}), 500


# ATUALIZAR
@postos_bp.route('/<int:posto_id>', methods=['PUT'])
def atualizar_posto(posto_id):
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        nome = data.get('nome')
        sublinha_id = data.get('sublinha_id')
        toten_id = data.get('toten_id')

        # Buscar dados anteriores para o log
        postos_anteriores = posto_service.listar_postos()
        posto_anterior = next((p for p in postos_anteriores if p.get('id') == posto_id), None)

        resultado = posto_service.atualizar_posto(posto_id, nome, sublinha_id, toten_id)
        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            dados_novos = {}
            if nome is not None:
                dados_novos['nome'] = nome
            if sublinha_id is not None:
                dados_novos['sublinha_id'] = sublinha_id
            if toten_id is not None:
                dados_novos['toten_id'] = toten_id
            
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='atualizar',
                entidade='posto',
                entidade_id=posto_id,
                dados_anteriores=posto_anterior,
                dados_novos=dados_novos if dados_novos else None,
                detalhes=f"Posto ID {posto_id} atualizado"
            )
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao atualizar posto: {e}')
        return jsonify({'erro': 'Erro ao atualizar posto'}), 500


# DELETAR
@postos_bp.route('/<int:posto_id>', methods=['DELETE'])
def deletar_posto(posto_id):
    try:
        # Buscar dados do posto antes de deletar
        postos_anteriores = posto_service.listar_postos()
        posto_anterior = next((p for p in postos_anteriores if p.get('id') == posto_id), None)

        resultado = posto_service.deletar_posto(posto_id)

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='deletar',
                entidade='posto',
                entidade_id=posto_id,
                dados_anteriores=posto_anterior,
                detalhes=f"Posto ID {posto_id} deletado"
            )
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao deletar posto: {e}')
        return jsonify({'erro': 'Erro ao deletar posto'}), 500


# LISTAR
@postos_bp.route('', methods=['GET'])
def listar_postos():  
    try:
        resultado = posto_service.listar_postos()
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao listar postos: {e}')
        return jsonify({'erro': 'Erro ao listar postos'}), 500


# BUSCAR POR ID
@postos_bp.route('/<int:posto_id>', methods=['GET'])
def buscar_posto(posto_id):
    try:
        resultado = posto_service.buscar_posto_por_id(posto_id)
        
        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar posto: {e}')
        return jsonify({'erro': 'Erro ao buscar posto'}), 500


# BUSCAR POR SUBLINHA
@postos_bp.route('/por-sublinha/<int:sublinha_id>', methods=['GET'])
def buscar_postos_por_sublinha(sublinha_id):
    try:
        resultado = posto_service.buscar_postos_por_sublinha(sublinha_id)
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar postos por sublinha: {e}')
        return jsonify({'erro': 'Erro ao buscar postos por sublinha'}), 500


# BUSCAR POR TOTEN
@postos_bp.route('/por-toten/<int:toten_id>', methods=['GET'])
def buscar_postos_por_toten(toten_id):
    try:
        resultado = posto_service.buscar_postos_por_toten(toten_id)
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar postos por toten: {e}')
        return jsonify({'erro': 'Erro ao buscar postos por toten'}), 500


# LISTAR TOTENS DISPONÍVEIS
@postos_bp.route('/totens-disponiveis', methods=['GET'])
def listar_totens_disponiveis():
    try:
        resultado = posto_service.listar_totens_disponiveis()
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao listar totens disponíveis: {e}')
        return jsonify({'erro': 'Erro ao listar totens disponíveis'}), 500

