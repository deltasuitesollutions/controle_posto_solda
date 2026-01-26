"""
Enum para os IDs dos totens/Raspberry
Agora busca dinamicamente do banco de dados (device_info)
"""
from enum import Enum
from typing import List, Dict, Any
from Server.services import device_info_service


class TotenID(Enum):
    """Enum com os IDs dos totens/Raspberry disponíveis
    Agora busca dinamicamente do banco de dados (device_info)
    """
    TOTEN_1 = 1
    TOTEN_2 = 2
    TOTEN_3 = 3
    TOTEN_4 = 4
    TOTEN_5 = 5
    TOTEN_6 = 6
    TOTEN_7 = 7
    TOTEN_8 = 8
    TOTEN_9 = 9
    TOTEN_10 = 10
    TOTEN_11 = 11
    TOTEN_12 = 12
    
    @classmethod
    def listar_todos(cls) -> List[Dict[str, Any]]:
        """
        Retorna lista com todos os totens disponíveis.
        Busca dinamicamente do banco de dados (device_info).
        Se não houver devices registrados, retorna lista vazia.
        """
        try:
            devices = device_info_service.listar_todos_devices()
            if devices and len(devices) > 0:
                # Retorna devices do banco com device_id como id e hostname como nome
                return [
                    {
                        "id": device.get('device_id'),
                        "nome": device.get('hostname') or f"Totem {device.get('device_id')}",
                        "serial": device.get('serial_raspberry'),
                        "device_uuid": device.get('device_uuid')
                    }
                    for device in devices
                ]
            else:
                # Se não houver devices registrados, retorna lista vazia
                # ou pode retornar os valores padrão do enum como fallback
                return []
        except Exception as e:
            # Em caso de erro, retorna lista vazia ou valores padrão
            print(f"Erro ao buscar totens do banco: {e}")
            # Fallback: retorna valores padrão do enum
            return [{"id": toten.value, "nome": f"Totem {toten.value}"} for toten in cls]
    
    @classmethod
    def valores_validos(cls) -> List[int]:
        """
        Retorna lista com todos os valores válidos (device_ids do banco).
        Busca dinamicamente do banco de dados.
        """
        try:
            devices = device_info_service.listar_todos_devices()
            if devices and len(devices) > 0:
                return [device.get('device_id') for device in devices if device.get('device_id')]
            else:
                # Fallback: retorna valores padrão do enum
                return [toten.value for toten in cls]
        except Exception as e:
            print(f"Erro ao buscar valores válidos do banco: {e}")
            # Fallback: retorna valores padrão do enum
            return [toten.value for toten in cls]
    
    @classmethod
    def is_valido(cls, valor: int) -> bool:
        """
        Verifica se um valor é um ID de toten válido.
        Busca dinamicamente do banco de dados.
        """
        return valor in cls.valores_validos()

