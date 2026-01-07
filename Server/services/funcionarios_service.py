from typing import Dict, Any, List, Optional
from Server.models import Funcionario

# Lista todos os funcionários ativos
def listar_funcionarios() -> List[Dict[str, Any]]:
    funcionarios = Funcionario.listar_ativos()
    resultado = []
    
    for f in funcionarios:
        item = {"matricula": f.matricula, "nome": f.nome}
        if f.tag:
            item["tag"] = f.tag
        resultado.append(item)
    
    return resultado


# Lista todos os funcionários (ativos e inativos)
def listar_todos_funcionarios() -> List[Dict[str, Any]]:
    funcionarios = Funcionario.listar_todos()
    return [f.to_dict() for f in funcionarios]


# Cria um novo funcionário
def criar_funcionario(matricula: str, nome: str, ativo: bool = True, tag: Optional[str] = None) -> Dict[str, Any]:
    if not matricula or not matricula.strip():
        raise Exception("Matrícula é obrigatória")
    
    matricula = matricula.strip()
    
    if Funcionario.buscar_por_matricula(matricula):
        raise Exception(f"Já existe um funcionário com a matrícula {matricula}")
    
    if tag:
        tag = tag.strip()
        # Verificar se a tag já está em uso por outro funcionário
        funcionario_com_tag = Funcionario.buscar_por_tag(tag)
        if funcionario_com_tag:
            raise Exception(f"Tag RFID '{tag}' já está em uso pelo funcionário {funcionario_com_tag.nome}")
    
    funcionario = Funcionario.criar(matricula=matricula, nome=nome, ativo=ativo, tag=tag)
    return funcionario.to_dict()


# Atualiza um funcionário existente
def atualizar_funcionario(funcionario_id: int, nome: str, ativo: bool, tag: Optional[str] = None) -> Dict[str, Any]:
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    funcionario.nome = nome
    funcionario.ativo = ativo
    
    if tag is not None:
        tag = tag.strip() if tag else None
        
        if tag:
            # Verificar se a tag já está em uso por outro funcionário
            funcionario_com_tag = Funcionario.buscar_por_tag(tag)
            if funcionario_com_tag and funcionario_com_tag.id != funcionario.id:
                raise Exception(f"Tag RFID '{tag}' já está em uso pelo funcionário {funcionario_com_tag.nome}")
        
        funcionario.tag = tag
    
    funcionario.save()
    return funcionario.to_dict()


# Remove um funcionário do sistema
def deletar_funcionario(funcionario_id: int) -> None:
    funcionario = Funcionario.buscar_por_id(funcionario_id)
    if not funcionario:
        raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
    
    funcionario.delete()
