from typing import Dict, Any, List, Optional
from Server.models import Funcionario
from Server.models.database import DatabaseConnection


# Lista todos os funcionários ativos
def listar_funcionarios() -> List[Dict[str, Any]]:
    funcionarios = Funcionario.listar_ativos()
    resultado = []
    
    for f in funcionarios:
        item = {
            "id": f.funcionario_id,  
            "funcionario_id": f.funcionario_id,
            "matricula": f.matricula, 
            "nome": f.nome,
            "ativo": f.ativo  
        }
        if f.tag_id:
            item["tag"] = f.tag_id  
            item["tag_id"] = f.tag_id
        # Buscar turnos da tabela funcionarios_turnos
        if f.funcionario_id:
            turnos_funcionario = buscar_turnos_funcionario(f.funcionario_id)
            item['turnos'] = turnos_funcionario
            if len(turnos_funcionario) == 1:
                item['turno'] = turnos_funcionario[0]
            elif len(turnos_funcionario) > 1:
                item['turno'] = ', '.join(turnos_funcionario)
        resultado.append(item)
    
    return resultado


# Lista todos os funcionários (ativos e inativos)
def listar_todos_funcionarios() -> List[Dict[str, Any]]:
    funcionarios = Funcionario.listar_todos()
    resultado = []
    
    for f in funcionarios:
        funcionario_dict = f.to_dict()
        # Buscar operações habilitadas e turnos para cada funcionário
        if f.funcionario_id:
            operacoes_habilitadas = buscar_operacoes_habilitadas(f.funcionario_id)
            funcionario_dict['operacoes_habilitadas'] = operacoes_habilitadas
            turnos_funcionario = buscar_turnos_funcionario(f.funcionario_id)
            funcionario_dict['turnos'] = turnos_funcionario
            # Manter compatibilidade: se houver apenas um turno, colocar no campo turno também
            if len(turnos_funcionario) == 1:
                funcionario_dict['turno'] = turnos_funcionario[0]
            elif len(turnos_funcionario) > 1:
                funcionario_dict['turno'] = ', '.join(turnos_funcionario)
        resultado.append(funcionario_dict)
    
    return resultado


# Cria um novo funcionário
def criar_funcionario(
    matricula: str, 
    nome: str, 
    ativo: bool = True, 
    tag_id: Optional[str] = None,
    turno: Optional[str] = None,
    turnos: Optional[List[str]] = None,
    operacoes_ids: Optional[List[int]] = None
) -> Dict[str, Any]:
    
    if not matricula or not matricula.strip():
        raise Exception("Matrícula é obrigatória")
    
    matricula = matricula.strip()
    
    if Funcionario.buscar_por_matricula(matricula):
        raise Exception(f"Já existe um funcionário com a matrícula {matricula}")
    
    if tag_id:
        tag_id = tag_id.strip()
        funcionario_com_tag = Funcionario.buscar_por_tag(tag_id)
        if funcionario_com_tag:
            raise Exception(f"Tag RFID '{tag_id}' já está em uso pelo funcionário {funcionario_com_tag.nome}")
    
    # Usar turno antigo se turnos não for fornecido (compatibilidade)
    turnos_finais = turnos if turnos is not None else ([turno] if turno else [])
    
    funcionario = Funcionario.criar(
        matricula=matricula, 
        nome=nome, 
        ativo=ativo, 
        tag_id=tag_id,
        turno=None  # Não usar mais o campo turno, usar a tabela funcionarios_turnos
    )
    
    # Atualizar turnos se fornecidos
    if turnos_finais and funcionario.funcionario_id:
        atualizar_turnos_funcionario(funcionario.funcionario_id, turnos_finais)
    
    # Habilitar operações se fornecidas
    if operacoes_ids and funcionario.funcionario_id:
        atualizar_operacoes_habilitadas(funcionario.funcionario_id, operacoes_ids)
    
    # Buscar operações habilitadas e turnos para retornar
    funcionario_dict = funcionario.to_dict()
    if funcionario.funcionario_id:
        operacoes_habilitadas = buscar_operacoes_habilitadas(funcionario.funcionario_id)
        funcionario_dict['operacoes_habilitadas'] = operacoes_habilitadas
        turnos_funcionario = buscar_turnos_funcionario(funcionario.funcionario_id)
        funcionario_dict['turnos'] = turnos_funcionario
        # Manter compatibilidade: se houver apenas um turno, colocar no campo turno também
        if len(turnos_funcionario) == 1:
            funcionario_dict['turno'] = turnos_funcionario[0]
        elif len(turnos_funcionario) > 1:
            funcionario_dict['turno'] = ', '.join(turnos_funcionario)
    
    return funcionario_dict


