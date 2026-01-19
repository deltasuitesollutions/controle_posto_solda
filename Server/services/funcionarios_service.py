from typing import Dict, Any, List, Optional
from Server.models import Funcionario
from Server.models.database import DatabaseConnection


# Lista todos os funcionários ativos
def listar_funcionarios() -> List[Dict[str, Any]]:
    funcionarios = Funcionario.listar_ativos()
    resultado = []
    
    for f in funcionarios:
        item = {
            "id": f.funcionario_id,  # Adiciona 'id' para compatibilidade com frontend
            "funcionario_id": f.funcionario_id,
            "matricula": f.matricula, 
            "nome": f.nome,
            "ativo": f.ativo  # Adiciona campo ativo que estava faltando
        }
        if f.tag_id:
            item["tag"] = f.tag_id  # Adiciona 'tag' para compatibilidade com frontend
            item["tag_id"] = f.tag_id
        if f.turno:
            item["turno"] = f.turno
        resultado.append(item)
    
    return resultado


# Lista todos os funcionários (ativos e inativos)
def listar_todos_funcionarios() -> List[Dict[str, Any]]:
    funcionarios = Funcionario.listar_todos()
    resultado = []
    
    for f in funcionarios:
        funcionario_dict = f.to_dict()
        # Buscar operações habilitadas para cada funcionário
        if f.funcionario_id:
            operacoes_habilitadas = buscar_operacoes_habilitadas(f.funcionario_id)
            funcionario_dict['operacoes_habilitadas'] = operacoes_habilitadas
        resultado.append(funcionario_dict)
    
    return resultado


# Cria um novo funcionário
def criar_funcionario(
    matricula: str, 
    nome: str, 
    ativo: bool = True, 
    tag_id: Optional[str] = None,
    turno: Optional[str] = None,
    operacoes_ids: Optional[List[int]] = None
) -> Dict[str, Any]:
    
    if not matricula or not matricula.strip():
        raise Exception("Matrícula é obrigatória")
    
    matricula = matricula.strip()
    
    if Funcionario.buscar_por_matricula(matricula):
        raise Exception(f"Já existe um funcionário com a matrícula {matricula}")
    
    if tag_id:
        tag_id = tag_id.strip()
        # Verificar se a tag já está em uso por outro funcionário
        funcionario_com_tag = Funcionario.buscar_por_tag(tag_id)
        if funcionario_com_tag:
            raise Exception(f"Tag RFID '{tag_id}' já está em uso pelo funcionário {funcionario_com_tag.nome}")
    
    funcionario = Funcionario.criar(
        matricula=matricula, 
        nome=nome, 
        ativo=ativo, 
        tag_id=tag_id,
        turno=turno
    )
    
    # Habilitar operações se fornecidas
    if operacoes_ids and funcionario.funcionario_id:
        atualizar_operacoes_habilitadas(funcionario.funcionario_id, operacoes_ids)
    
    # Buscar operações habilitadas para retornar
    funcionario_dict = funcionario.to_dict()
    if funcionario.funcionario_id:
        operacoes_habilitadas = buscar_operacoes_habilitadas(funcionario.funcionario_id)
        funcionario_dict['operacoes_habilitadas'] = operacoes_habilitadas
    
    return funcionario_dict


# Atualiza um funcionário existente
def atualizar_funcionario(
    funcionario_id: int, 
    nome: str, 
    ativo: bool, 
    tag_id: Optional[str] = None,
    turno: Optional[str] = None,
    operacoes_ids: Optional[List[int]] = None
) -> Dict[str, Any]:
    
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    funcionario.nome = nome
    funcionario.ativo = ativo
    funcionario.turno = turno
    
    if tag_id is not None:
        tag_id = tag_id.strip() if tag_id else None
        
        if tag_id:
            # Verificar se a tag já está em uso por outro funcionário
            funcionario_com_tag = Funcionario.buscar_por_tag(tag_id)
            if funcionario_com_tag and funcionario_com_tag.funcionario_id != funcionario.funcionario_id:
                raise Exception(f"Tag RFID '{tag_id}' já está em uso pelo funcionário {funcionario_com_tag.nome}")
        
        funcionario.tag_id = tag_id
    
    funcionario.save()
    
    # Atualizar operações habilitadas se fornecidas
    if operacoes_ids is not None:
        atualizar_operacoes_habilitadas(funcionario_id, operacoes_ids)
    
    # Buscar operações habilitadas para retornar
    funcionario_dict = funcionario.to_dict()
    operacoes_habilitadas = buscar_operacoes_habilitadas(funcionario_id)
    funcionario_dict['operacoes_habilitadas'] = operacoes_habilitadas
    
    return funcionario_dict


