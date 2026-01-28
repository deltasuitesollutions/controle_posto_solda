from Server.models.sublinha import Sublinha
from Server.models.linha import Linha

# CRIAR
def criar_sublinha(nome, linha_id):
    try:
        linha = Linha.buscar_por_id(linha_id)
        if not linha:
            return {'erro': f'Linha com ID {linha_id} não encontrada'}
        
        if Sublinha.existe_nome_na_linha(nome, linha_id):
            return {'erro': f'Já existe uma sublinha com o nome {nome} nesta linha'}
        
        nova_sublinha = Sublinha(nome=nome, linha_id=linha_id)
        nova_sublinha.salvar()

        return {
            'sucesso': True,
            'sublinha_id': nova_sublinha.sublinha_id,
            'mensagem': f'Sublinha {nome} criada com sucesso'
        }
    
    except Exception as erro:
        print(f'Erro ao criar sublinha: {erro}')
        return {'erro': f'Não foi possível criar a sublinha'}

# ATUALIZAR 
def atualizar_sublinha(sublinha_id, nome=None, linha_id=None):
    try:
        sublinha = Sublinha.buscar_por_id(sublinha_id)
        if not sublinha:
            return {'erro': f'Sublinha com ID {sublinha_id} não encontrada'}
        
        nova_linha_id = linha_id if linha_id is not None else sublinha.linha_id
        
        if linha_id is not None:
            linha = Linha.buscar_por_id(linha_id)
            if not linha:
                return {'erro': f'Linha com ID {linha_id} não encontrada'}
        
        if nome and nome != sublinha.nome:
            if Sublinha.existe_nome_na_linha(nome, nova_linha_id, excluir_id=sublinha_id):
                return {'erro': f'Outra sublinha já usa o nome {nome} nesta linha'}
            sublinha.nome = nome
        
        if linha_id is not None:
            sublinha.linha_id = linha_id

        sublinha.salvar()

        return {
            'sucesso': True,
            'mensagem': f'Sublinha {sublinha_id} atualizada',
            'sublinha_id': sublinha.sublinha_id
        }
    
    except Exception as erro:
        print(f'Erro ao atualizar sublinha: {erro}')
        return {'erro': f'Não foi possível atualizar a sublinha {sublinha_id}'}

# DELETAR
def deletar_sublinha(sublinha_id):
    try:
        sublinha = Sublinha.buscar_por_id(sublinha_id)
        if not sublinha:
            return {'erro': f'Sublinha com ID {sublinha_id} não encontrada'}
        
        sucesso = sublinha.deletar()
        if not sucesso:
            return {'erro': f'Não foi possível deletar a sublinha {sublinha_id}'}

        return {
            'sucesso': True,
            'mensagem': f'Sublinha {sublinha_id} deletada'
        }
    
    except Exception as erro:
        print(f'Erro ao deletar sublinha: {erro}')
        return {'erro': f'Não foi possível deletar a sublinha {sublinha_id}: {str(erro)}'}

# LISTAR
def listar_sublinhas(com_linha=False):
    try:
        sublinhas = Sublinha.listar_todas(com_linha=com_linha)
        resultado = []
        
        for sublinha in sublinhas:
            sublinha_info = {
                'sublinha_id': sublinha.sublinha_id,
                'linha_id': sublinha.linha_id,
                'nome': sublinha.nome
            }
            if com_linha and sublinha.linha_nome:
                sublinha_info['linha_nome'] = sublinha.linha_nome
            resultado.append(sublinha_info)
        
        return resultado
    
    except Exception as erro:
        print(f'Erro ao listar sublinhas: {erro}')
        return []

# BUSCAR SUBLINHA
def buscar_sublinha_por_id(sublinha_id):
    try:
        sublinha = Sublinha.buscar_por_id(sublinha_id)
        if not sublinha:
            return {'erro': f'Sublinha com ID {sublinha_id} não encontrada'}
        
        return {
            'sublinha_id': sublinha.sublinha_id,
            'linha_id': sublinha.linha_id,
            'nome': sublinha.nome
        }
    
    except Exception as erro:
        print(f'Erro ao buscar sublinha: {erro}')
        return {'erro': f'Não foi possível buscar a sublinha {sublinha_id}'}


# BUSCAR SUBLINHA POR LINHA
def buscar_sublinhas_por_linha(linha_id):
    try:
        sublinhas = Sublinha.buscar_por_linha(linha_id)
        resultado = []
        
        for sublinha in sublinhas:
            sublinha_info = {
                'sublinha_id': sublinha.sublinha_id,
                'linha_id': sublinha.linha_id,
                'nome': sublinha.nome
            }
            resultado.append(sublinha_info)
        
        return resultado
    
    except Exception as erro:
        print(f'Erro ao buscar sublinhas: {erro}')
        return []


# BUSCAR SUBLINHA POR NOME
def buscar_sublinhas_por_nome(nome):
    try:
        sublinhas = Sublinha.buscar_por_nome_parcial(nome)
        resultado = []
        
        for sublinha in sublinhas:
            sublinha_info = {
                'sublinha_id': sublinha.sublinha_id,
                'linha_id': sublinha.linha_id,
                'nome': sublinha.nome
            }
            resultado.append(sublinha_info)
        
        return resultado
    
    except Exception as erro:
        print(f'Erro ao buscar sublinhas: {erro}')
        return []

