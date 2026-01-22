from flask import Blueprint, request, jsonify
from Server.services import operacao_service
from Server.services import audit_service
from Server.utils.audit_helper import obter_usuario_id_da_requisicao

operacoes_bp = Blueprint('operacoes', __name__, url_prefix='/api/operacoes')


@operacoes_bp.route('', methods=['GET'])
def listar_operacoes():
    """Lista todas as operações"""
    try:
        operacoes = operacao_service.listar_operacoes()
        return jsonify(operacoes), 200
    except Exception as e:
        print(f'Erro ao listar operações: {e}')
        return jsonify({'erro': 'Erro ao buscar operações'}), 500


@operacoes_bp.route('/<int:operacao_id>', methods=['GET'])
def buscar_operacao(operacao_id):
    """Busca uma operação pelo ID"""
    try:
        resultado = operacao_service.buscar_operacao_por_id(operacao_id)
        
        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar operação: {e}')
        return jsonify({'erro': 'Erro ao buscar operação'}), 500


@operacoes_bp.route('', methods=['POST'])
def criar_operacao():
    """Cria uma nova operação"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        operacao = data.get('operacao')
        produto = data.get('produto')
        modelo = data.get('modelo')
        linha = data.get('linha')
        posto = data.get('posto')
        totens = data.get('totens', [])
        pecas = data.get('pecas', [])
        codigos = data.get('codigos', [])

        if not operacao or not produto or not modelo or not linha or not posto:
            return jsonify({'erro': 'Operação, produto, modelo, linha e posto são obrigatórios'}), 400
        
        resultado = operacao_service.criar_operacao(
            operacao=operacao,
            produto=produto,
            modelo=modelo,
            linha=linha,
            posto=posto,
            totens=totens,
            pecas=pecas,
            codigos=codigos
        )

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='criar',
                entidade='operacao',
                entidade_id=resultado.get('id'),
                dados_novos={
                    'operacao': operacao,
                    'produto': produto,
                    'modelo': modelo,
                    'linha': linha,
                    'posto': posto,
                    'totens': totens,
                    'pecas': pecas,
                    'codigos': codigos
                },
                detalhes=f"Operação '{operacao}' criada"
            )
        
        return jsonify(resultado), 201
    except Exception as e:
        print(f'Erro ao criar operação: {e}')
        return jsonify({'erro': 'Erro ao criar operação'}), 500


@operacoes_bp.route('/<int:operacao_id>', methods=['PUT'])
def atualizar_operacao(operacao_id):
    """Atualiza uma operação existente"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        operacao = data.get('operacao')
        produto = data.get('produto')
        modelo = data.get('modelo')
        linha = data.get('linha')
        posto = data.get('posto')
        totens = data.get('totens')
        pecas = data.get('pecas')
        codigos = data.get('codigos')

        # Buscar dados anteriores para o log
        operacoes_anteriores = operacao_service.listar_operacoes()
        operacao_anterior = next((o for o in operacoes_anteriores if o.get('id') == operacao_id), None)

        resultado = operacao_service.atualizar_operacao(
            operacao_id=operacao_id,
            operacao=operacao,
            produto=produto,
            modelo=modelo,
            linha=linha,
            posto=posto,
            totens=totens,
            pecas=pecas,
            codigos=codigos
        )

        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            dados_novos = {}
            if operacao is not None:
                dados_novos['operacao'] = operacao
            if produto is not None:
                dados_novos['produto'] = produto
            if modelo is not None:
                dados_novos['modelo'] = modelo
            if linha is not None:
                dados_novos['linha'] = linha
            if posto is not None:
                dados_novos['posto'] = posto
            if totens is not None:
                dados_novos['totens'] = totens
            if pecas is not None:
                dados_novos['pecas'] = pecas
            if codigos is not None:
                dados_novos['codigos'] = codigos
            
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='atualizar',
                entidade='operacao',
                entidade_id=operacao_id,
                dados_anteriores=operacao_anterior,
                dados_novos=dados_novos if dados_novos else None,
                detalhes=f"Operação ID {operacao_id} atualizada"
            )
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao atualizar operação: {e}')
        return jsonify({'erro': 'Erro ao atualizar operação'}), 500


@operacoes_bp.route('/<int:operacao_id>', methods=['DELETE'])
def deletar_operacao(operacao_id):
    """Deleta uma operação"""
    try:
        # Buscar dados da operação antes de deletar
        operacoes_anteriores = operacao_service.listar_operacoes()
        operacao_anterior = next((o for o in operacoes_anteriores if o.get('id') == operacao_id), None)

        resultado = operacao_service.deletar_operacao(operacao_id)

        if 'erro' in resultado:
            return jsonify(resultado), 404
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='deletar',
                entidade='operacao',
                entidade_id=operacao_id,
                dados_anteriores=operacao_anterior,
                detalhes=f"Operação ID {operacao_id} deletada"
            )
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao deletar operação: {e}')
        return jsonify({'erro': 'Erro ao deletar operação'}), 500

