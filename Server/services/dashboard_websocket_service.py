"""
Serviço para gerenciar atualizações do dashboard via WebSocket

As atualizações são enviadas apenas quando necessário (quando há mudanças reais),
através da função notificar_mudanca_registro(). Não há monitoramento automático.
"""
import logging
import time
from typing import Optional
from flask_socketio import SocketIO
from Server.services import dashboard_service

logger = logging.getLogger(__name__)

# Instância global do SocketIO
_socketio_instance: Optional[SocketIO] = None
_last_update_time = 0
_throttle_interval = 3  # Segundos entre atualizações (throttle)


def iniciar_monitoramento(socketio_instance: SocketIO):
    """Inicializa a instância do SocketIO para envio de atualizações
    
    Nota: O monitoramento automático foi removido. As atualizações são enviadas
    apenas quando necessário através de notificar_mudanca_registro().
    """
    global _socketio_instance
    
    _socketio_instance = socketio_instance
    logger.info("✅ Serviço de WebSocket do dashboard inicializado (sem monitoramento automático)")


# Loop de monitoramento automático removido
# As atualizações são enviadas apenas quando necessário através de notificar_mudanca_registro()


def _pode_enviar_atualizacao() -> bool:
    """Verifica se pode enviar atualização baseado no throttle"""
    global _last_update_time, _throttle_interval
    current_time = time.time()
    
    if current_time - _last_update_time >= _throttle_interval:
        _last_update_time = current_time
        return True
    return False


def enviar_atualizacao_dashboard(socketio_instance: Optional[SocketIO] = None, dados: Optional[dict] = None, forcar: bool = False):
    """Envia atualização do dashboard para todos os clientes conectados
    
    Args:
        socketio_instance: Instância do SocketIO (opcional)
        dados: Dados a enviar (opcional, busca se não fornecido)
        forcar: Se True, ignora o throttle e envia imediatamente
    """
    global _socketio_instance, _last_update_time
    
    instance = socketio_instance or _socketio_instance
    
    if not instance:
        logger.warning("SocketIO instance não disponível")
        return
    
    # Verificar throttle (a menos que seja forçado)
    if not forcar and not _pode_enviar_atualizacao():
        logger.debug("Atualização ignorada devido ao throttle")
        return
    
    try:
        # Se dados não foram fornecidos, buscar agora
        if dados is None:
            dados = dashboard_service.buscar_postos_em_uso()
        
        # Enviar para todos os clientes conectados
        # No Flask-SocketIO, não usar broadcast=True, apenas emit sem 'to' envia para todos
        instance.emit('dashboard_update', dados)
        logger.debug(f"📤 Atualização do dashboard enviada via WebSocket")
        
        # Log adicional para debug
        try:
            # Tentar obter número de clientes conectados (pode não funcionar em todos os modos)
            logger.debug(f"Dados enviados: {len(str(dados))} caracteres")
        except:
            pass
        
    except Exception as e:
        logger.error(f"Erro ao enviar atualização do dashboard: {e}")
        import traceback
        logger.error(traceback.format_exc())


def notificar_mudanca_registro():
    """Notifica que houve uma mudança em um registro de produção
    
    Esta função usa throttle para evitar atualizações excessivas.
    Se múltiplas mudanças ocorrerem em um curto período, apenas uma atualização será enviada.
    """
    # Usar throttle para evitar spam de atualizações
    # A atualização será enviada apenas se passou o intervalo mínimo
    enviar_atualizacao_dashboard(forcar=False)

