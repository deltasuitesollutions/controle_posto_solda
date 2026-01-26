import os
import sys
import logging
from typing import Optional
from flask import Flask
from flask_cors import CORS

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from Server.config import get_cors_origins
from Server.blueprints import register_blueprints
from Server.websocket_manager import init_socketio

# Importar modelos para garantir que sejam carregados
try:
    from Server.models import DispositivoRaspberry
except ImportError:
    pass

# Importar services para garantir que sejam carregados
try:
    from Server.services import dispositivo_raspberry_service
except ImportError:
    pass

logger = logging.getLogger(__name__)


def configure_cors(app: Flask):
    """Configura CORS para a aplicação"""
    cors_origins = get_cors_origins()
    
    cors_kwargs = {
        'origins': cors_origins,
        'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        'allow_headers': ['Content-Type', 'Authorization', 'X-User-Id'],
        'expose_headers': ['Content-Type']
    }
    
    if cors_origins != '*':
        cors_kwargs['supports_credentials'] = True
    
    CORS(app, **cors_kwargs)
    
    logger.info(f"CORS configurado: {cors_origins}")


def create_app(config: Optional[dict] = None):
    app = Flask(__name__)
    
    # flask_config = get_flask_config()
    # app.config.update(flask_config)
    
    if config:
        app.config.update(config)
    
    configure_cors(app)
    
    socketio = init_socketio(app)
    
    @app.before_request
    def handle_before_request():
        """Garante que requisições WebSocket não sejam bloqueadas"""
        from flask import request
        if request.path.startswith('/socket.io/'):
            pass
    
    register_blueprints(app)
    
    try:
        from Server.websocket_manager import register_socketio_events
        register_socketio_events(socketio)
    except ImportError as e:
        logger.warning(f"WebSocket manager não encontrado: {e}")
    except Exception as e:
        logger.error(f"Erro ao registrar eventos do WebSocket: {e}")
    
    @app.errorhandler(500)
    def handle_500_error(e):
        """Trata erros 500, especialmente relacionados a WebSocket"""
        from flask import request
        import traceback
        
        if request.path.startswith('/socket.io/'):
            logger.error(f"Erro 500 em requisição WebSocket: {str(e)}")
            logger.debug(traceback.format_exc())
            return None
        
        error_msg = str(e)
        logger.error(f"Erro 500: {error_msg}")
        logger.debug(traceback.format_exc())
        return {"error": "Internal server error"}, 500
    
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
        use_reloader=False,
        log_output=True
    )