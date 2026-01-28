from typing import Dict, Any, List, Optional
from Server.models.operacao import Operacao
from Server.models.produto import Produto
from Server.models.modelo import Modelo
from Server.models.sublinha import Sublinha
from Server.models.linha import Linha
from Server.models.posto import Posto
from Server.models.peca import Peca
from Server.models.database import DatabaseConnection
from Server.services import dispositivo_raspberry_service


def _buscar_info_dispositivo_por_toten(toten_id: int) -> Dict[str, Any]:
    """
    Busca informações do dispositivo Raspberry baseado no toten_id
    Retorna dict com serial, nome e dispositivo_id ou valores vazios
    """
    try:
        dispositivos = dispositivo_raspberry_service.listar_dispositivos()
        if dispositivos and len(dispositivos) > 0:
            # Associar sequencialmente: dispositivo 0 -> toten 1, dispositivo 1 -> toten 2, etc.
            toten_index = toten_id - 1 if toten_id > 0 else 0
            if toten_index < len(dispositivos):
                dispositivo = dispositivos[toten_index]
                return {
                    'serial': dispositivo.get('serial', ''),
                    'nome': dispositivo.get('nome', ''),
                    'dispositivo_id': dispositivo.get('id')
                }
    except Exception as e:
        print(f'Erro ao buscar dispositivo por toten: {e}')
    
    return {
        'serial': '',
        'nome': '',
        'dispositivo_id': None
    }

# LISTAR
def listar_operacoes() -> List[Dict[str, Any]]:
    try:
        operacoes = Operacao.listar_todas()
        operacoes_agrupadas = {}
        
        for operacao in operacoes:
            produto = Produto.buscarId(operacao.produto_id) if operacao.produto_id else None
            modelo = Modelo.buscar_por_id(operacao.modelo_id) if operacao.modelo_id else None
            sublinha = Sublinha.buscar_por_id(operacao.sublinha_id) if operacao.sublinha_id else None
            linha = None
            if sublinha:
                linha = Linha.buscar_por_id(sublinha.linha_id)
            posto = Posto.buscar_por_id(operacao.posto_id) if operacao.posto_id else None
            nome_operacao = operacao.nome or operacao.codigo_operacao
            chave = f"{nome_operacao}_{produto.id if produto else ''}_{modelo.id if modelo else ''}_{sublinha.sublinha_id if sublinha else ''}_{posto.posto_id if posto else ''}"
            
            if chave not in operacoes_agrupadas:
                query_totens = """
                    SELECT DISTINCT toten_nome 
                    FROM operacao_totens 
                    WHERE operacao_id = %s
                """
                totens_rows = DatabaseConnection.execute_query(query_totens, (operacao.operacao_id,), fetch_all=True)
                totens = [row[0] for row in totens_rows] if totens_rows else []
                if not totens and posto:
                    totens = [f'ID-{posto.toten_id}']
                
                query_pecas = """
                    SELECT p.peca_id, p.codigo, p.nome
                    FROM operacao_pecas op
                    INNER JOIN pecas p ON op.peca_id = p.peca_id
                    WHERE op.operacao_id = %s
                """
                pecas_rows = DatabaseConnection.execute_query(query_pecas, (operacao.operacao_id,), fetch_all=True)
                pecas_relacionadas = [Peca.buscar_por_id(row[0]) for row in pecas_rows] if pecas_rows else []
                pecas_codigos = [p.codigo for p in pecas_relacionadas if p]
                pecas_nomes = [p.nome for p in pecas_relacionadas if p]
                
                if not pecas_codigos and modelo:
                    pecas_modelo = Peca.buscar_por_modelo_id(modelo.id)
                    pecas_codigos = list(set([p.codigo for p in pecas_modelo]))
                    pecas_nomes = list(set([p.nome for p in pecas_modelo]))
                
                # Usar codigo_operacao da própria tabela operacoes
                codigos_list = [operacao.codigo_operacao] if operacao.codigo_operacao else []
                
                if not codigos_list and pecas_codigos:
                    codigos_list = [pecas_codigos[0]]
                
                # Buscar informações do dispositivo se houver posto
                serial = ''
                nome = ''
                dispositivo_id = None
                if posto:
                    info_dispositivo = _buscar_info_dispositivo_por_toten(posto.toten_id)
                    serial = info_dispositivo['serial']
                    nome = info_dispositivo['nome']
                    dispositivo_id = info_dispositivo['dispositivo_id']
                
                operacoes_agrupadas[chave] = {
                    'id': str(operacao.operacao_id),  
                    'operacao': operacao.nome or operacao.codigo_operacao,  
                    'produto': produto.nome if produto else '',
                    'modelo': modelo.descricao if modelo else '',
                    'linha': linha.nome if linha else '',
                    'posto': posto.nome if posto else '',
                    'totens': totens,
                    'pecas': pecas_codigos,
                    'pecas_nomes': pecas_nomes,  
                    'codigos': codigos_list,
                    'serial': serial,
                    'hostname': nome,
                    'dispositivo_id': dispositivo_id
                }
        
        resultado = list(operacoes_agrupadas.values())
        resultado.sort(key=lambda x: x.get('operacao', ''))
        
        return resultado
    except Exception as erro:
        print(f'Erro ao listar operações: {erro}')
        import traceback
        traceback.print_exc()
        return []


