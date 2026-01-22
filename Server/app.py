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
from flask_socketio import SocketIO

WEB_DIR = BASE_DIR / 'Web' / 'dist'

# Instância global do SocketIO (será inicializada no create_app)
socketio = None


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
        pecas_controller,
        produto_controller,
        linha_controller,
        sublinha_controller,
        posto_controller,
        operacao_controller,
        ihm_controller,
        dashboard_controller,
        usuarios_controller,
        audit_controller,
        cancelamento_controller,
        tags_temporarias_controller,
        device_info_controller
    )
    
    app.register_blueprint(producao_controller.producao_bp)
    app.register_blueprint(registros_controller.registros_bp)
    app.register_blueprint(tags_controller.tags_bp)
    app.register_blueprint(csv_controller.csv_bp)
    app.register_blueprint(funcionarios_controller.funcionarios_bp)
    app.register_blueprint(modelos_controller.modelos_bp)
    app.register_blueprint(posto_configuracao_controller.posto_configuracao_bp)
    app.register_blueprint(pecas_controller.pecas_bp)
    app.register_blueprint(produto_controller.produtos_bp)
    app.register_blueprint(linha_controller.linhas_bp)
    app.register_blueprint(sublinha_controller.sublinhas_bp)
    app.register_blueprint(posto_controller.postos_bp)
    app.register_blueprint(operacao_controller.operacoes_bp)
    app.register_blueprint(ihm_controller.ihm_bp)
    app.register_blueprint(dashboard_controller.dashboard_bp)
    app.register_blueprint(usuarios_controller.usuarios_bp)
    app.register_blueprint(audit_controller.audit_bp)
    app.register_blueprint(cancelamento_controller.cancelamento_bp)
    app.register_blueprint(tags_temporarias_controller.tags_temporarias_bp)
    app.register_blueprint(device_info_controller.device_info_bp)

def register_web_routes(app: Flask):
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        if path and (WEB_DIR / path).exists():
            return send_from_directory(WEB_DIR, path)
        return send_from_directory(WEB_DIR, 'index.html')


def register_socketio_events(socketio_instance: SocketIO):
    """Registra os eventos do WebSocket"""
    from Server.services import dashboard_websocket_service
    from flask_socketio import emit
    
    @socketio_instance.on('connect')
    def handle_connect(auth):
        """Cliente conectado"""
        from flask import request
        logging.info(f'✅ Cliente WebSocket conectado (SID: {request.sid})')
        emit('connected', {'status': 'connected', 'message': 'Conectado ao servidor'})
    
    @socketio_instance.on('disconnect')
    def handle_disconnect():
        """Cliente desconectado"""
        from flask import request
        logging.info(f'❌ Cliente WebSocket desconectado (SID: {request.sid})')
    
    @socketio_instance.on('subscribe_dashboard')
    def handle_subscribe_dashboard():
        """Cliente se inscreve para receber atualizações do dashboard"""
        from flask import request
        logging.info(f'📡 Cliente se inscreveu para atualizações do dashboard (SID: {request.sid})')
        # Enviar dados iniciais imediatamente
        try:
            dashboard_websocket_service.enviar_atualizacao_dashboard(socketio_instance)
            logging.info(f'✅ Dados iniciais enviados ao cliente (SID: {request.sid})')
        except Exception as e:
            logging.error(f'❌ Erro ao enviar dados iniciais: {e}')
            import traceback
            logging.error(traceback.format_exc())


def create_app(config: Optional[dict] = None):
    global socketio
    
    app = Flask(__name__)
    
    app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    
    if config:
        app.config.update(config)
    
    # Configurar CORS para SocketIO
    is_prod = os.getenv('FLASK_ENV') == 'production'
    cors_allowed_origins = ['http://localhost:5173', 'http://127.0.0.1:5173'] if is_prod else '*'
    
    # Inicializar SocketIO
    socketio = SocketIO(
        app,
        cors_allowed_origins=cors_allowed_origins,
        async_mode='threading',
        logger=True,
        engineio_logger=False
    )
    
    configure_cors(app)
    register_blueprints(app)
    register_web_routes(app)
    
    # Registrar eventos do SocketIO
    register_socketio_events(socketio)
    
    return app, socketio


app, socketio = create_app()

if __name__ != '__main__' and os.getenv('FLASK_ENV') != 'test':
    setup_logging()
    inicializar_banco_dados()
    # Limpar tags temporárias expiradas na inicialização
    try:
        from Server.services import tags_temporarias_service
        tags_temporarias_service.limpar_tags_expiradas_automaticamente()
    except Exception as e:
        logging.warning(f"Erro ao limpar tags temporárias expiradas na inicialização: {e}")


if __name__ == '__main__':
    setup_logging()
    logger = logging.getLogger(__name__)
    
    if not inicializar_banco_dados():
        logger.warning("Banco de dados não inicializado")
    
    # Limpar tags temporárias expiradas na inicialização
    try:
        from Server.services import tags_temporarias_service
        tags_temporarias_service.limpar_tags_expiradas_automaticamente()
        logger.info("Tags temporárias expiradas limpas na inicialização")
    except Exception as e:
        logger.warning(f"Erro ao limpar tags temporárias expiradas na inicialização: {e}")
    
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '8000'))
    debug = os.getenv('FLASK_ENV') != 'production'
    
    logger.info(f"Servidor iniciando em http://{host}:{port}")
    
    # Iniciar serviço de monitoramento do dashboard
    try:
        from Server.services import dashboard_websocket_service
        dashboard_websocket_service.iniciar_monitoramento(socketio)
        logger.info("Serviço de monitoramento do dashboard iniciado")
    except Exception as e:
        logger.warning(f"Erro ao iniciar serviço de monitoramento: {e}")
    
    # Usar socketio.run em vez de app.run para suportar WebSockets
    socketio.run(app, debug=debug, host=host, port=port, allow_unsafe_werkzeug=True)
