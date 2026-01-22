from flask import Blueprint, jsonify, request
from Server.services import usuarios_service
from Server.services import audit_service
from Server.utils.audit_helper import obter_usuario_id_da_requisicao

usuarios_bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')


# Endpoint de login/autenticação
@usuarios_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400

        username = data.get('username')
        senha = data.get('senha')

        if not username or not senha:
            return jsonify({"erro": "Username e senha são obrigatórios"}), 400

        usuario = usuarios_service.autenticar_usuario(username, senha)

        if not usuario:
            return jsonify({"erro": "Usuário ou senha inválidos"}), 401

        return jsonify(usuario), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Lista usuários ativos
@usuarios_bp.route('', methods=['GET'])
def listar_usuarios():
    try:
        usuarios = usuarios_service.listar_usuarios()
        return jsonify(usuarios)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Lista todos os usuários
@usuarios_bp.route('/todos', methods=['GET'])
def listar_todos_usuarios():
    try:
        usuarios = usuarios_service.listar_todos_usuarios()
        return jsonify(usuarios)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Cria usuário
@usuarios_bp.route('', methods=['POST'])
def criar_usuario():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400

        username = data.get('username')
        nome = data.get('nome')
        senha = data.get('senha')
        role = data.get('role', 'admin')
        ativo = data.get('ativo', True)

        if not username or not nome or not senha:
            return jsonify({"erro": "Username, nome e senha são obrigatórios"}), 400

        usuario = usuarios_service.criar_usuario(
            username,
            nome,
            senha,
            role,
            ativo
        )

        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='criar',
                entidade='usuario',
                entidade_id=usuario.get('id'),
                dados_novos={'username': username, 'nome': nome, 'role': role, 'ativo': ativo},
                detalhes=f"Usuário '{username}' criado"
            )

        return jsonify(usuario), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Editar usuário
@usuarios_bp.route('/<int:usuario_id>', methods=['PUT'])
def atualizar_usuario(usuario_id):
    try:
        data = request.get_json()

        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400

        username = data.get('username')
        nome = data.get('nome')
        role = data.get('role')
        ativo = data.get('ativo')
        senha = data.get('senha')

        # Buscar dados anteriores para o log
        usuario_anterior = usuarios_service.listar_todos_usuarios()
        usuario_anterior_dict = next((u for u in usuario_anterior if u.get('id') == usuario_id), None)

        usuario = usuarios_service.atualizar_usuario(
            usuario_id,
            username,
            nome,
            role,
            ativo,
            senha
        )

        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            dados_novos = {}
            if username is not None:
                dados_novos['username'] = username
            if nome is not None:
                dados_novos['nome'] = nome
            if role is not None:
                dados_novos['role'] = role
            if ativo is not None:
                dados_novos['ativo'] = ativo
            if senha is not None:
                dados_novos['senha'] = '***'  # Não registrar senha
            
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='atualizar',
                entidade='usuario',
                entidade_id=usuario_id,
                dados_anteriores=usuario_anterior_dict,
                dados_novos=dados_novos if dados_novos else None,
                detalhes=f"Usuário ID {usuario_id} atualizado"
            )

        return jsonify(usuario), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Deletar usuário
@usuarios_bp.route('/<int:usuario_id>', methods=['DELETE'])
def deletar_usuario(usuario_id):
    try:
        # Buscar dados do usuário antes de deletar
        usuario_anterior = usuarios_service.listar_todos_usuarios()
        usuario_anterior_dict = next((u for u in usuario_anterior if u.get('id') == usuario_id), None)

        usuarios_service.deletar_usuario(usuario_id)

        # Registrar log de auditoria
        usuario_id_requisicao = obter_usuario_id_da_requisicao()
        if usuario_id_requisicao:
            audit_service.registrar_acao(
                usuario_id=usuario_id_requisicao,
                acao='deletar',
                entidade='usuario',
                entidade_id=usuario_id,
                dados_anteriores=usuario_anterior_dict,
                detalhes=f"Usuário ID {usuario_id} deletado"
            )

        return jsonify({"mensagem": "Usuário deletado com sucesso"}), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

