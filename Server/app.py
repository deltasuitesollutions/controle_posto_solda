import os
import sys
from pathlib import Path

# Adiciona o diretório raiz ao path ANTES das importações
BASE_DIR = Path(__file__).parent.parent.resolve()
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import secrets
import logging
from datetime import timedelta
from typing import Optional

from flask import Flask, send_from_directory
from flask_cors import CORS

WEB_DIR = BASE_DIR / 'Web' / 'dist'


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


def inicializar_banco_dados():
    try:
        from database.setup_database import criar_banco_dados
        criar_banco_dados()
        return True
    except Exception as e:
        logging.error(f"Erro ao inicializar banco: {e}")
        return False


def configure_cors(app: Flask):
    is_prod = os.getenv('FLASK_ENV') == 'production'
    
    if is_prod:
        CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
             supports_credentials=True)
    else:
        CORS(app, origins='*', supports_credentials=True)


def register_blueprints(app: Flask):
    from Server.controller import (
        producao_controller,
        registros_controller,
        tags_controller,
        csv_controller,
        funcionarios_controller,
        modelos_controller,
        posto_configuracao_controller,
        pecas_controller
    )
    
    app.register_blueprint(producao_controller.producao_bp)
    app.register_blueprint(registros_controller.registros_bp)
    app.register_blueprint(tags_controller.tags_bp)
    app.register_blueprint(csv_controller.csv_bp)
    app.register_blueprint(funcionarios_controller.funcionarios_bp)
    app.register_blueprint(modelos_controller.modelos_bp)
    app.register_blueprint(posto_configuracao_controller.posto_configuracao_bp)
    app.register_blueprint(pecas_controller.pecas_bp)

def register_web_routes(app: Flask):
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        if path and (WEB_DIR / path).exists():
            return send_from_directory(WEB_DIR, path)
        return send_from_directory(WEB_DIR, 'index.html')


def create_app(config: Optional[dict] = None) -> Flask:
    app = Flask(__name__)
    
    app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    
    if config:
        app.config.update(config)
    
    configure_cors(app)
    register_blueprints(app)
    register_web_routes(app)
    
    return app


app = create_app()

if __name__ != '__main__' and os.getenv('FLASK_ENV') != 'test':
    setup_logging()
    inicializar_banco_dados()


if __name__ == '__main__':
    setup_logging()
    logger = logging.getLogger(__name__)
    
    if not inicializar_banco_dados():
        logger.warning("Banco de dados não inicializado")
    
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '8000'))
    debug = os.getenv('FLASK_ENV') != 'production'
    
    logger.info(f"Servidor iniciando em http://{host}:{port}")
    app.run(debug=debug, host=host, port=port)
