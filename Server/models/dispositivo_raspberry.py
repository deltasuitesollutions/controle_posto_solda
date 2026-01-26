"""
Modelo para a entidade DispositivoRaspberry
"""
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from Server.models.database import DatabaseConnection


class DispositivoRaspberry:
    """Modelo que representa um dispositivo Raspberry Pi"""
    
    def __init__(
        self, 
        serial: str, 
        hostname: str, 
        dispositivo_id: Optional[int] = None,
        data_registro: Optional[datetime] = None
    ) -> None:
        self.dispositivo_id: Optional[int] = dispositivo_id
        self.serial: str = serial
        self.hostname: str = hostname
        self.data_registro: Optional[datetime] = data_registro
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        result = {
            "serial": self.serial,
            "hostname": self.hostname,
        }
        if self.dispositivo_id is not None:
            result["id"] = self.dispositivo_id
            result["dispositivo_id"] = self.dispositivo_id
        if self.data_registro:
            if isinstance(self.data_registro, datetime):
                result["data_registro"] = self.data_registro.isoformat()
            else:
                result["data_registro"] = str(self.data_registro)
        return result
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'DispositivoRaspberry':
        """Cria um objeto DispositivoRaspberry a partir de um dicionário"""
        return DispositivoRaspberry(
            dispositivo_id=data.get('dispositivo_id') or data.get('id'),
            serial=data.get('serial', ''),
            hostname=data.get('hostname', ''),
            data_registro=data.get('data_registro')
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'DispositivoRaspberry':
        """Cria um objeto DispositivoRaspberry a partir de uma linha do banco"""
        dispositivo_id = int(row[0]) if len(row) > 0 and row[0] is not None else None
        serial = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        hostname = str(row[2]) if len(row) > 2 and row[2] is not None else ''
        data_registro = row[3] if len(row) > 3 and row[3] is not None else None
        
        return DispositivoRaspberry(
            dispositivo_id=dispositivo_id,
            serial=serial,
            hostname=hostname,
            data_registro=data_registro
        )
    
    def save(self) -> 'DispositivoRaspberry':
        """Salva o dispositivo no banco de dados"""
        if self.dispositivo_id:
            # Atualizar
            query = """
                UPDATE dispositivos_raspberry 
                SET serial = %s, hostname = %s 
                WHERE id = %s
            """
            params: Tuple[Any, ...] = (self.serial, self.hostname, self.dispositivo_id)
            DatabaseConnection.execute_query(query, params)
        else:
            # Inserir com RETURNING id para PostgreSQL
            query = """
                INSERT INTO dispositivos_raspberry (serial, hostname, data_registro) 
                VALUES (%s, %s, CURRENT_TIMESTAMP) 
                RETURNING id
            """
            params = (self.serial, self.hostname)
            result = DatabaseConnection.execute_query(query, params)
            if isinstance(result, int):
                self.dispositivo_id = result
        return self
    
    @staticmethod
    def buscar_por_id(dispositivo_id: int) -> Optional['DispositivoRaspberry']:
        """Busca um dispositivo pelo ID"""
        query = """
            SELECT id, serial, hostname, data_registro 
            FROM dispositivos_raspberry 
            WHERE id = %s
        """
        row = DatabaseConnection.execute_query(query, (dispositivo_id,), fetch_one=True)
        if not row:
            return None
        return DispositivoRaspberry.from_row(row)
    
    @staticmethod
    def buscar_por_serial(serial: str) -> Optional['DispositivoRaspberry']:
        """Busca um dispositivo pelo serial"""
        query = """
            SELECT id, serial, hostname, data_registro 
            FROM dispositivos_raspberry 
            WHERE serial = %s
        """
        row = DatabaseConnection.execute_query(query, (serial,), fetch_one=True)
        if not row:
            return None
        return DispositivoRaspberry.from_row(row)
    
    @staticmethod
    def listar_todos() -> List['DispositivoRaspberry']:
        """Lista todos os dispositivos"""
        query = """
            SELECT id, serial, hostname, data_registro 
            FROM dispositivos_raspberry 
            ORDER BY data_registro DESC
        """
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [DispositivoRaspberry.from_row(row) for row in rows]
    
    def delete(self) -> None:
        """Remove o dispositivo do banco de dados"""
        if not self.dispositivo_id:
            raise Exception("Dispositivo não possui ID")
        query = "DELETE FROM dispositivos_raspberry WHERE id = %s"
        DatabaseConnection.execute_query(query, (self.dispositivo_id,))
        self.dispositivo_id = None
    
    @staticmethod
    def criar(serial: str, hostname: str) -> 'DispositivoRaspberry':
        """Método estático para criar um novo dispositivo"""
        dispositivo = DispositivoRaspberry(serial=serial, hostname=hostname)
        return dispositivo.save()

