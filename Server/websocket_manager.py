"""
WebSocket Manager - Gerencia atualizações em tempo real do dashboard
"""
import time
import logging
from typing import Optional
from flask_socketio import SocketIO
from Server.services import dashboard_service

logger = logging.getLogger(__name__)

_socketio_instance: Optional[SocketIO] = None
_last_update_time = 0
_throttle_interval = 3


def register_socketio_events(socketio_instance: SocketIO):
    """Registra e inicializa o WebSocket Manager"""
    global _socketio_instance
    _socketio_instance = socketio_instance
    logger.info("WebSocket Manager inicializado")


def enviar_atualizacao_dashboard():
    """Envia atualização do dashboard para todos os clientes conectados"""
    global _socketio_instance, _last_update_time
    
    if not _socketio_instance:
        return
    
    current_time = time.time()
    if current_time - _last_update_time < _throttle_interval:
        return
    
    _last_update_time = current_time
    
    try:
        dados = dashboard_service.buscar_postos_em_uso()
        _socketio_instance.emit('dashboard_update', dados)
    except Exception as e:
        logger.error(f"Erro ao enviar atualização do dashboard: {e}")

