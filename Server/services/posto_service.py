from Server.models.posto import Posto
from Server.models.sublinha import Sublinha
from Server.enums.toten_enum import TotenID
from typing import Dict, Any, List, Optional
from Server.services import dispositivo_raspberry_service


def criar_posto(nome: str, sublinha_id: int, toten_id: int) -> Dict[str, Any]:
    try:
        if not TotenID.is_valido(toten_id):
            return {'erro': f'ID do toten inválido. Valores válidos: {TotenID.valores_validos()}'}
        
        sublinha = Sublinha.buscar_por_id(sublinha_id)
        if not sublinha:
            return {'erro': f'Sublinha com ID {sublinha_id} não encontrada'}
        
        if not nome or not nome.strip():
            return {'erro': 'Nome do posto é obrigatório'}
        
        novo_posto = Posto.criar(nome=nome.strip(), sublinha_id=sublinha_id, toten_id=toten_id)
        
        return {
            'sucesso': True,
            'posto_id': novo_posto.posto_id,
            'mensagem': f'Posto {nome} criado com sucesso',
            'posto': novo_posto.to_dict()
        }
    
    except Exception as erro:
        print(f'Erro ao criar posto: {erro}')
        return {'erro': f'Não foi possível criar o posto: {str(erro)}'}


def atualizar_posto(posto_id: int, nome: Optional[str] = None, sublinha_id: Optional[int] = None, toten_id: Optional[int] = None) -> Dict[str, Any]:
    try:
        posto = Posto.buscar_por_id(posto_id)
        if not posto:
            return {'erro': f'Posto com ID {posto_id} não encontrado'}
        
        if toten_id is not None and not TotenID.is_valido(toten_id):
            return {'erro': f'ID do toten inválido. Valores válidos: {TotenID.valores_validos()}'}
        
        if sublinha_id is not None:
            sublinha = Sublinha.buscar_por_id(sublinha_id)
            if not sublinha:
                return {'erro': f'Sublinha com ID {sublinha_id} não encontrada'}
            posto.sublinha_id = sublinha_id
        
        if nome is not None:
            if not nome.strip():
                return {'erro': 'Nome do posto não pode ser vazio'}
            posto.nome = nome.strip()
        
        if toten_id is not None:
            posto.toten_id = toten_id
        
        posto.save()
        
        return {
            'sucesso': True,
            'mensagem': f'Posto {posto_id} atualizado com sucesso',
            'posto': posto.to_dict()
        }
    
    except Exception as erro:
        print(f'Erro ao atualizar posto: {erro}')
        return {'erro': f'Não foi possível atualizar o posto: {str(erro)}'}


def deletar_posto(posto_id: int) -> Dict[str, Any]:
    try:
        posto = Posto.buscar_por_id(posto_id)
        if not posto:
            return {'erro': f'Posto com ID {posto_id} não encontrado'}
        
        posto.delete()
        
        return {
            'sucesso': True,
            'mensagem': f'Posto {posto_id} deletado com sucesso'
        }
    
    except Exception as erro:
        print(f'Erro ao deletar posto: {erro}')
        return {'erro': f'Não foi possível deletar o posto: {str(erro)}'}


def listar_postos() -> List[Dict[str, Any]]:
    try:
        postos = Posto.listar_todos()
        resultado = []
        
        # Buscar todos os dispositivos cadastrados
        dispositivos = dispositivo_raspberry_service.listar_dispositivos()
        
        # Criar um mapeamento de toten_id para dispositivo
        # Assumindo que podemos associar dispositivos aos totens
        dispositivos_por_toten = {}
        if dispositivos:
            for idx, dispositivo in enumerate(dispositivos):
                # Associar sequencialmente: dispositivo 0 -> toten 1, dispositivo 1 -> toten 2, etc.
                toten_id = idx + 1
                dispositivos_por_toten[toten_id] = dispositivo
        
        for posto in postos:
            posto_dict = posto.to_dict()
            
            # Adicionar informações do dispositivo se houver correspondência
            dispositivo = dispositivos_por_toten.get(posto.toten_id)
            if dispositivo:
                posto_dict['serial'] = dispositivo.get('serial', '')
                posto_dict['hostname'] = dispositivo.get('hostname', '')
                posto_dict['dispositivo_id'] = dispositivo.get('id')
            else:
                posto_dict['serial'] = ''
                posto_dict['hostname'] = ''
                posto_dict['dispositivo_id'] = None
            
            resultado.append(posto_dict)
        
        return resultado
    
    except Exception as erro:
        print(f'Erro ao listar postos: {erro}')
        return []


def buscar_posto_por_id(posto_id: int) -> Dict[str, Any]:
    try:
        posto = Posto.buscar_por_id(posto_id)
        if not posto:
            return {'erro': f'Posto com ID {posto_id} não encontrado'}
        
        return posto.to_dict()
    
    except Exception as erro:
        print(f'Erro ao buscar posto: {erro}')
        return {'erro': f'Não foi possível buscar o posto: {str(erro)}'}


def buscar_postos_por_sublinha(sublinha_id: int) -> List[Dict[str, Any]]:
    try:
        postos = Posto.buscar_por_sublinha(sublinha_id)
        resultado = []
        
        for posto in postos:
            resultado.append(posto.to_dict())
        
        return resultado
    
    except Exception as erro:
        print(f'Erro ao buscar postos por sublinha: {erro}')
        return []


def buscar_postos_por_toten(toten_id: int) -> List[Dict[str, Any]]:
    try:
        postos = Posto.buscar_por_toten(toten_id)
        resultado = []
        
        for posto in postos:
            resultado.append(posto.to_dict())
        
        return resultado
    
    except Exception as erro:
        print(f'Erro ao buscar postos por toten: {erro}')
        return []


def listar_totens_disponiveis() -> List[Dict[str, Any]]:
    """
    Lista todos os totens disponíveis com informações dos dispositivos Raspberry
    """
    totens = TotenID.listar_todos()
    
    # Buscar todos os dispositivos cadastrados
    dispositivos = dispositivo_raspberry_service.listar_dispositivos()
    
    # Criar um mapeamento de toten_id para dispositivo
    # Assumindo que o toten_id pode corresponder ao dispositivo_id ou precisamos de outra lógica
    # Por enquanto, vamos adicionar informações do dispositivo se houver correspondência
    totens_com_info = []
    
    for toten in totens:
        toten_id = toten.get('id')
        toten_dict = toten.copy()
        
        # Tentar encontrar dispositivo correspondente
        # Se o toten_id corresponder ao dispositivo_id, usar esse
        dispositivo_correspondente = None
        if dispositivos and len(dispositivos) > 0:
            # Se houver apenas um dispositivo, associar ao primeiro toten
            # Ou podemos usar uma lógica diferente baseada no toten_id
            # Por enquanto, vamos associar sequencialmente
            toten_index = toten_id - 1 if toten_id > 0 else 0
            if toten_index < len(dispositivos):
                dispositivo_correspondente = dispositivos[toten_index]
        
        # Adicionar informações do dispositivo se encontrado
        if dispositivo_correspondente:
            toten_dict['serial'] = dispositivo_correspondente.get('serial', '')
            toten_dict['hostname'] = dispositivo_correspondente.get('hostname', '')
            toten_dict['dispositivo_id'] = dispositivo_correspondente.get('id')
        else:
            toten_dict['serial'] = ''
            toten_dict['hostname'] = ''
            toten_dict['dispositivo_id'] = None
        
        totens_com_info.append(toten_dict)
    
    return totens_com_info

