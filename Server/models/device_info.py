"""
Modelo para a entidade DeviceInfo
"""
from typing import Dict, Any, Optional, List, Tuple
from Server.models.database import DatabaseConnection


class DeviceInfo:
    """Modelo que representa as informações do dispositivo (Raspberry Pi)"""
    
    def __init__(
        self, 
        device_uuid: str,
        serial_raspberry: Optional[str] = None,
        mac_address: Optional[str] = None,
        hostname: Optional[str] = None,
        device_id: Optional[int] = None
    ) -> None:
        self.device_id: Optional[int] = device_id
        self.serial_raspberry: Optional[str] = serial_raspberry
        self.mac_address: Optional[str] = mac_address
        self.device_uuid: str = device_uuid
        self.hostname: Optional[str] = hostname
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "device_id": self.device_id,
            "serial_raspberry": self.serial_raspberry,
            "mac_address": self.mac_address,
            "device_uuid": self.device_uuid,
            "hostname": self.hostname
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'DeviceInfo':
        """Cria um objeto DeviceInfo a partir de um dicionário"""
        return DeviceInfo(
            device_id=data.get('device_id'),
            serial_raspberry=data.get('serial_raspberry'),
            mac_address=data.get('mac_address'),
            device_uuid=data.get('device_uuid', ''),
            hostname=data.get('hostname')
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'DeviceInfo':
        """Cria um objeto DeviceInfo a partir de uma linha do banco"""
        return DeviceInfo(
            device_id=row[0] if len(row) > 0 and row[0] is not None else None,
            serial_raspberry=str(row[1]) if len(row) > 1 and row[1] is not None else None,
            mac_address=str(row[2]) if len(row) > 2 and row[2] is not None else None,
            device_uuid=str(row[3]) if len(row) > 3 and row[3] is not None else '',
            hostname=str(row[4]) if len(row) > 4 and row[4] is not None else None
        )
    
    def save(self) -> 'DeviceInfo':
        """Salva o device_info no banco de dados"""
        if self.device_id:
            # Atualizar
            query = """
                UPDATE device_info 
                SET serial_raspberry = %s, 
                    mac_address = %s, 
                    hostname = %s,
                    data_atualizacao = CURRENT_TIMESTAMP
                WHERE device_id = %s
            """
            params: Tuple[Any, ...] = (
                self.serial_raspberry, 
                self.mac_address, 
                self.hostname, 
                self.device_id
            )
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING id para PostgreSQL
            query = """
                INSERT INTO device_info (serial_raspberry, mac_address, device_uuid, hostname) 
                VALUES (%s, %s, %s, %s) 
                RETURNING device_id
            """
            params = (self.serial_raspberry, self.mac_address, self.device_uuid, self.hostname)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.device_id = result
        return self
    
    @staticmethod
    def buscar_por_id(device_id: int) -> Optional['DeviceInfo']:
        """Busca um device_info pelo ID"""
        query = """
            SELECT device_id, serial_raspberry, mac_address, device_uuid, hostname 
            FROM device_info 
            WHERE device_id = %s
        """
        row = DatabaseConnection.execute_query(query, (device_id,), fetch_one=True)
        if not row:
            return None
        return DeviceInfo.from_row(row)
    
    @staticmethod
    def buscar_por_uuid(device_uuid: str) -> Optional['DeviceInfo']:
        """Busca um device_info pelo UUID"""
        query = """
            SELECT device_id, serial_raspberry, mac_address, device_uuid, hostname 
            FROM device_info 
            WHERE device_uuid = %s
        """
        row = DatabaseConnection.execute_query(query, (device_uuid,), fetch_one=True)
        if not row:
            return None
        return DeviceInfo.from_row(row)
    
    @staticmethod
    def listar_todos() -> List['DeviceInfo']:
        """Lista todos os device_info"""
        query = """
            SELECT device_id, serial_raspberry, mac_address, device_uuid, hostname 
            FROM device_info 
            ORDER BY data_criacao DESC
        """
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [DeviceInfo.from_row(row) for row in rows]
    
    @staticmethod
    def existe_por_uuid(device_uuid: str) -> bool:
        """Verifica se já existe um device_info com o UUID fornecido"""
        device = DeviceInfo.buscar_por_uuid(device_uuid)
        return device is not None
    
    @staticmethod
    def criar(
        device_uuid: str,
        serial_raspberry: Optional[str] = None,
        mac_address: Optional[str] = None,
        hostname: Optional[str] = None
    ) -> 'DeviceInfo':
        """Método estático para criar um novo device_info"""
        device = DeviceInfo(
            device_uuid=device_uuid,
            serial_raspberry=serial_raspberry,
            mac_address=mac_address,
            hostname=hostname
        )
        return device.save()