# BUSCAR OPERAÇÃO POR ID
def buscar_operacao_por_id(operacao_id: int) -> Dict[str, Any]:
    try:
        operacao = Operacao.buscar_por_id(operacao_id)
        if not operacao:
            return {'erro': f'Operação com ID {operacao_id} não encontrada'}
        
        produto = Produto.buscarId(operacao.produto_id) if operacao.produto_id else None
        modelo = Modelo.buscar_por_id(operacao.modelo_id) if operacao.modelo_id else None
        sublinha = Sublinha.buscar_por_id(operacao.sublinha_id) if operacao.sublinha_id else None
        linha = None
        if sublinha:
            linha = Linha.buscar_por_id(sublinha.linha_id)
        posto = Posto.buscar_por_id(operacao.posto_id) if operacao.posto_id else None
        peca = Peca.buscar_por_id(operacao.peca_id) if operacao.peca_id else None
        
        query_totens = """
            SELECT DISTINCT toten_nome 
            FROM operacao_totens 
            WHERE operacao_id = %s
        """
        totens_rows = DatabaseConnection.execute_query(query_totens, (operacao.operacao_id,), fetch_all=True)
        totens = [row[0] for row in totens_rows] if totens_rows else []
        
        if not totens and posto:
            totens = [f'ID-{posto.toten_id}']
        
        query_pecas = """
            SELECT p.peca_id, p.codigo, p.nome
            FROM operacao_pecas op
            INNER JOIN pecas p ON op.peca_id = p.peca_id
            WHERE op.operacao_id = %s
        """
        pecas_rows = DatabaseConnection.execute_query(query_pecas, (operacao.operacao_id,), fetch_all=True)
        pecas_relacionadas = [Peca.buscar_por_id(row[0]) for row in pecas_rows] if pecas_rows else []
        pecas_codigos = [p.codigo for p in pecas_relacionadas if p]
        pecas_nomes = [p.nome for p in pecas_relacionadas if p]
        if not pecas_codigos and modelo:
            pecas_modelo = Peca.buscar_por_modelo_id(modelo.id)
            pecas_codigos = [p.codigo for p in pecas_modelo]
            pecas_nomes = [p.nome for p in pecas_modelo]
    
        # Usar codigo_operacao da própria tabela operacoes
        codigos = [operacao.codigo_operacao] if operacao.codigo_operacao else []
        if not codigos and pecas_codigos:
            codigos = [pecas_codigos[0]]
        
        # Buscar informações do dispositivo se houver posto
        serial = ''
        hostname = ''
        dispositivo_id = None
        if posto:
            info_dispositivo = _buscar_info_dispositivo_por_toten(posto.toten_id)
            serial = info_dispositivo['serial']
            nome = info_dispositivo['nome']
            dispositivo_id = info_dispositivo['dispositivo_id']
        
        return {
            'id': str(operacao.operacao_id),
            'operacao': operacao.nome or operacao.codigo_operacao, 
            'produto': produto.nome if produto else '',
            'modelo': modelo.nome if modelo else '',
            'linha': linha.nome if linha else '',
            'posto': posto.nome if posto else '',
            'totens': totens,
            'pecas': pecas_codigos,
            'pecas_nomes': pecas_nomes,  # Nomes das peças
            'codigos': codigos,
            'serial': serial,
            'hostname': hostname,
            'dispositivo_id': dispositivo_id
        }
    except Exception as erro:
        print(f'Erro ao buscar operação: {erro}')
        return {'erro': f'Não foi possível buscar a operação: {str(erro)}'}