# Remove um funcionário do sistema
def deletar_funcionario(funcionario_id: int) -> None:
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    funcionario.delete()


# Função adicional para buscar funcionário por tag
def buscar_funcionario_por_tag(tag_id: str) -> Optional[Dict[str, Any]]:
    """Busca um funcionário pelo ID da tag RFID"""
    funcionario = Funcionario.buscar_por_tag(tag_id)
    if not funcionario:
        return None
    return funcionario.to_dict()


# Função adicional para buscar funcionário por matrícula
def buscar_por_matricula(matricula: str) -> Optional[Dict[str, Any]]:
    """Busca um funcionário pela matrícula"""
    funcionario = Funcionario.buscar_por_matricula(matricula)
    if not funcionario:
        return None
    return funcionario.to_dict()


# Função para buscar operações habilitadas de um funcionário
def buscar_operacoes_habilitadas(funcionario_id: int) -> List[Dict[str, Any]]:
    """Busca todas as operações habilitadas para um funcionário"""
    try:
        query = """
            SELECT 
                oh.operacao_habilitada_id,
                oh.operacao_id,
                oh.data_habilitacao,
                o.codigo_operacao,
                o.nome as nome_operacao
            FROM operacoes_habilitadas oh
            INNER JOIN operacoes o ON oh.operacao_id = o.operacao_id
            WHERE oh.funcionario_id = %s
            ORDER BY oh.data_habilitacao DESC
        """
        rows = DatabaseConnection.execute_query(query, (funcionario_id,), fetch_all=True)
        
        if not rows:
            return []
        
        operacoes = []
        for row in rows:
            operacoes.append({
                'operacao_habilitada_id': row[0],
                'operacao_id': row[1],
                'data_habilitacao': row[2].isoformat() if row[2] else None,
                'codigo_operacao': row[3],
                'nome': row[4] if row[4] else row[3]  # Usar nome se existir, senão código
            })
        
        return operacoes
    except Exception as e:
        print(f'Erro ao buscar operações habilitadas: {e}')
        return []


# Função para atualizar operações habilitadas de um funcionário
def atualizar_operacoes_habilitadas(funcionario_id: int, operacoes_ids: List[int]) -> None:
    """
    Atualiza as operações habilitadas de um funcionário.
    Remove todas as operações existentes e adiciona as novas.
    
    Args:
        funcionario_id: ID do funcionário
        operacoes_ids: Lista de IDs das operações a serem habilitadas
    """
    from datetime import datetime
    
    # Verificar se o funcionário existe
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    # Remover todas as operações habilitadas existentes
    query_delete = "DELETE FROM operacoes_habilitadas WHERE funcionario_id = %s"
    DatabaseConnection.execute_query(query_delete, (funcionario_id,))
    
    # Adicionar as novas operações habilitadas
    if operacoes_ids:
        data_habilitacao = datetime.now()
        for operacao_id in operacoes_ids:
            # Verificar se a operação existe
            from Server.models.operacao import Operacao
            operacao = Operacao.buscar_por_id(operacao_id)
            if not operacao:
                print(f'Aviso: Operação com ID {operacao_id} não encontrada, ignorando...')
                continue
            
            query_insert = """
                INSERT INTO operacoes_habilitadas (funcionario_id, operacao_id, data_habilitacao)
                VALUES (%s, %s, %s)
            """
            DatabaseConnection.execute_query(query_insert, (funcionario_id, operacao_id, data_habilitacao))