# Atualiza um funcionário existente
def atualizar_funcionario(
    funcionario_id: int, 
    nome: str, 
    ativo: bool, 
    tag_id: Optional[str] = None,
    turno: Optional[str] = None,
    turnos: Optional[List[str]] = None,
    operacoes_ids: Optional[List[int]] = None
) -> Dict[str, Any]:
    
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    funcionario.nome = nome
    funcionario.ativo = ativo
    # Não atualizar mais o campo turno, usar a tabela funcionarios_turnos
    
    if tag_id is not None:
        tag_id = tag_id.strip() if tag_id else None
        
        if tag_id:
            # Verificar se a tag já está em uso por outro funcionário
            funcionario_com_tag = Funcionario.buscar_por_tag(tag_id)
            if funcionario_com_tag and funcionario_com_tag.funcionario_id != funcionario.funcionario_id:
                raise Exception(f"Tag RFID '{tag_id}' já está em uso pelo funcionário {funcionario_com_tag.nome}")
        
        funcionario.tag_id = tag_id
    
    funcionario.save()
    
    # Atualizar turnos se fornecidos (prioridade para turnos, depois turno para compatibilidade)
    if turnos is not None:
        atualizar_turnos_funcionario(funcionario_id, turnos)
    elif turno is not None:
        # Compatibilidade: se turno for fornecido mas turnos não, usar turno
        atualizar_turnos_funcionario(funcionario_id, [turno] if turno else [])
    
    # Atualizar operações habilitadas se fornecidas
    if operacoes_ids is not None:
        atualizar_operacoes_habilitadas(funcionario_id, operacoes_ids)
    
    # Buscar operações habilitadas e turnos para retornar
    funcionario_dict = funcionario.to_dict()
    operacoes_habilitadas = buscar_operacoes_habilitadas(funcionario_id)
    funcionario_dict['operacoes_habilitadas'] = operacoes_habilitadas
    turnos_funcionario = buscar_turnos_funcionario(funcionario_id)
    funcionario_dict['turnos'] = turnos_funcionario
    # Manter compatibilidade: se houver apenas um turno, colocar no campo turno também
    if len(turnos_funcionario) == 1:
        funcionario_dict['turno'] = turnos_funcionario[0]
    elif len(turnos_funcionario) > 1:
        funcionario_dict['turno'] = ', '.join(turnos_funcionario)
    
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
    try:
        query = """
            SELECT 
                oh.operacao_id,
                oh.data_habilitacao,
                oh.habilitada,
                o.codigo_operacao,
                o.nome as nome_operacao
            FROM operacoes_habilitadas oh
            INNER JOIN operacoes o ON oh.operacao_id = o.operacao_id
            WHERE oh.funcionario_id = %s
            ORDER BY oh.data_habilitacao ASC
        """
        rows = DatabaseConnection.execute_query(query, (funcionario_id,), fetch_all=True)
        
        if not rows:
            return []
        
        operacoes = []
        for row in rows:
            operacoes.append({
                'operacao_id': row[0],
                'data_habilitacao': row[1].isoformat() if row[1] else None,
                'habilitada': row[2],
                'codigo_operacao': row[3],
                'nome': row[4] if row[4] else row[3]  # Usar nome se existir, senão código
            })
        
        return operacoes
    except Exception as e:
        print(f'Erro ao buscar operações habilitadas: {e}')
        return []


