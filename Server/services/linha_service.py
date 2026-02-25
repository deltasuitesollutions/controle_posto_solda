from Server.models.linha import Linha

# CRIAR
def criar_linha(nome):
    try:
        if Linha.existe_nome(nome):
            return {'erro': f'Já existe uma linha com o nome {nome}'}
        
        nova_linha = Linha(nome=nome)
        nova_linha.salvar()

        return {
            'sucesso': True,
            'linha_id': nova_linha.linha_id,
            'mensagem': f'Linha {nome} criada com sucesso'
        }
    
    except Exception as erro:
        print(f'Erro ao criar linha: {erro}')
        return {'erro': f'Não foi possível criar a linha'}

# ATUALIZAR
def atualizar_linha(linha_id, nome=None):
    try:
        linha = Linha.buscar_por_id(linha_id)
        if not linha:
            return {'erro': f'Linha com ID {linha_id} não encontrada'}
        
        if nome and nome != linha.nome:
            if Linha.existe_nome(nome, excluir_id=linha_id):
                return {'erro': f'Outra linha já usa o nome {nome}'}
            linha.nome = nome

        linha.salvar()

        return {
            'sucesso': True,
            'mensagem': f'Linha {linha_id} atualizada',
            'linha_id': linha.linha_id
        }
    
    except Exception as erro:
        print(f'Erro ao atualizar linha: {erro}')
        return {'erro': f'Não foi possível atualizar a linha {linha_id}'}

# DELETAR
def deletar_linha(linha_id):
    try:
        linha = Linha.buscar_por_id(linha_id)
        if not linha:
            return {'erro': f'Linha com ID {linha_id} não encontrada'}
        
        # Buscar sublinhas antes de deletar para informar ao usuário
        from Server.models.sublinha import Sublinha
        sublinhas = Sublinha.buscar_por_linha(linha_id)
        quantidade_sublinhas = len(sublinhas) if sublinhas else 0
        
        # Deletar a linha (que também deletará as sublinhas automaticamente)
        sucesso = linha.deletar()
        if not sucesso:
            return {'erro': f'Não foi possível deletar a linha {linha_id}'}

        mensagem = f'Linha "{linha.nome}" deletada com sucesso'
        if quantidade_sublinhas > 0:
            mensagem += f' (juntamente com {quantidade_sublinhas} sublinha(s) associada(s))'

        return {
            'sucesso': True,
            'mensagem': mensagem
        }
    
    except Exception as erro:
        print(f'Erro ao deletar linha: {erro}')
        import traceback
        traceback.print_exc()
        return {'erro': f'Não foi possível deletar a linha {linha_id}: {str(erro)}'}

# LISTAR
def listar_linhas():
    try:
        linhas = Linha.listar_todas()
        resultado = []
        
        for linha in linhas:
            linha_info = {
                'linha_id': linha.linha_id,
                'nome': linha.nome
            }
            resultado.append(linha_info)
        
        return resultado
    
    except Exception as erro:
        print(f'Erro ao listar linhas: {erro}')
        return []

# BUSCAR POR ID
def buscar_linha_por_id(linha_id):
    try:
        linha = Linha.buscar_por_id(linha_id)
        if not linha:
            return {'erro': f'Linha com ID {linha_id} não encontrada'}
        
        return {
            'linha_id': linha.linha_id,
            'nome': linha.nome
        }
    
    except Exception as erro:
        print(f'Erro ao buscar linha: {erro}')
        return {'erro': f'Não foi possível buscar a linha {linha_id}'}


# BUSCA DE LINHA POR NOME
def buscar_linhas_por_nome(nome):
    try:
        linhas = Linha.buscar_por_nome_parcial(nome)
        resultado = []
        
        for linha in linhas:
            linha_info = {
                'linha_id': linha.linha_id,
                'nome': linha.nome
            }
            resultado.append(linha_info)
        
        return resultado
    
    except Exception as erro:
        print(f'Erro ao buscar linhas: {erro}')
        return []

