from typing import Dict, Any, List
from Server.models import Peca
from Server.models.database import DatabaseConnection

def listar_todas():
    """Lista todas as peças"""
    try:
        pecas = Peca.listar_todas()
        return [peca.to_dict() for peca in pecas]
    except Exception as e:
        print(f'Erro ao listar peças: {e}')
        return []

def listar_todas_com_relacoes():
    """Lista todas as peças com informações de modelo e produto em uma única query otimizada"""
    try:
        # Query otimizada usando DISTINCT ON para evitar duplicatas
        # e subquery para garantir um produto por modelo
        query = """
            SELECT DISTINCT ON (p.peca_id)
                p.peca_id,
                p.codigo,
                p.nome,
                COALESCE(m.modelo_id, 0) as modelo_id,
                COALESCE(m.nome, '') as modelo_nome,
                COALESCE(
                    (SELECT pr.produto_id 
                     FROM produto_modelo pm2 
                     INNER JOIN produtos pr ON pm2.produto_id = pr.produto_id 
                     WHERE pm2.modelo_id = m.modelo_id 
                     LIMIT 1), 
                    0
                ) as produto_id,
                COALESCE(
                    (SELECT pr.nome 
                     FROM produto_modelo pm2 
                     INNER JOIN produtos pr ON pm2.produto_id = pr.produto_id 
                     WHERE pm2.modelo_id = m.modelo_id 
                     LIMIT 1), 
                    ''
                ) as produto_nome
            FROM pecas p
            LEFT JOIN modelo_pecas mp ON p.peca_id = mp.peca_id
            LEFT JOIN modelos m ON mp.modelo_id = m.modelo_id
            ORDER BY p.peca_id, p.codigo
        """
        resultados = DatabaseConnection.execute_query(query, fetch_all=True)
        
        pecas_enriquecidas = []
        if resultados:
            for resultado in resultados:
                peca_dict = {
                    'id': resultado[0],
                    'codigo': resultado[1],
                    'nome': resultado[2],
                    'modelo_id': resultado[3] if resultado[3] != 0 else None,
                    'modelo_nome': resultado[4] if resultado[4] else None,
                    'produto_id': resultado[5] if resultado[5] != 0 else None,
                    'produto_nome': resultado[6] if resultado[6] else None
                }
                pecas_enriquecidas.append(peca_dict)
        
        return pecas_enriquecidas
    except Exception as e:
        print(f'Erro ao listar peças com relações: {e}')
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
        # Verificar se peça já existe para este modelo (código E nome)
        pecas_existentes = Peca.buscar_por_modelo_id(modelo_id)
        for peca in pecas_existentes:
            if peca.codigo.lower() == codigo.lower() and peca.nome.lower() == nome.lower():
                return {'erro': 'Peça e código existente já cadastrado'}
        
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