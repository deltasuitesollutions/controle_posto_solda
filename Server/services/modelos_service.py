from typing import Dict, Any, List
from Server.models import Modelo
from Server.models.database import DatabaseConnection
from Server.services import pecas_service  

def listar_modelos():
    """Lista todos os modelos com suas peças"""
    try: 
        modelos = Modelo.listar_todos()
        resultado = []
        for modelo in modelos:
            # Buscar peças do modelo usando o service
            pecas = pecas_service.buscar_por_modelo_id(modelo.id)
            resultado.append({
                'id': modelo.id,
                'codigo': modelo.codigo,
                'nome': modelo.descricao,  # Usar descricao ao invés de nome
                'pecas': pecas
            })
        return resultado
    except Exception as erro:
        print(f'Erro ao listar modelos: {erro}')
        import traceback
        traceback.print_exc()
        return []
    
def buscar_modelo_por_codigo(codigo):  
    """Busca um modelo pelo código com suas peças"""
    try:
        modelo = Modelo.buscar_por_codigo(codigo)
        if not modelo:
            return {'erro': f'Modelo com código {codigo} não encontrado'}
        
        # Buscar peças do modelo usando o service
        pecas = pecas_service.buscar_por_modelo_id(modelo.id)
        
        return {
            'id': modelo.id,
            'codigo': modelo.codigo,
            'nome': modelo.descricao,  # Usar descricao ao invés de nome
            'pecas': pecas
        }
    except Exception as erro:
        print(f'Erro ao buscar modelo: {erro}')
        return {'erro': 'Não foi possível buscar o modelo'}
    
def criar_modelo(codigo, nome, pecas=None):
    """Cria um novo modelo com as suas peças"""
    try:
        # Verificar se já existe modelo com o mesmo nome
        query = "SELECT modelo_id FROM modelos WHERE nome = %s"
        resultado = DatabaseConnection.execute_query(query, (nome,), fetch_one=True)
        if resultado:
            return {'erro': f'Já existe um modelo com o nome {nome}'}
        
        # Criar modelo (codigo não é salvo no banco, apenas nome)
        novo_modelo = Modelo(codigo=codigo, descricao=nome)
        novo_modelo.save()

        # Criar peças se houver usando o service
        if pecas and novo_modelo.id:
            for peca_info in pecas:
                pecas_service.criar_peca(
                    modelo_id=novo_modelo.id,
                    codigo=peca_info.get('codigo', ''),
                    nome=peca_info.get('nome', '')
                )
        
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
        print(f'Tentando deletar modelo com ID: {modelo_id} (tipo: {type(modelo_id)})')
        modelo = Modelo.buscar_por_id(modelo_id)
        if not modelo:
            print(f'Modelo com ID {modelo_id} não encontrado')
            return {'erro': f'Modelo com ID {modelo_id} não encontrado'}
        
        print(f'Modelo encontrado: ID={modelo.id}, Nome={modelo.descricao}')
        modelo.delete()
        print(f'Modelo {modelo_id} deletado com sucesso')
        
        return {
            'sucesso': True, 
            'mensagem': f'Modelo {modelo_id} deletado'
        }
    
    except Exception as erro:
        print(f'Erro ao deletar modelo: {erro}')
        import traceback
        traceback.print_exc()
        return {'erro': f'Não foi possível deletar o modelo {modelo_id}: {str(erro)}'}
    
def atualizar_modelo(modelo_id, codigo=None, nome=None, pecas=None):
    """Atualiza um modelo existente e suas peças"""
    try:
        modelo = Modelo.buscar_por_id(modelo_id)
        if not modelo:
            return {'erro': f'Modelo com ID {modelo_id} não encontrado'}
        
        # Atualizar codigo no objeto (não é salvo no banco, apenas para compatibilidade da API)
        if codigo:
            modelo.codigo = codigo
        
        # Verificar se nome foi alterado e se já existe outro modelo com esse nome
        if nome and nome != modelo.descricao:
            query = "SELECT modelo_id FROM modelos WHERE nome = %s AND modelo_id != %s"
            resultado = DatabaseConnection.execute_query(query, (nome, modelo.id), fetch_one=True)
            if resultado:
                return {'erro': f'Outro modelo já usa o nome {nome}'}
            modelo.descricao = nome
        elif nome:
            modelo.descricao = nome
        
        modelo.save()

        # Atualizar peças se fornecidas
        if pecas is not None and modelo.id:
            # Buscar peças existentes do modelo usando o service
            pecas_existentes = pecas_service.buscar_por_modelo_id(modelo.id)
            ids_pecas_existentes = {p.get('id') for p in pecas_existentes if p.get('id')}
            ids_pecas_enviadas = {peca_info.get('id') for peca_info in pecas if peca_info.get('id')}
            
            # Deletar peças que foram removidas (existem no banco mas não foram enviadas)
            pecas_para_deletar = ids_pecas_existentes - ids_pecas_enviadas
            for peca_id in pecas_para_deletar:
                pecas_service.deletar_peca(peca_id)
            
            # Atualizar ou criar peças usando o service
            for peca_info in pecas:
                peca_id = peca_info.get('id')
                if peca_id and peca_id in ids_pecas_existentes:
                    # Peça existente - atualizar usando o service
                    pecas_service.atualizar_peca(
                        peca_id=peca_id,
                        modelo_id=modelo.id,
                        codigo=peca_info.get('codigo', ''),
                        nome=peca_info.get('nome', '')
                    )
                else:
                    # Nova peça - criar usando o service
                    pecas_service.criar_peca(
                        modelo_id=modelo.id,
                        codigo=peca_info.get('codigo', ''),
                        nome=peca_info.get('nome', '')
                    )

        return {
            'sucesso': True, 
            'mensagem': f'Modelo {modelo_id} atualizado',
            'modelo': modelo.to_dict()
        }
    
    except Exception as erro:
        print(f'Erro ao atualizar modelo: {erro}')
        return {'erro': f'Não foi possível atualizar o modelo {modelo_id}: {str(erro)}'}