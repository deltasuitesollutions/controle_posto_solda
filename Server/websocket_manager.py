import os
import time
import logging
import threading
from typing import Optional
from flask import Flask, request
from flask_socketio import SocketIO, emit
from Server.services import dashboard_service

# Configurar logger para sempre mostrar mensagens
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Instância global do SocketIO
_socketio_instance: Optional[SocketIO] = None
_last_update_time = 0
_throttle_interval = 0.5  # Reduzido de 3s para 0.5s para atualizações mais rápidas
_connected_clients = set()  # Rastrear clientes conectados
_clients_lock = threading.Lock()  # Lock para thread safety


def init_socketio(app: Flask) -> SocketIO:
    """Inicializa e retorna a instância do SocketIO"""
    global _socketio_instance

    # Em desenvolvimento, threading é o mais estável
    async_mode = os.getenv('SOCKETIO_ASYNC_MODE', 'threading')

    try:
        _socketio_instance = SocketIO(
            app,
            cors_allowed_origins="*",  # Liberado para todos os origins
            async_mode=async_mode,
            logger=True,  # Sempre habilitar logger para debug
            engineio_logger=True,  # Habilitar também o engineio logger
            ping_timeout=60,
            ping_interval=25,
            max_http_buffer_size=1e6,
            allow_upgrades=True,
            transports=['polling', 'websocket']  # Polling primeiro para maior estabilidade
        )

        print(f"[WebSocket] SocketIO inicializado com async_mode={async_mode}")
        return _socketio_instance

    except Exception as e:
        print(f"[WebSocket] Erro ao inicializar SocketIO: {e}")

        # Fallback para threading se outro modo falhar
        if async_mode != 'threading':
            print("[WebSocket] Tentando fallback com async_mode='threading'")
            _socketio_instance = SocketIO(
                app,
                cors_allowed_origins="*",
                async_mode='threading',
                logger=True,
                engineio_logger=True,
                transports=['polling', 'websocket']
            )
            return _socketio_instance

        raise


def get_socketio() -> Optional[SocketIO]:
    """Retorna a instância do SocketIO (global ou do app atual)."""
    global _socketio_instance
    if _socketio_instance is not None:
        return _socketio_instance
    try:
        from flask import current_app
        return current_app.extensions.get("socketio")
    except (RuntimeError, KeyError, AttributeError):
        return None


def enviar_atualizacao_dashboard(forcar: bool = False):
    """Envia atualização do dashboard via WebSocket para TODOS os clientes
    
    Args:
        forcar: Se True, ignora o throttle e envia imediatamente
    """
    global _last_update_time

    socketio_instance = get_socketio()
    if not socketio_instance:
        logger.warning("[WebSocket] SocketIO não inicializado, não é possível enviar atualização")
        return

    current_time = time.time()
    if not forcar and current_time - _last_update_time < _throttle_interval:
        logger.debug("[WebSocket] Throttle ativo, ignorando atualização")
        return

    _last_update_time = current_time

    try:
        dados = dashboard_service.buscar_postos_em_uso()
        with _clients_lock:
            num_clients = len(_connected_clients)
        
        logger.info(f"[WebSocket] === BROADCAST dashboard_update ===")
        logger.info(f"[WebSocket] Clientes conectados: {num_clients}")
        logger.info(f"[WebSocket] Dados: {len(dados.get('sublinhas', []))} sublinhas")
        
        # IMPORTANTE: Usar o servidor SocketIO para fazer broadcast
        # O método emit() do servidor envia para TODOS os clientes quando chamado assim
        socketio_instance.emit('dashboard_update', dados, namespace='/')
        
        logger.info(f"[WebSocket] Broadcast dashboard_update enviado com sucesso!")
    except Exception as e:
        logger.error(f"[WebSocket] ERRO ao enviar atualização do dashboard: {e}", exc_info=True)


def enviar_atualizacao_registros(forcar: bool = False):
    """Envia atualização dos registros via WebSocket para TODOS os clientes
    
    Args:
        forcar: Se True, ignora o throttle e envia imediatamente
    """
    socketio_instance = get_socketio()
    if not socketio_instance:
        logger.warning("[WebSocket] SocketIO não inicializado, não é possível enviar atualização de registros")
        return

    try:
        with _clients_lock:
            num_clients = len(_connected_clients)
        
        logger.info(f"[WebSocket] === BROADCAST registros_update ===")
        logger.info(f"[WebSocket] Clientes conectados: {num_clients}")
        
        # Emitir evento notificando que houve mudança nos registros
        socketio_instance.emit('registros_update', {'timestamp': time.time()}, namespace='/')
        
        logger.info(f"[WebSocket] Broadcast registros_update enviado com sucesso!")
    except Exception as e:
        logger.error(f"[WebSocket] ERRO ao enviar atualização de registros: {e}", exc_info=True)


def register_socketio_events(socketio_instance: SocketIO):
    """Registra eventos do SocketIO"""
    
    @socketio_instance.on('connect')
    def handle_connect():
        """Envia atualização imediata quando cliente se conecta"""
        sid = request.sid if hasattr(request, 'sid') else 'unknown'
        with _clients_lock:
            _connected_clients.add(sid)
            total = len(_connected_clients)
        logger.info(f"[WebSocket] +++ Cliente CONECTADO: {sid} (total: {total})")
        # Enviar atualização imediata para o cliente que acabou de conectar
        try:
            dados = dashboard_service.buscar_postos_em_uso()
            emit('dashboard_update', dados)
            logger.info(f"[WebSocket] Dados iniciais enviados para cliente {sid}")
        except Exception as e:
            logger.error(f"[WebSocket] Erro ao enviar dados iniciais: {e}", exc_info=True)
    
    @socketio_instance.on('disconnect')
    def handle_disconnect():
        """Log quando cliente desconecta"""
        sid = request.sid if hasattr(request, 'sid') else 'unknown'
        with _clients_lock:
            _connected_clients.discard(sid)
            total = len(_connected_clients)
        logger.info(f"[WebSocket] --- Cliente DESCONECTADO: {sid} (total: {total})")
    
    @socketio_instance.on('request_dashboard_update')
    def handle_request_update():
        """Permite que o cliente solicite atualização manual"""
        sid = request.sid if hasattr(request, 'sid') else 'unknown'
        logger.info(f"[WebSocket] Cliente {sid} solicitou atualização do dashboard")
        try:
            dados = dashboard_service.buscar_postos_em_uso()
            emit('dashboard_update', dados)
            logger.info(f"[WebSocket] Dados enviados para cliente {sid}")
        except Exception as e:
            logger.error(f"[WebSocket] Erro ao enviar dados: {e}", exc_info=True)
    
    @socketio_instance.on('request_registros_update')
    def handle_request_registros_update():
        """Permite que o cliente solicite atualização manual dos registros"""
        sid = request.sid if hasattr(request, 'sid') else 'unknown'
        logger.info(f"[WebSocket] Cliente {sid} solicitou atualização dos registros")
        emit('registros_update', {'timestamp': time.time()})
