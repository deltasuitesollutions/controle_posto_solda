import os
import sys
import logging
from typing import Optional
from flask import Flask
from flask_cors import CORS

# Adicionar o diretório raiz ao path para permitir imports absolutos
# Isso é necessário quando o arquivo é executado diretamente do diretório Server
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from Server.config import get_flask_config, get_cors_origins
from Server.blueprints import register_blueprints
from Server.websocket_manager import init_socketio

logger = logging.getLogger(__name__)


def configure_cors(app: Flask):
    """Configura CORS para a aplicação"""
    cors_origins = get_cors_origins()
    
    CORS(app, 
         origins=cors_origins,
         supports_credentials=True,
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
         allow_headers=['Content-Type', 'Authorization', 'X-User-Id'],
         expose_headers=['Content-Type'])
    
    logger.info(f"CORS configurado: {cors_origins}")


def create_app(config: Optional[dict] = None):
    app = Flask(__name__)
    
    # Configurar Flask
    flask_config = get_flask_config()
    app.config.update(flask_config)
    
    if config:
        app.config.update(config)
    
    # Configurar CORS
    configure_cors(app)
    
    # Inicializar SocketIO
    socketio = init_socketio(app)
    
    # Registrar blueprints
    register_blueprints(app)
    
    # Registrar eventos do WebSocket (se necessário no futuro)
    try:
        from Server.websocket_manager import register_socketio_events
        register_socketio_events(socketio)
    except ImportError as e:
        logger.warning(f"WebSocket manager não encontrado: {e}")
    except Exception as e:
        logger.error(f"Erro ao registrar eventos do WebSocket: {e}")
    
    return app, socketio


app, socketio = create_app()


def setup_logging():
    """Configura o logging da aplicação"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


if __name__ == '__main__':
    setup_logging()
    logger = logging.getLogger(__name__)
    
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '8000'))
    debug = os.getenv('FLASK_ENV') != 'production'
    
    logger.info(f"API REST iniciando em http://{host}:{port}")
    logger.info(f"Modo debug: {debug}")
    
    socketio.run(
        app, 
        host=host, 
        port=port, 
        debug=debug, 
        allow_unsafe_werkzeug=True,
        use_reloader=False
    )