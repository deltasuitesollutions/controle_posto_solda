from typing import Dict, Any, List
from Server.models import Produto

def criar_produto(nome):
    # CRIAR
    try: 
        produto_existente = Produto.buscarNome(nome)
        if produto_existente:
            return {'erro': f'Já existe um produto com o nome {nome}'}
        
        novo_produto = Produto(nome=nome)
        novo_produto.salvar()

        return {
            'sucesso': True,
            'produto_id': novo_produto.id,
            'mensagem': f'Produto {nome} criado com sucesso'
        }
    
    except Exception as erro:
        print(f'Erro ao criar produto: {erro}')
        return {'erro': f'Não foi possível criar o produto'}
    

def atualizar_produto(produto_id, nome=None):
    # ATUALIZAR
    try:
        produto = Produto.buscarId(produto_id)
        if not produto:
            return {'erro': f'Produto com ID {produto_id} não encontrado'}
        
        if nome and nome != produto.nome:
            produto_com_mesmo_nome = Produto.buscarNome(nome)
            if produto_com_mesmo_nome and produto_com_mesmo_nome.id != produto_id:
                return {'erro': f'Outro produto já usa o nome {nome}'}
            produto.nome = nome
        elif nome:
            produto.nome = nome

        produto.salvar()

        return {
            'sucesso': True,
            'mensagem': f'Produto {produto_id} atualizado',
            'produto_id': produto.id
        }
    
    except Exception as erro:
        print(f'Erro ao atualizar produto: {erro}')
        return {'erro': f'Não foi possível atualizar o produto {produto_id}'}
    

def deletar_produto(produto_id):
    # DELETAR
    try:
        produto = Produto.buscarId(produto_id)
        if not produto:
            return {'erro': f'Produto com ID {produto_id} não encontrado'}
        
        produto.deletar()

        return {
            'sucesso': True,
            'mensagem': f'Produto {produto_id} deletado'
        }
    
    except Exception as erro:
        return {'erro': f'Não foi possível deletar o produto {produto_id}'}
    
def listar_produtos():
    # LISTAR
    try:
        produtos = Produto.listarTodos()
        resultado = []
        
        for produto in produtos:
            produto_info = {
                'id': produto.id,
                'nome': produto.nome
            }
            resultado.append(produto_info)
        
        return resultado
    
    except Exception as erro:
        print(f'Erro ao listar produtos: {erro}')
        return []

def buscar_produto_por_id(produto_id):
    try:
        produto = Produto.buscarId(produto_id)
        if not produto:
            return {'erro': f'Produto com ID {produto_id} não encontrado'}
        
        return {
            'id': produto.id,
            'nome': produto.nome
        }
    
    except Exception as erro:
        print(f'Erro ao buscar produto: {erro}')
        return {'erro': f'Não foi possível buscar o produto {produto_id}'}
    