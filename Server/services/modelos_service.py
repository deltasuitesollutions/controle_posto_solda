from typing import Dict, Any, List
from Server.models import Modelo, Peca  

def listar_modelos():
    """Lista todos os modelos"""
    try: 
        modelos = Modelo.listar_todos()
        return [{'id': modelo.id, 'codigo': modelo.codigo, 'nome': modelo.nome} for modelo in modelos]
    except Exception as erro:
        print(f'Erro ao listar modelos: {erro}')
        return []
    
def buscar_modelo_por_codigo(codigo):  
    """Busca um modelo pelo código com suas peças"""
    try:
        modelo = Modelo.buscar_por_codigo(codigo)
        if not modelo:
            return {'erro': f'Modelo com código {codigo} não encontrado'}
        
        # Buscar peças do modelo
        pecas = Peca.buscar_por_modelo_id(modelo.id)
        
        return {
            'id': modelo.id,
            'codigo': modelo.codigo,
            'nome': modelo.nome,
            'pecas': [peca.to_dict() for peca in pecas]
        }
    except Exception as erro:
        print(f'Erro ao buscar modelo: {erro}')
        return {'erro': 'Não foi possível buscar o modelo'}
    
def criar_modelo(codigo, nome, pecas=None):
    """Cria um novo modelo com as suas peças"""
    try:
        modelo_existente = Modelo.buscar_por_codigo(codigo)
        if modelo_existente:
            return {'erro': f'Já existe um modelo com o código {codigo}'}
        
        # Criar modelo
        novo_modelo = Modelo(codigo=codigo, nome=nome)
        novo_modelo.salvar()

        # Criar peças se houver
        if pecas:
            for peca_info in pecas:
                nova_peca = Peca(
                    modelo_id=novo_modelo.id,
                    codigo=peca_info.get('codigo', ''),
                    nome=peca_info.get('nome', '')
                )
                nova_peca.save()
        
        return {
            'sucesso': True, 
            'modelo_id': novo_modelo.id,
            'mensagem': f'Modelo {codigo} criado com sucesso'
        }
    
    except Exception as erro:
        print(f'Erro ao criar modelo: {erro}')
        return {'erro': f'Não foi possível criar o modelo: {str(erro)}'}
    
def deletar_modelo(modelo_id):
    """Deleta um modelo"""
    try:
        modelo = Modelo.buscar_por_id(modelo_id)
        if not modelo:
            return {'erro': f'Modelo com ID {modelo_id} não encontrado'}
        
        modelo.deletar()
        return {
            'sucesso': True, 
            'mensagem': f'Modelo {modelo_id} deletado'
        }
    
    except Exception as erro:
        print(f'Erro ao deletar modelo: {erro}')
        return {'erro': f'Não foi possível deletar o modelo {modelo_id}: {str(erro)}'}
    
def atualizar_modelo(modelo_id, codigo=None, nome=None, pecas=None):
    """Atualiza um modelo existente e suas peças"""
    try:
        modelo = Modelo.buscar_por_id(modelo_id)
        if not modelo:
            return {'erro': f'Modelo com ID {modelo_id} não encontrado'}
        
        # Verificar se código foi alterado e se já existe
        if codigo and codigo != modelo.codigo:
            modelo_com_mesmo_codigo = Modelo.buscar_por_codigo(codigo)
            if modelo_com_mesmo_codigo:
                return {'erro': f'Outro modelo já usa o código {codigo}'}
            modelo.codigo = codigo
        
        if nome:
            modelo.nome = nome
        
        modelo.salvar()

        # Atualizar peças se fornecidas
        if pecas is not None:
            # Deletar peças existentes
            Peca.deletar_por_modelo_id(modelo.id)
            
            # Criar novas peças
            for peca_info in pecas:
                nova_peca = Peca(
                    modelo_id=modelo.id,
                    codigo=peca_info.get('codigo', ''),
                    nome=peca_info.get('nome', '')
                )
                nova_peca.save()

        return {
            'sucesso': True, 
            'mensagem': f'Modelo {modelo_id} atualizado',
            'modelo': modelo.to_dict()
        }
    
    except Exception as erro:
        print(f'Erro ao atualizar modelo: {erro}')
        return {'erro': f'Não foi possível atualizar o modelo {modelo_id}: {str(erro)}'}