def criar_operacao(
    operacao: str,
    produto: str,
    modelo: str,
    linha: str,
    posto: str,
    totens: Optional[List[str]] = None,
    pecas: Optional[List[str]] = None,
    codigos: Optional[List[str]] = None
) -> Dict[str, Any]:
    try:
        produto_obj = Produto.buscarNome(produto)
        if not produto_obj:
            return {'erro': f'Produto "{produto}" não encontrado'}
        
        modelo_obj = Modelo.buscar_por_codigo(modelo)
        if not modelo_obj:
            return {'erro': f'Modelo "{modelo}" não encontrado'}
        linha_obj = Linha.buscar_por_nome(linha)
        if not linha_obj:
            return {'erro': f'Linha "{linha}" não encontrada'}
        
        sublinhas = Sublinha.buscar_por_linha(linha_obj.linha_id)
        if not sublinhas:
            return {'erro': f'Nenhuma sublinha encontrada para a linha "{linha}"'}
        sublinha = sublinhas[0]
        postos = Posto.listar_todos()
        posto_encontrado = None
        for p in postos:
            if p.nome == posto:
                posto_encontrado = p
                break
        
        if not posto_encontrado:
            return {'erro': f'Posto "{posto}" não encontrado'}
        
        nova_operacao = Operacao.criar(
            codigo_operacao=operacao, 
            nome=operacao, 
            produto_id=produto_obj.id,
            modelo_id=modelo_obj.id,
            sublinha_id=sublinha.sublinha_id,
            posto_id=posto_encontrado.posto_id,
            peca_id=None  
        )
        
        if totens and len(totens) > 0:
            for toten_nome in totens:
                query_toten = """
                    INSERT INTO operacao_totens (operacao_id, toten_nome)
                    VALUES (%s, %s)
                """
                DatabaseConnection.execute_query(query_toten, (nova_operacao.operacao_id, toten_nome))
        
        todas_pecas = Peca.listar_todas()
        pecas_encontradas = []
        if pecas and len(pecas) > 0:
            for nome_peca in pecas:
                for p in todas_pecas:
                    if p.nome == nome_peca:
                        pecas_encontradas.append(p)
                        break
        
        if not pecas_encontradas and modelo_obj:
            pecas_encontradas = Peca.buscar_por_modelo_id(modelo_obj.id)
        
        for peca in pecas_encontradas:
            query_peca = """
                INSERT INTO operacao_pecas (operacao_id, peca_id)
                VALUES (%s, %s)
                ON CONFLICT (operacao_id, peca_id) DO NOTHING
            """
            DatabaseConnection.execute_query(query_peca, (nova_operacao.operacao_id, peca.id))
        
        return {
            'sucesso': True,
            'operacao_id': nova_operacao.operacao_id,
            'mensagem': 'Operação criada com sucesso',
            'operacao': buscar_operacao_por_id(nova_operacao.operacao_id)
        }
    except Exception as erro:
        print(f'Erro ao criar operação: {erro}')
        import traceback
        traceback.print_exc()
        return {'erro': f'Não foi possível criar a operação: {str(erro)}'}


