from typing import Dict, Any, List, Optional
from Server.models import Funcionario


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
    return [f.to_dict() for f in funcionarios]


# Cria um novo funcionário
def criar_funcionario(
    matricula: str, 
    nome: str, 
    ativo: bool = True, 
    tag_id: Optional[str] = None,
    turno: Optional[str] = None
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
    return funcionario.to_dict()


# Atualiza um funcionário existente
def atualizar_funcionario(
    funcionario_id: int, 
    nome: str, 
    ativo: bool, 
    tag_id: Optional[str] = None,
    turno: Optional[str] = None
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
    return funcionario.to_dict()


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