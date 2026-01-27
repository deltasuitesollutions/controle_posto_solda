import os
import sys
from pathlib import Path

# Configure sys.path BEFORE any Server.* imports
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from flask import Flask
from flask_cors import CORS
from blueprints import register_blueprints
from websocket_manager import init_socketio

def create_app():
    app = Flask(__name__)

    # CORS liberado para tudo
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True
    )

    socketio = init_socketio(app)

    register_blueprints(app)

    return app, socketio


app, socketio = create_app()

if __name__ == "__main__":
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
