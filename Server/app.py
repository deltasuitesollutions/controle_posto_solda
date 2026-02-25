import logging
import os
import sys
from pathlib import Path

# Configure sys.path BEFORE any Server.* imports
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from flask import Flask
from flask_cors import CORS
from Server.blueprints import register_blueprints
from Server.websocket_manager import init_socketio, register_socketio_events
from Server.models.database import DatabaseConnection


class NoOptionsLogFilter(logging.Filter):
    """Evita que requisições OPTIONS (preflight CORS) apareçam no log."""
    def filter(self, record):
        return "OPTIONS" not in record.getMessage()


def create_app():
    app = Flask(__name__)

    # Não logar requisições OPTIONS (preflight CORS)
    werkzeug_log = logging.getLogger("werkzeug")
    werkzeug_log.addFilter(NoOptionsLogFilter())

    # CORS liberado para tudo
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True
    )

    socketio = init_socketio(app)
    # Garantir que o app tenha referência ao SocketIO (evita "SocketIO não inicializado" em qualquer contexto)
    app.extensions["socketio"] = socketio

    # Registrar eventos do WebSocket
    register_socketio_events(socketio)

    register_blueprints(app)

    # Garantir usuários padrão (admin, operador, master) mesmo se init_database não rodou
    try:
        DatabaseConnection.ensure_default_usuarios()
    except Exception:
        pass

    # Corrigir FK constraint problemática da tabela operacoes_canceladas
    # (remove a FK que deletava cancelamentos quando o registro era removido)
    try:
        DatabaseConnection.fix_cancelamentos_fk()
    except Exception:
        pass

    # Garantir que a coluna dispositivo_nome exista na tabela registros_producao
    # (armazena o nome do dispositivo Raspberry diretamente no registro)
    try:
        DatabaseConnection.ensure_dispositivo_nome_column()
    except Exception:
        pass

    return app, socketio


app, socketio = create_app()

if __name__ == "__main__":
    # Config servidor/WebSocket (env): FLASK_HOST, FLASK_PORT, FLASK_ENV, SOCKETIO_ASYNC_MODE (ver websocket_manager)
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", 8000))
    debug = os.getenv("FLASK_ENV") != "production"

    socketio.run(
        app,
        host=host,
        port=port,
        debug=debug,
        allow_unsafe_werkzeug=True,
        use_reloader=False
    )
