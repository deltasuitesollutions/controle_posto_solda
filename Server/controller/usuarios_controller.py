from flask import Blueprint, jsonify, request
from Server.services import usuarios_service
from Server.services import dispositivo_raspberry_service

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

        # Registrar dispositivo Raspberry (serial e hostname) APENAS UMA VEZ
        # A função registrar_dispositivo_raspberry() já verifica se existe antes de criar
        # Se já existir, retorna o existente. Se não existir, cria pela primeira vez.
        try:
            dispositivo = dispositivo_raspberry_service.registrar_dispositivo_raspberry()
            # Adicionar informações do dispositivo ao retorno do login
            usuario['dispositivo_serial'] = dispositivo.get('serial')
            usuario['dispositivo_hostname'] = dispositivo.get('hostname')
            usuario['dispositivo_id'] = dispositivo.get('id')
        except Exception as dispositivo_error:
            # Não falhar o login se houver erro ao capturar informações do dispositivo
            # Apenas logar o erro para debug
            print(f"Aviso: Erro ao capturar informações do dispositivo Raspberry no login: {dispositivo_error}")

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
        return jsonify({"mensagem": "Usuário deletado com sucesso"}), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

