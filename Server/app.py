"""
Aplicação Flask - Motor principal
"""
from flask import Flask, send_from_directory, abort, request
from datetime import timedelta
import os
import sys
import secrets
import logging


def get_base_dir():
    """Retorna o diretório base da aplicação"""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BASE_DIR = get_base_dir()
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

FRONTEND_DIR = os.path.join(BASE_DIR, 'Frontend')

if not os.path.exists(FRONTEND_DIR):
    FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), 'Frontend')
    if not os.path.exists(FRONTEND_DIR):
        print(f"[AVISO] Diretório Frontend não encontrado em: {FRONTEND_DIR}")
        print(f"[AVISO] BASE_DIR: {BASE_DIR}")

def inicializar_banco_dados():
    """Verifica se o banco de dados existe, caso contrário cria automaticamente"""
    try:
        from Server.models.database import DatabaseConnection
        conn = DatabaseConnection.get_connection()
        conn.close()
        print("[OK] Conexão com banco de dados PostgreSQL estabelecida!")
    except Exception as e:
        print("[INFO] Banco de dados não encontrado ou não acessível. Criando automaticamente...")
        try:
            from database.setup_database import criar_banco_dados
            original_dir = os.getcwd()
            os.chdir(BASE_DIR)
            criar_banco_dados(force_recreate=False)
            os.chdir(original_dir)
            print("[OK] Banco de dados criado com sucesso!")
        except Exception as setup_error:
            print(f"[ERRO] Falha ao criar banco de dados: {setup_error}")
            print("[INFO] Execute: python database/setup_database.py")
            print(f"[INFO] Certifique-se de que o PostgreSQL está rodando e o banco 'ManpowerControl' existe")

inicializar_banco_dados()

app = Flask(__name__)

app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

try:
    from flask_cors import CORS
    CORS(app, supports_credentials=True)
except ImportError:
    print("Aviso: flask-cors não instalado. CORS não estará disponível.")

from Server.controller import (
    producao_controller,
    registros_controller,
    tags_controller,
    csv_controller,
    funcionarios_controller,
    modelos_controller,
    limpeza_controller,
    posto_configuracao_controller,
    auth_controller
)

app.register_blueprint(producao_controller.producao_bp)
app.register_blueprint(registros_controller.registros_bp)
app.register_blueprint(tags_controller.tags_bp)
app.register_blueprint(csv_controller.csv_bp)
app.register_blueprint(funcionarios_controller.funcionarios_bp)
app.register_blueprint(modelos_controller.modelos_bp)
app.register_blueprint(limpeza_controller.limpeza_bp)
app.register_blueprint(posto_configuracao_controller.posto_configuracao_bp)
app.register_blueprint(auth_controller.auth_bp)

class SuppressAuthCheckLog(logging.Filter):
    """Filtro para suprimir logs de 401 na rota /api/auth/usuario"""
    def filter(self, record):
        msg = str(record.getMessage())
        if '401' in msg and '/api/auth/usuario' in msg:
            return False
        return True

werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.addFilter(SuppressAuthCheckLog())

@app.route('/')
def index():
    try:
        main_path = os.path.join(FRONTEND_DIR, 'main.html')
        if os.path.exists(main_path):
            return send_from_directory(FRONTEND_DIR, 'main.html')
        else:
            return send_from_directory(FRONTEND_DIR, 'index.html')
    except Exception as e:
        return f"""
        <html>
            <body>
                <h1>RFID Manpower Control</h1>
                <p>Arquivo Frontend/main.html não encontrado!</p>
                <p>Erro: {str(e)}</p>
                <p>Caminho procurado: {FRONTEND_DIR}</p>
                <p>Verifique se o arquivo main.html está na pasta Frontend/</p>
            </body>
        </html>
        """

@app.route('/login.html')
def login_page():
    """Serve a página de login"""
    try:
        file_path = os.path.join(FRONTEND_DIR, 'login.html')
        if os.path.exists(file_path):
            return send_from_directory(FRONTEND_DIR, 'login.html')
        else:
            abort(404, description="Página de login não encontrada")
    except Exception as e:
        print(f"Erro ao servir login.html: {e}")
        abort(500, description=f"Erro ao carregar página de login: {str(e)}")

@app.route('/cadastro.html')
def cadastro_page():
    """Serve a página de cadastro"""
    try:
        file_path = os.path.join(FRONTEND_DIR, 'cadastro.html')
        if os.path.exists(file_path):
            return send_from_directory(FRONTEND_DIR, 'cadastro.html')
        else:
            abort(404, description="Página de cadastro não encontrada")
    except Exception as e:
        print(f"Erro ao servir cadastro.html: {e}")
        abort(500, description=f"Erro ao carregar página de cadastro: {str(e)}")

@app.route('/recuperar_senha.html')
def recuperar_senha_page():
    """Serve a página de recuperação de senha"""
    try:
        file_path = os.path.join(FRONTEND_DIR, 'recuperar_senha.html')
        if os.path.exists(file_path):
            return send_from_directory(FRONTEND_DIR, 'recuperar_senha.html')
        else:
            abort(404, description="Página de recuperação de senha não encontrada")
    except Exception as e:
        print(f"Erro ao servir recuperar_senha.html: {e}")
        abort(500, description=f"Erro ao carregar página de recuperação de senha: {str(e)}")

@app.route('/<path:filename>')
def serve_frontend_files(filename):
    """Serve arquivos estáticos da pasta Frontend"""
    try:
        file_path = os.path.join(FRONTEND_DIR, filename)
        file_path = os.path.normpath(file_path)
        
        if not file_path.startswith(os.path.normpath(FRONTEND_DIR)):
            abort(403, description="Acesso negado")
        
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(FRONTEND_DIR, filename)
        else:
            abort(404, description=f"Arquivo não encontrado: {filename}")
    except Exception as e:
        print(f"Erro ao servir arquivo {filename}: {e}")
        abort(500, description=f"Erro ao carregar arquivo: {str(e)}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
