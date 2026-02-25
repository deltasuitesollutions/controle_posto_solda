from typing import Dict, Any, List
from Server.models import Modelo
from Server.models.database import DatabaseConnection
from Server.services import pecas_service  

# LISTAR
def listar_modelos():
    try: 
        modelos = Modelo.listar_todos()
        resultado = []
        for modelo in modelos:
            pecas = pecas_service.buscar_por_modelo_id(modelo.id)
            produto_id = Modelo.buscar_produto_por_modelo_id(modelo.id)
            resultado.append({
                'id': modelo.id,
                'codigo': modelo.codigo,
                'nome': modelo.descricao,  
                'produto_id': produto_id,
                'pecas': pecas
            })
        return resultado
    except Exception as erro:
        print(f'Erro ao listar modelos: {erro}')
        import traceback
        traceback.print_exc()
        return []

# BUSCAR MODELO  
def buscar_modelo_por_codigo(codigo):  
    try:
        modelo = Modelo.buscar_por_codigo(codigo)
        if not modelo:
            return {'erro': f'Modelo com código {codigo} não encontrado'}
        
        pecas = pecas_service.buscar_por_modelo_id(modelo.id)
        
        return {
            'id': modelo.id,
            'codigo': modelo.codigo,
            'nome': modelo.descricao,  
            'pecas': pecas
        }
    except Exception as erro:
        print(f'Erro ao buscar modelo: {erro}')
        return {'erro': 'Não foi possível buscar o modelo'}
    
# CRIAR
def criar_modelo(codigo, nome, pecas=None, produto_id=None):
    try:
        novo_modelo = Modelo(codigo=codigo, descricao=nome)
        novo_modelo.save()

        if produto_id and novo_modelo.id:
            Modelo.associar_produto(novo_modelo.id, produto_id)

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
            'id': novo_modelo.id,
            'mensagem': f'Modelo {codigo} criado com sucesso'
        }
    
    except Exception as erro:
        print(f'Erro ao criar modelo: {erro}')
        return {'erro': f'Não foi possível criar o modelo: {str(erro)}'}

# DELETAR 
def deletar_modelo(modelo_id):
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

# ATUALIZAR  
def atualizar_modelo(modelo_id, codigo=None, nome=None, pecas=None, produto_id=None):
    try:
        modelo = Modelo.buscar_por_id(modelo_id)
        if not modelo:
            return {'erro': f'Modelo com ID {modelo_id} não encontrado'}
       
        if codigo is not None:
            modelo.codigo = codigo
        
        if nome is not None:
            modelo.descricao = nome
        
        if nome is not None or codigo is not None:
            modelo.save()

        if produto_id is not None and modelo.id:
            if produto_id:
                Modelo.associar_produto(modelo.id, produto_id)
            else:
                Modelo.remover_associacao_produto(modelo.id)

        if pecas is not None and modelo.id:
            pecas_existentes = pecas_service.buscar_por_modelo_id(modelo.id)
            ids_pecas_existentes = {p.get('id') for p in pecas_existentes if p.get('id')}
            ids_pecas_enviadas = {peca_info.get('id') for peca_info in pecas if peca_info.get('id')}
            
            pecas_para_deletar = ids_pecas_existentes - ids_pecas_enviadas
            for peca_id in pecas_para_deletar:
                pecas_service.deletar_peca(peca_id)
            
            for peca_info in pecas:
                peca_id = peca_info.get('id')
                if peca_id and peca_id in ids_pecas_existentes:
                    pecas_service.atualizar_peca(
                        peca_id=peca_id,
                        modelo_id=modelo.id,
                        codigo=peca_info.get('codigo', ''),
                        nome=peca_info.get('nome', '')
                    )
                else:
                    pecas_service.criar_peca(
                        modelo_id=modelo.id,
                        codigo=peca_info.get('codigo', ''),
                        nome=peca_info.get('nome', '')
                    )

        modelo_atualizado = Modelo.buscar_por_id(modelo_id)
        produto_id = Modelo.buscar_produto_por_modelo_id(modelo_id) if modelo_atualizado else None
        
        return {
            'sucesso': True, 
            'mensagem': f'Modelo {modelo_id} atualizado',
            'modelo': {
                'id': modelo_atualizado.id if modelo_atualizado else modelo_id,
                'codigo': modelo_atualizado.codigo if modelo_atualizado else None,
                'nome': modelo_atualizado.descricao if modelo_atualizado else None,
                'produto_id': produto_id
            }
        }
    
    except Exception as erro:
        print(f'Erro ao atualizar modelo: {erro}')
        return {'erro': f'Não foi possível atualizar o modelo {modelo_id}: {str(erro)}'}