# Função para atualizar operações habilitadas de um funcionário
def atualizar_operacoes_habilitadas(funcionario_id: int, operacoes_ids: List[int]) -> None:
    from datetime import datetime
    try:
        from zoneinfo import ZoneInfo
        TZ_MANAUS = ZoneInfo('America/Manaus')
    except ImportError:
        import pytz
        TZ_MANAUS = pytz.timezone('America/Manaus')
    
    # Verificar se o funcionário existe
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    # Buscar operações atuais do funcionário
    query_atuais = "SELECT operacao_id FROM operacoes_habilitadas WHERE funcionario_id = %s"
    rows = DatabaseConnection.execute_query(query_atuais, (funcionario_id,), fetch_all=True)
    operacoes_atuais = set(row[0] for row in rows) if rows else set()
    
    operacoes_marcadas = set(operacoes_ids) if operacoes_ids else set()
    
    # Operações para habilitar (marcadas)
    data_habilitacao = datetime.now(TZ_MANAUS)
    for operacao_id in operacoes_marcadas:
        # Verificar se a operação existe
        from Server.models.operacao import Operacao
        operacao = Operacao.buscar_por_id(operacao_id)
        if not operacao:
            print(f'Aviso: Operação com ID {operacao_id} não encontrada, ignorando...')
            continue
        
        # Inserir ou atualizar para habilitada = TRUE
        query_upsert = """
            INSERT INTO operacoes_habilitadas (funcionario_id, operacao_id, data_habilitacao, habilitada)
            VALUES (%s, %s, %s, TRUE)
            ON CONFLICT (funcionario_id, operacao_id) 
            DO UPDATE SET habilitada = TRUE
        """
        DatabaseConnection.execute_query(query_upsert, (funcionario_id, operacao_id, data_habilitacao))
    
    # Operações para desabilitar (desmarcadas que existiam antes)
    operacoes_desmarcar = operacoes_atuais - operacoes_marcadas
    for operacao_id in operacoes_desmarcar:
        query_desabilitar = """
            UPDATE operacoes_habilitadas 
            SET habilitada = FALSE 
            WHERE funcionario_id = %s AND operacao_id = %s
        """
        DatabaseConnection.execute_query(query_desabilitar, (funcionario_id, operacao_id))


# Função para buscar turnos de um funcionário
def buscar_turnos_funcionario(funcionario_id: int) -> List[str]:
    """Busca os turnos de um funcionário"""
    try:
        query = """
            SELECT turno
            FROM funcionarios_turnos
            WHERE funcionario_id = %s
            ORDER BY turno ASC
        """
        rows = DatabaseConnection.execute_query(query, (funcionario_id,), fetch_all=True)
        
        if not rows:
            return []
        
        turnos = [row[0] for row in rows if row[0]]
        return turnos
    except Exception as e:
        print(f'Erro ao buscar turnos do funcionário: {e}')
        return []


# Função para atualizar turnos de um funcionário
def atualizar_turnos_funcionario(funcionario_id: int, turnos: List[str]) -> None:
    """Atualiza os turnos de um funcionário"""
    # Verificar se o funcionário existe
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    # Filtrar turnos válidos e remover duplicatas
    turnos_validos = ['matutino', 'vespertino', 'noturno']
    turnos_limpos = [t.lower().strip() for t in turnos if t and t.strip().lower() in turnos_validos]
    turnos_unicos = list(dict.fromkeys(turnos_limpos))  # Remove duplicatas mantendo ordem
    
    # Buscar turnos atuais do funcionário
    query_atuais = "SELECT turno FROM funcionarios_turnos WHERE funcionario_id = %s"
    rows = DatabaseConnection.execute_query(query_atuais, (funcionario_id,), fetch_all=True)
    turnos_atuais = set(row[0] for row in rows) if rows else set()
    
    turnos_marcados = set(turnos_unicos)
    
    # Turnos para adicionar (marcados que não existiam antes)
    turnos_adicionar = turnos_marcados - turnos_atuais
    for turno in turnos_adicionar:
        query_inserir = """
            INSERT INTO funcionarios_turnos (funcionario_id, turno)
            VALUES (%s, %s)
            ON CONFLICT (funcionario_id, turno) DO NOTHING
        """
        DatabaseConnection.execute_query(query_inserir, (funcionario_id, turno))
    
    # Turnos para remover (desmarcados que existiam antes)
    turnos_remover = turnos_atuais - turnos_marcados
    for turno in turnos_remover:
        query_remover = """
            DELETE FROM funcionarios_turnos
            WHERE funcionario_id = %s AND turno = %s
        """
        DatabaseConnection.execute_query(query_remover, (funcionario_id, turno))