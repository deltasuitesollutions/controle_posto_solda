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
    
    # Configurar CORS, mas não interferir com rotas do Socket.IO
    CORS(app, 
         origins=cors_origins,
         supports_credentials=True,
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
         allow_headers=['Content-Type', 'Authorization', 'X-User-Id'],
         expose_headers=['Content-Type'],
         resources={r"/api/*": {"origins": cors_origins}})
    
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
    
    # Inicializar SocketIO ANTES de registrar blueprints
    # Isso garante que o SocketIO seja configurado corretamente
    socketio = init_socketio(app)
    
    # Middleware para garantir que requisições WebSocket sejam tratadas corretamente
    @app.before_request
    def handle_before_request():
        """Garante que requisições WebSocket não sejam bloqueadas"""
        from flask import request
        # Permitir que o SocketIO processe requisições de WebSocket
        if request.path.startswith('/socket.io/'):
            # Não fazer nada, deixar o SocketIO processar
            pass
    
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
    
    # Handler de erro para requisições WebSocket
    @app.errorhandler(500)
    def handle_500_error(e):
        """Trata erros 500, especialmente relacionados a WebSocket"""
        from flask import request
        import traceback
        
        # Se for uma requisição WebSocket, não retornar resposta JSON
        # Deixar o SocketIO tratar o erro
        if request.path.startswith('/socket.io/'):
            logger.error(f"Erro 500 em requisição WebSocket: {str(e)}")
            logger.debug(traceback.format_exc())
            # Retornar None para deixar o SocketIO tratar
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
    
    # Configurações adicionais para melhor compatibilidade com WebSocket
    socketio.run(
        app, 
        host=host, 
        port=port, 
        debug=debug, 
        allow_unsafe_werkzeug=True,
        use_reloader=False,
        log_output=True
    )