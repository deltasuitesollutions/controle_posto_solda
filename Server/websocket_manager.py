import os
import time
import logging
from typing import Optional
from flask import Flask
from flask_socketio import SocketIO
from Server.services import dashboard_service

logger = logging.getLogger(__name__)

# Instância global do SocketIO
_socketio_instance: Optional[SocketIO] = None
_last_update_time = 0
_throttle_interval = 3


def init_socketio(app: Flask) -> SocketIO:
    """Inicializa e retorna a instância do SocketIO"""
    global _socketio_instance

    # Em desenvolvimento, threading é o mais estável
    async_mode = os.getenv('SOCKETIO_ASYNC_MODE', 'threading')

    try:
        _socketio_instance = SocketIO(
            app,
            cors_allowed_origins="*",  # 🔥 LIBERADO PARA TUDO
            async_mode=async_mode,
            logger=os.getenv('FLASK_ENV') != 'production',
            engineio_logger=False,
            ping_timeout=60,
            ping_interval=25,
            max_http_buffer_size=1e6,
            allow_upgrades=True,
            transports=['websocket', 'polling']
        )

        logger.info(f"SocketIO inicializado com async_mode={async_mode}")
        return _socketio_instance

    except Exception as e:
        logger.error(f"Erro ao inicializar SocketIO: {e}")

        # Fallback para threading se outro modo falhar
        if async_mode != 'threading':
            logger.warning("Tentando fallback com async_mode='threading'")
            _socketio_instance = SocketIO(
                app,
                cors_allowed_origins="*",  # 🔥 LIBERADO PARA TUDO
                async_mode='threading',
                logger=os.getenv('FLASK_ENV') != 'production',
                engineio_logger=False
            )
            return _socketio_instance

        raise


def get_socketio() -> Optional[SocketIO]:
    """Retorna a instância do SocketIO"""
    return _socketio_instance


def register_socketio_events(socketio_instance: SocketIO):
    """Mantido para compatibilidade"""
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
