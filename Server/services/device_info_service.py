"""
Serviço para gerenciar informações do dispositivo (Raspberry Pi)
"""
import uuid
import os
import platform
from typing import Dict, Any, Optional
from Server.models import DeviceInfo


def get_raspberry_serial() -> Optional[str]:
    """
    Obtém o serial do Raspberry Pi
    """
    try:
        # Tentar ler do /proc/cpuinfo (Linux/Raspberry Pi)
        if os.path.exists('/proc/cpuinfo'):
            with open('/proc/cpuinfo', 'r') as f:
                for line in f:
                    if line.startswith('Serial'):
                        return line.split(':')[1].strip()
    except Exception:
        pass
    return None


def get_mac_address() -> Optional[str]:
    """
    Obtém o endereço MAC da interface de rede
    """
    try:
        mac = uuid.getnode()
        return ':'.join(f'{(mac >> ele) & 0xff:02x}' for ele in range(40, -1, -8))
    except Exception:
        return None


def get_or_create_device_uuid() -> str:
    """
    Obtém ou cria um UUID único para o dispositivo
    Gera um UUID na primeira execução e retorna sempre o mesmo
    """
    file_path = 'device_uuid.txt'
    
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                existing_uuid = f.read().strip()
                if existing_uuid:
                    return existing_uuid
        except Exception:
            pass
    
    # Criar novo UUID
    device_uuid = str(uuid.uuid4())
    try:
        with open(file_path, 'w') as f:
            f.write(device_uuid)
    except Exception:
        pass  # Se não conseguir salvar, retorna mesmo assim
    
    return device_uuid


def get_hostname() -> str:
    """
    Obtém o hostname do sistema
    """
    try:
        return os.uname().nodename if hasattr(os, 'uname') else platform.node()
    except Exception:
        try:
            return platform.node()
        except Exception:
            return 'unknown'


def get_device_info() -> Dict[str, Any]:
    """
    Coleta todas as informações do dispositivo
    """
    return {
        "serial_raspberry": get_raspberry_serial(),
        "mac_address": get_mac_address(),
        "device_uuid": get_or_create_device_uuid(),
        "hostname": get_hostname()
    }


def registrar_device_info() -> Dict[str, Any]:
    """
    Coleta as informações do dispositivo e salva no banco de dados.
    Se já existir um registro com o mesmo UUID, retorna o existente.
    Caso contrário, cria um novo registro.
    
    Returns:
        Dict com as informações do dispositivo salvas no banco
    """
    # Coletar informações do dispositivo
    device_info = get_device_info()
    
    device_uuid = device_info['device_uuid']
    
    # Verificar se já existe um registro com este UUID
    existing_device = DeviceInfo.buscar_por_uuid(device_uuid)
    
    if existing_device:
        # Se já existe, retornar o existente
        return existing_device.to_dict()
    
    # Se não existe, criar novo registro
    new_device = DeviceInfo.criar(
        device_uuid=device_uuid,
        serial_raspberry=device_info['serial_raspberry'],
        mac_address=device_info['mac_address'],
        hostname=device_info['hostname']
    )
    
    return new_device.to_dict()


def buscar_device_info() -> Optional[Dict[str, Any]]:
    """
    Busca as informações do dispositivo no banco de dados
    usando o UUID local
    
    Returns:
        Dict com as informações do dispositivo ou None se não encontrado
    """
    device_uuid = get_or_create_device_uuid()
    device = DeviceInfo.buscar_por_uuid(device_uuid)
    
    if device:
        return device.to_dict()
    
    return None


def listar_todos_devices() -> list[Dict[str, Any]]:
    """
    Lista todos os dispositivos registrados no banco de dados
    
    Returns:
        Lista de dicionários com informações dos dispositivos
    """
    devices = DeviceInfo.listar_todos()
    return [device.to_dict() for device in devices]

