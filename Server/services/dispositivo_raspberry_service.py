"""
Service para gerenciar dispositivos Raspberry Pi
"""
import subprocess
from typing import Dict, Any, Optional, List
from Server.models.dispositivo_raspberry import DispositivoRaspberry


def obter_serial_raspberry() -> str:
    """
    Obtém o número de série do Raspberry Pi
    Tenta múltiplos métodos para compatibilidade
    """
    try:
        # Método 1: /proc/cpuinfo (mais comum)
        result = subprocess.run(
            ['cat', '/proc/cpuinfo'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                if 'Serial' in line:
                    serial = line.split(':')[1].strip()
                    if serial and serial != '0000000000000000':
                        return serial
        
        # Método 2: /sys/firmware/devicetree/base/serial-number
        try:
            with open('/sys/firmware/devicetree/base/serial-number', 'r') as f:
                serial = f.read().strip()
                if serial:
                    return serial
        except (FileNotFoundError, IOError):
            pass
        
        # Método 3: vcgencmd (se disponível)
        result = subprocess.run(
            ['vcgencmd', 'get_board serial'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            serial = result.stdout.strip().replace('serial=', '')
            if serial:
                return serial
        
        # Se nenhum método funcionou, retornar um valor padrão
        return 'UNKNOWN'
        
    except subprocess.TimeoutExpired:
        return 'TIMEOUT'
    except Exception as e:
        print(f"Erro ao obter serial do Raspberry: {e}")
        return 'ERROR'




def verificar_dispositivo_registrado() -> Optional[Dict[str, Any]]:
    """
    Verifica se já existe um dispositivo registrado para este Raspberry
    Retorna o dispositivo se existir, None caso contrário
    """
    try:
        serial = obter_serial_raspberry()
        
        if serial == 'UNKNOWN' or serial == 'TIMEOUT' or serial == 'ERROR':
            return None
        
        # Verificar se já existe um dispositivo com este serial
        dispositivo_existente = DispositivoRaspberry.buscar_por_serial(serial)
        
        if dispositivo_existente:
            return dispositivo_existente.to_dict()
        
        return None
    except Exception as e:
        print(f"Erro ao verificar dispositivo: {e}")
        return None


def registrar_dispositivo_raspberry() -> Dict[str, Any]:
    """
    Registra o dispositivo Raspberry Pi no banco de dados APENAS UMA VEZ
    Obtém apenas o serial e salva no banco se ainda não existir
    """
    try:
        # Primeiro verificar se já existe um dispositivo registrado
        dispositivo_existente = verificar_dispositivo_registrado()
        
        if dispositivo_existente:
            # Dispositivo já registrado, retornar existente
            return dispositivo_existente
        
        # Dispositivo não existe, registrar pela primeira vez
        serial = obter_serial_raspberry()
        
        if serial == 'UNKNOWN' or serial == 'TIMEOUT' or serial == 'ERROR':
            raise Exception("Não foi possível obter serial do dispositivo")
        
        # Criar novo dispositivo (apenas uma vez, sem nome inicial)
        novo_dispositivo = DispositivoRaspberry.criar(serial=serial, nome=None)
        print(f"Dispositivo Raspberry registrado pela primeira vez: Serial={serial}")
        return novo_dispositivo.to_dict()
            
    except Exception as e:
        print(f"Erro ao registrar dispositivo Raspberry: {e}")
        raise Exception(f"Erro ao registrar dispositivo: {str(e)}")


def listar_dispositivos() -> List[Dict[str, Any]]:
    """
    Lista todos os dispositivos Raspberry Pi cadastrados
    """
    try:
        dispositivos = DispositivoRaspberry.listar_todos()
        return [d.to_dict() for d in dispositivos]
    except Exception as e:
        print(f"Erro ao listar dispositivos: {e}")
        return []


def buscar_dispositivo_por_id(dispositivo_id: int) -> Optional[Dict[str, Any]]:
    """
    Busca um dispositivo pelo ID
    """
    try:
        dispositivo = DispositivoRaspberry.buscar_por_id(dispositivo_id)
        if dispositivo:
            return dispositivo.to_dict()
        return None
    except Exception as e:
        print(f"Erro ao buscar dispositivo: {e}")
        return None


def buscar_dispositivo_por_serial(serial: str) -> Optional[Dict[str, Any]]:
    """
    Busca um dispositivo pelo serial
    """
    try:
        dispositivo = DispositivoRaspberry.buscar_por_serial(serial)
        if dispositivo:
            return dispositivo.to_dict()
        return None
    except Exception as e:
        print(f"Erro ao buscar dispositivo por serial: {e}")
        return None


def criar_dispositivo_manual(serial: str, nome: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Cadastra um dispositivo manualmente pelo serial (para uso na tela web).
    Útil quando o Raspberry ainda não fez login ou para testes.
    """
    try:
        serial = (serial or '').strip()
        if not serial:
            return None
        # Não duplicar serial
        existente = DispositivoRaspberry.buscar_por_serial(serial)
        if existente:
            return existente.to_dict()
        dispositivo = DispositivoRaspberry.criar(serial=serial, nome=nome or None)
        return dispositivo.to_dict()
    except Exception as e:
        print(f"Erro ao criar dispositivo manual: {e}")
        return None


def atualizar_nome_dispositivo(dispositivo_id: int, nome: str) -> Optional[Dict[str, Any]]:
    """
    Atualiza o nome de um dispositivo
    """
    try:
        dispositivo = DispositivoRaspberry.buscar_por_id(dispositivo_id)
        if not dispositivo:
            return None
        
        dispositivo.nome = nome.strip() if nome else None
        dispositivo.save()
        return dispositivo.to_dict()
    except Exception as e:
        print(f"Erro ao atualizar nome do dispositivo: {e}")
        return None


def remover_dispositivo(dispositivo_id: int) -> bool:
    """
    Remove um dispositivo pelo ID.
    Retorna True se removeu, False se não encontrou.
    """
    try:
        dispositivo = DispositivoRaspberry.buscar_por_id(dispositivo_id)
        if not dispositivo:
            return False
        dispositivo.delete()
        return True
    except Exception as e:
        print(f"Erro ao remover dispositivo: {e}")
        raise

