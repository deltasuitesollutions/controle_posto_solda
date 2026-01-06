"""
Controller para rotas de autenticação
"""
from typing import Tuple, Union
from flask import Blueprint, jsonify, Response, request, session
from backend.services import auth_service

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/registro', methods=['POST'])
def registrar() -> Union[Response, Tuple[Response, int]]:
    """Registra um novo usuário"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        def ensure_utf8(value: str) -> str:
            """Garante que o valor seja uma string UTF-8 válida"""
            if value is None:
                return ''
            if isinstance(value, bytes):
                try:
                    return value.decode('utf-8')
                except UnicodeDecodeError:
                    return value.decode('latin-1', errors='replace')
            return str(value).encode('utf-8', errors='replace').decode('utf-8')
        
        username = ensure_utf8(data.get('username', ''))
        email = ensure_utf8(data.get('email', ''))
        senha = ensure_utf8(data.get('senha', ''))
        nome = ensure_utf8(data.get('nome', ''))
        
        if not username or not email or not senha or not nome:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400
        
        if len(senha) < 6:
            return jsonify({"error": "A senha deve ter no mínimo 6 caracteres"}), 400
        
        usuario = auth_service.criar_usuario(
            username=username,
            email=email,
            senha=senha,
            nome=nome
        )
        
        return jsonify({"status": "success", "data": usuario}), 201
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao registrar usuário: {error_details}")
        return jsonify({"error": str(e)}), 400


@auth_bp.route('/login', methods=['POST'])
def login() -> Union[Response, Tuple[Response, int]]:
    """Realiza login do usuário"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        username = data.get('username')
        senha = data.get('senha')
        
        if not username or not senha:
            return jsonify({"error": "Username e senha são obrigatórios"}), 400
        
        usuario = auth_service.autenticar_usuario(username=username, senha=senha)
        
        if not usuario:
            return jsonify({"error": "Usuário ou senha incorretos"}), 401
        
        # Marcar sessão como permanente para persistir após refresh
        session.permanent = True
        
        # Armazenar informações do usuário na sessão
        session['user_id'] = usuario['id']
        session['username'] = usuario['username']
        session['nome'] = usuario['nome']
        session['role'] = usuario.get('role', 'admin')  # Incluir role na sessão
        
        return jsonify({"status": "success", "data": usuario}), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao fazer login: {error_details}")
        return jsonify({"error": str(e)}), 400


@auth_bp.route('/logout', methods=['POST'])
def logout() -> Union[Response, Tuple[Response, int]]:
    """Realiza logout do usuário"""
    try:
        session.clear()
        return jsonify({"status": "success", "message": "Logout realizado com sucesso"}), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao fazer logout: {error_details}")
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/usuario', methods=['GET'])
def get_usuario_atual() -> Union[Response, Tuple[Response, int]]:
    """Retorna informações do usuário atual da sessão"""
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({"error": "Usuário não autenticado"}), 401
        
        usuario = auth_service.buscar_usuario_por_id(user_id)
        
        if not usuario:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        return jsonify({"status": "success", "data": usuario}), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao buscar usuário atual: {error_details}")
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/redefinir-senha', methods=['POST'])
def redefinir_senha() -> Union[Response, Tuple[Response, int]]:
    """Redefine a senha de um usuário"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        username = data.get('username')
        nova_senha = data.get('nova_senha')
        
        if not username or not nova_senha:
            return jsonify({"error": "Username e nova senha são obrigatórios"}), 400
        
        if len(nova_senha) < 6:
            return jsonify({"error": "A senha deve ter no mínimo 6 caracteres"}), 400
        
        auth_service.redefinir_senha(username=username, nova_senha=nova_senha)
        
        return jsonify({"status": "success", "message": "Senha redefinida com sucesso"}), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao redefinir senha: {error_details}")
        return jsonify({"error": str(e)}), 400