def atualizar_operacao(
    operacao_id: int,
    operacao: Optional[str] = None,
    produto: Optional[str] = None,
    modelo: Optional[str] = None,
    linha: Optional[str] = None,
    posto: Optional[str] = None,
    totens: Optional[List[str]] = None,
    pecas: Optional[List[str]] = None,
    codigos: Optional[List[str]] = None
) -> Dict[str, Any]:
    try:
        operacao_obj = Operacao.buscar_por_id(operacao_id)
        if not operacao_obj:
            return {'erro': f'Operação com ID {operacao_id} não encontrada'}
        
        if operacao:
            operacao_obj.nome = operacao  
            if not codigos or len(codigos) == 0:
                operacao_obj.codigo_operacao = operacao
        
        if produto:
            produto_obj = Produto.buscarNome(produto)
            if not produto_obj:
                return {'erro': f'Produto "{produto}" não encontrado'}
            operacao_obj.produto_id = produto_obj.id
        
        if modelo:
            modelo_obj = Modelo.buscar_por_codigo(modelo)
            if not modelo_obj:
                return {'erro': f'Modelo "{modelo}" não encontrado'}
            operacao_obj.modelo_id = modelo_obj.id
        
        if linha:
            linha_obj = Linha.buscar_por_nome(linha)
            if not linha_obj:
                return {'erro': f'Linha "{linha}" não encontrada'}
            sublinhas = Sublinha.buscar_por_linha(linha_obj.linha_id)
            if not sublinhas:
                return {'erro': f'Nenhuma sublinha encontrada para a linha "{linha}"'}
            operacao_obj.sublinha_id = sublinhas[0].sublinha_id
        
        if posto:
            postos = Posto.listar_todos()
            posto_encontrado = None
            for p in postos:
                if p.nome == posto:
                    posto_encontrado = p
                    break
            if not posto_encontrado:
                return {'erro': f'Posto "{posto}" não encontrado'}
            operacao_obj.posto_id = posto_encontrado.posto_id
        
        operacao_obj.salvar()
        if totens is not None:
            query_delete_totens = "DELETE FROM operacao_totens WHERE operacao_id = %s"
            DatabaseConnection.execute_query(query_delete_totens, (operacao_id,))
            if len(totens) > 0:
                for toten_nome in totens:
                    query_insert_toten = """
                        INSERT INTO operacao_totens (operacao_id, toten_nome)
                        VALUES (%s, %s)
                    """
                    DatabaseConnection.execute_query(query_insert_toten, (operacao_id, toten_nome))
        
        if pecas is not None:
            
            query_delete_pecas = "DELETE FROM operacao_pecas WHERE operacao_id = %s"
            DatabaseConnection.execute_query(query_delete_pecas, (operacao_id,))
            if len(pecas) > 0:
                todas_pecas = Peca.listar_todas()
                for nome_peca in pecas:
                    for p in todas_pecas:
                        if p.nome == nome_peca:
                            query_insert_peca = """
                                INSERT INTO operacao_pecas (operacao_id, peca_id)
                                VALUES (%s, %s)
                                ON CONFLICT (operacao_id, peca_id) DO NOTHING
                            """
                            DatabaseConnection.execute_query(query_insert_peca, (operacao_id, p.id))
                            break
        
        
        return {
            'sucesso': True,
            'mensagem': f'Operação {operacao_id} atualizada com sucesso',
            'operacao': buscar_operacao_por_id(operacao_id)
        }
    except Exception as erro:
        print(f'Erro ao atualizar operação: {erro}')
        return {'erro': f'Não foi possível atualizar a operação: {str(erro)}'}


def deletar_operacao(operacao_id: int) -> Dict[str, Any]:
    try:
        operacao = Operacao.buscar_por_id(operacao_id)
        if not operacao:
            return {'erro': f'Operação com ID {operacao_id} não encontrada'}
        
        operacao.deletar()
        
        return {
            'sucesso': True,
            'mensagem': f'Operação {operacao_id} deletada com sucesso'
        }
    except Exception as erro:
        print(f'Erro ao deletar operação: {erro}')
        return {'erro': f'Não foi possível deletar a operação: {str(erro)}'}

