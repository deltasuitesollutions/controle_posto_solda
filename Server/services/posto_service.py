from Server.models.posto import Posto
from Server.models.sublinha import Sublinha
from Server.enums.toten_enum import TotenID
from typing import Dict, Any, List, Optional


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
        
        for posto in postos:
            resultado.append(posto.to_dict())
        
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
    return TotenID.listar_todos()

