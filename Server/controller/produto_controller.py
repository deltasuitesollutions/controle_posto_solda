from flask import Blueprint, request, jsonify
from Server.services import produto_service
from Server.services import audit_service
from Server.utils.audit_helper import obter_usuario_id_da_requisicao

produtos_bp = Blueprint('produtos', __name__, url_prefix='/api/produtos')

@produtos_bp.route('', methods=['POST'])
def criarProduto():
    # Criar
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        nome = data.get('nome')

        resultado = produto_service.criar_produto(nome)
        if 'erro' in resultado:
            return jsonify(resultado), 400
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='criar',
                entidade='produto',
                entidade_id=resultado.get('id'),
                dados_novos={'nome': nome},
                detalhes=f"Produto '{nome}' criado"
            )
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao criar modelo: {e}')
        return jsonify({'erro': 'Erro ao criar produto'}), 500
       
@produtos_bp.route('/<int:produto_id>', methods=['PUT'])
def atualizarProduto(produto_id):
    # Atualizar
    try:
        data = request.get_json()

        if not data:
            return jsonify({'erro': 'Dados não fornecidos'}), 400
        
        nome = data.get('nome')

        # Buscar dados anteriores para o log
        produtos_anteriores = produto_service.listar_produtos()
        produto_anterior = next((p for p in produtos_anteriores if p.get('id') == produto_id), None)

        resultado = produto_service.atualizar_produto(produto_id, nome)
        if 'erro' in resultado:
            return jsonify(resultado), 201
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='atualizar',
                entidade='produto',
                entidade_id=produto_id,
                dados_anteriores=produto_anterior,
                dados_novos={'nome': nome} if nome else None,
                detalhes=f"Produto ID {produto_id} atualizado"
            )
        
        return jsonify(resultado)
    except Exception as e:
        print(f'Erro ao atualizar produto: {e}')
        return jsonify({'erro': 'Erro ao atualizar produto'}), 500
    
@produtos_bp.route('/<int:produto_id>', methods=['DELETE'])
def deletarProduto(produto_id):
    # Deletar
    try:
        # Buscar dados do produto antes de deletar
        produtos_anteriores = produto_service.listar_produtos()
        produto_anterior = next((p for p in produtos_anteriores if p.get('id') == produto_id), None)

        resultado = produto_service.deletar_produto(produto_id)

        if 'erro' in resultado:
            return jsonify(resultado), 201
        
        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='deletar',
                entidade='produto',
                entidade_id=produto_id,
                dados_anteriores=produto_anterior,
                detalhes=f"Produto ID {produto_id} deletado"
            )
        
        return jsonify(resultado)
    except Exception as e:
        return jsonify({'erro': 'Erro ao deletar modelo'}), 500
    

@produtos_bp.route('', methods=['GET'])
def listar_produtos():  
    # Listar
    try:
        resultado = produto_service.listar_produtos()  
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao listar produtos: {e}')
        return jsonify({'erro': 'Erro ao listar produtos'}), 500
    

@produtos_bp.route('/<int:produto_id>', methods=['GET'])
def buscar_produto(produto_id):
    # Buscar produto por ID
    try:
        resultado = produto_service.buscar_produto_por_id(produto_id)  
        
        if 'erro' in resultado:
            return jsonify(resultado), 201
        
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao buscar produto: {e}')
        return jsonify({'erro': 'Erro ao buscar produto'}), 500