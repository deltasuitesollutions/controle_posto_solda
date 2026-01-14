from typing import Dict, Any
from Server.models import Peca

def listar_todas():
    """Lista todas as peças"""
    try:
        pecas = Peca.listar_todas()
        return [peca.to_dict() for peca in pecas]
    except Exception as e:
        print(f'Erro ao listar peças: {e}')
        return []

def buscar_por_id(peca_id):
    """Busca uma peça pelo ID"""
    try:
        peca = Peca.buscar_por_id(peca_id)
        if peca:
            return peca.to_dict()
        return None
    except Exception as e:
        print(f'Erro ao buscar peça: {e}')
        return None

def buscar_por_modelo_id(modelo_id):
    """Busca peças por modelo ID"""
    try:
        pecas = Peca.buscar_por_modelo_id(modelo_id)
        return [peca.to_dict() for peca in pecas]
    except Exception as e:
        print(f'Erro ao buscar peças do modelo: {e}')
        return []

def criar_peca(modelo_id, codigo, nome):
    """Cria uma nova peça"""
    try:
        # Verificar se peça já existe para este modelo
        pecas_existentes = Peca.buscar_por_modelo_id(modelo_id)
        for peca in pecas_existentes:
            if peca.codigo == codigo:
                return {'erro': f'Já existe uma peça com código {codigo} neste modelo'}
        
        nova_peca = Peca(
            modelo_id=modelo_id,
            codigo=codigo,
            nome=nome
        )
        nova_peca.salvar()
        
        return {
            'sucesso': True,
            'peca_id': nova_peca.id,
            'mensagem': 'Peça criada com sucesso'
        }
    except Exception as e:
        print(f'Erro ao criar peça: {e}')
        return {'erro': 'Não foi possível criar a peça'}

def atualizar_peca(peca_id, modelo_id, codigo, nome):
    """Atualiza uma peça existente"""
    try:
        peca = Peca.buscar_por_id(peca_id)
        if not peca:
            return {'erro': f'Peça com ID {peca_id} não encontrada'}
        
        peca.modelo_id = modelo_id
        peca.codigo = codigo
        peca.nome = nome
        peca.salvar()
        
        return {
            'sucesso': True,
            'mensagem': 'Peça atualizada com sucesso'
        }
    except Exception as e:
        print(f'Erro ao atualizar peça: {e}')
        return {'erro': 'Não foi possível atualizar a peça'}

def deletar_peca(peca_id):
    """Deleta uma peça"""
    try:
        peca = Peca.buscar_por_id(peca_id)
        if not peca:
            return {'erro': f'Peça com ID {peca_id} não encontrada'}
        
        peca.deletar()
        
        return {
            'sucesso': True,
            'mensagem': 'Peça deletada com sucesso'
        }
    except Exception as e:
        print(f'Erro ao deletar peça: {e}')
        return {'erro': 'Não foi possível deletar a peça'}