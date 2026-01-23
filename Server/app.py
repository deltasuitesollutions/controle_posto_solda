import os
import sys
from pathlib import Path
import secrets
import logging
from datetime import timedelta
from typing import Optional

from flask import Flask, request
from flask_cors import CORS
from flask_socketio import SocketIO

# Adiciona o diretório raiz ao path
BASE_DIR = Path(__file__).parent.parent.resolve()
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Instância global do SocketIO
socketio = None


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


def configure_cors(app: Flask):
    """Configura CORS simplificado para APIs REST"""
    is_prod = os.getenv('FLASK_ENV') == 'production'
    
    if is_prod:
        # Em produção: origens específicas
        cors_origins_env = os.getenv('CORS_ORIGINS', '')
        if cors_origins_env:
            cors_origins = [origin.strip() for origin in cors_origins_env.split(',')]
        else:
            cors_origins = ['http://localhost:5173', 'http://127.0.0.1:5173']
            
        CORS(app, 
             origins=cors_origins, 
             supports_credentials=True,
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
             allow_headers=['Content-Type', 'Authorization', 'X-User-Id'],
             expose_headers=['Content-Type'])
        logging.info(f"CORS configurado para produção: {cors_origins}")
    else:
        # Desenvolvimento: aceita origens comuns de desenvolvimento
        # Lista de origens comuns para desenvolvimento local
        cors_origins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            'http://localhost:8080',
            'http://127.0.0.1:8080'
        ]
        
        CORS(app, 
             origins=cors_origins,
             supports_credentials=True,
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
             allow_headers=['Content-Type', 'Authorization', 'X-User-Id'],
             expose_headers=['Content-Type'],
             max_age=3600)
        logging.info(f"CORS configurado para desenvolvimento: {cors_origins}")


def register_blueprints(app: Flask):
    """Registra todos os blueprints da API"""
    from Server.controller import (
        producao_controller,
        registros_controller,
        tags_controller,
        csv_controller,
        funcionarios_controller,
        modelos_controller,
        pecas_controller,
        produto_controller,
        linha_controller,
        sublinha_controller,
        posto_controller,
        operacao_controller,
        ihm_controller,
        dashboard_controller,
        usuarios_controller,
        cancelamento_controller,
        tags_temporarias_controller
    )
    
    # Registra todos os blueprints
    app.register_blueprint(producao_controller.producao_bp)
    app.register_blueprint(registros_controller.registros_bp)
    app.register_blueprint(tags_controller.tags_bp)
    app.register_blueprint(csv_controller.csv_bp)
    app.register_blueprint(funcionarios_controller.funcionarios_bp)
    app.register_blueprint(modelos_controller.modelos_bp)
    app.register_blueprint(pecas_controller.pecas_bp)
    app.register_blueprint(produto_controller.produtos_bp)
    app.register_blueprint(linha_controller.linhas_bp)
    app.register_blueprint(sublinha_controller.sublinhas_bp)
    app.register_blueprint(posto_controller.postos_bp)
    app.register_blueprint(operacao_controller.operacoes_bp)
    app.register_blueprint(ihm_controller.ihm_bp)
    app.register_blueprint(dashboard_controller.dashboard_bp)
    app.register_blueprint(usuarios_controller.usuarios_bp)
    app.register_blueprint(cancelamento_controller.cancelamento_bp)
    app.register_blueprint(tags_temporarias_controller.tags_temporarias_bp)
    
    logging.info(f"Registrados {len(app.blueprints)} blueprints")


def create_app(config: Optional[dict] = None):
    global socketio
    
    app = Flask(__name__)
    
    # Configurações básicas
    app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    
    if config:
        app.config.update(config)
    
    # Configurar CORS
    configure_cors(app)
    
    # Configuração CORS para SocketIO
    is_prod = os.getenv('FLASK_ENV') == 'production'
    cors_origins_env = os.getenv('CORS_ORIGINS', '')
    if is_prod:
        if cors_origins_env:
            cors_allowed_origins = [origin.strip() for origin in cors_origins_env.split(',')]
        else:
            cors_allowed_origins = ['http://localhost:5173', 'http://127.0.0.1:5173']
    else:
        cors_allowed_origins = '*'
    
    # Inicializar SocketIO
    socketio = SocketIO(
        app,
        cors_allowed_origins=cors_allowed_origins,
        async_mode='threading',
        logger=os.getenv('FLASK_ENV') != 'production',
        engineio_logger=False
    )
    
    # Registrar blueprints
    register_blueprints(app)
    
    # Configurar WebSocket events
    try:
        from Server.websocket_manager import register_socketio_events
        register_socketio_events(socketio)
        logging.info("Eventos do WebSocket registrados")
    except ImportError as e:
        logging.warning(f"WebSocket manager não encontrado: {e}")
    except Exception as e:
        logging.error(f"Erro ao registrar eventos do WebSocket: {e}")
    
    return app, socketio


# Criar a aplicação
app, socketio = create_app()


def inicializar_banco_dados():
    """Inicializa o banco de dados"""
    try:
        from database.setup_database import criar_banco_dados
        criar_banco_dados()
        logging.info("Banco de dados inicializado")
        return True
    except ImportError as e:
        logging.error(f"Módulo de banco de dados não encontrado: {e}")
        return False
    except Exception as e:
        logging.error(f"Erro ao inicializar banco de dados: {e}")
        return False


def limpar_tags_temporarias():
    """Limpa tags temporárias expiradas"""
    try:
        from Server.services import tags_temporarias_service
        tags_temporarias_service.limpar_tags_expiradas_automaticamente()
        logging.info("Tags temporárias limpas")
    except ImportError as e:
        logging.warning(f"Serviço de tags temporárias não encontrado: {e}")
    except Exception as e:
        logging.warning(f"Erro ao limpar tags temporárias: {e}")


if __name__ == '__main__':
    setup_logging()
    logger = logging.getLogger(__name__)
    
    # Inicializar banco de dados
    if not inicializar_banco_dados():
        logger.warning("Banco de dados não foi inicializado")
    
    # Limpar tags temporárias
    limpar_tags_temporarias()
    
    # Configuração do servidor
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '8000'))
    debug = os.getenv('FLASK_ENV') != 'production'
    
    logger.info(f"API REST iniciando em http://{host}:{port}")
    logger.info(f"Modo debug: {debug}")
    
    # Iniciar servidor com SocketIO
    socketio.run(
        app, 
        host=host, 
        port=port, 
        debug=debug, 
        allow_unsafe_werkzeug=True,
        use_reloader=False
    )