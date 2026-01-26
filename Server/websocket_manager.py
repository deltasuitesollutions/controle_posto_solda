import os
import time
import logging
from typing import Optional
from flask import Flask
from flask_socketio import SocketIO
from Server.services import dashboard_service
from Server.config import get_socketio_cors_origins

logger = logging.getLogger(__name__)

# Instância global do SocketIO
_socketio_instance: Optional[SocketIO] = None
_last_update_time = 0
_throttle_interval = 3


def init_socketio(app: Flask) -> SocketIO:
    """Inicializa e retorna a instância do SocketIO"""
    global _socketio_instance
    
    _socketio_instance = SocketIO(
        app,
        cors_allowed_origins=get_socketio_cors_origins(),
        async_mode='threading',
        logger=os.getenv('FLASK_ENV') != 'production',
        engineio_logger=False
    )
    
    logger.info("SocketIO inicializado")
    return _socketio_instance


def get_socketio() -> Optional[SocketIO]:
    """Retorna a instância do SocketIO"""
    return _socketio_instance


def register_socketio_events(socketio_instance: SocketIO):
    """Registra eventos do SocketIO (mantido para compatibilidade)"""
    # A instância já foi criada em init_socketio, apenas confirma
    logger.info("Eventos do WebSocket registrados")

def enviar_atualizacao_dashboard():
    """Envia atualização do dashboard via WebSocket"""
    global _last_update_time
    
    socketio_instance = get_socketio()
    if not socketio_instance:
        return
    
    current_time = time.time()
    if current_time - _last_update_time < _throttle_interval:
        return
    
    _last_update_time = current_time
    
    try:
        dados = dashboard_service.buscar_postos_em_uso()
        socketio_instance.emit('dashboard_update', dados)
    except Exception as e:
        logger.error(f"Erro ao enviar atualização do dashboard: {e}")

