"""
Service para lógica de negócio de funcionários
"""
from typing import Dict, Any, List
from backend.models import Funcionario


def listar_funcionarios() -> List[Dict[str, Any]]:
    """Lista todos os funcionários ativos"""
    try:
        funcionarios = Funcionario.listar_ativos()
        return [{"matricula": f.matricula, "nome": f.nome} for f in funcionarios]
    except Exception as e:
        raise Exception(f"Erro ao listar funcionários: {str(e)}")


def listar_todos_funcionarios() -> List[Dict[str, Any]]:
    """Lista todos os funcionários (ativos e inativos)"""
    try:
        funcionarios = Funcionario.listar_todos()
        return [f.to_dict() for f in funcionarios]
    except Exception as e:
        raise Exception(f"Erro ao listar todos os funcionários: {str(e)}")


def criar_funcionario(matricula: str, nome: str, ativo: bool = True) -> Dict[str, Any]:
    """Cria um novo funcionário"""
    try:
        # Verificar se já existe funcionário com a mesma matrícula
        funcionario_existente = Funcionario.buscar_por_matricula(matricula)
        if funcionario_existente:
            raise Exception(f"Já existe um funcionário com a matrícula {matricula}")
        
        funcionario = Funcionario.criar(matricula=matricula, nome=nome, ativo=ativo)
        return funcionario.to_dict()
    except Exception as e:
        raise Exception(f"Erro ao criar funcionário: {str(e)}")


def atualizar_funcionario(funcionario_id: int, nome: str, ativo: bool) -> Dict[str, Any]:
    """Atualiza um funcionário existente"""
    try:
        funcionario = Funcionario.buscar_por_id(funcionario_id)
        if not funcionario:
            raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
        
        funcionario.nome = nome
        funcionario.ativo = ativo
        funcionario.save()
        
        return funcionario.to_dict()
    except Exception as e:
        raise Exception(f"Erro ao atualizar funcionário: {str(e)}")


def deletar_funcionario(funcionario_id: int) -> None:
    """Deleta um funcionário"""
    try:
        funcionario = Funcionario.buscar_por_id(funcionario_id)
        if not funcionario:
            raise Exception(f"Funcionário com ID {funcionario_id} não encontrado")
        
        funcionario.delete()
    except Exception as e:
        raise Exception(f"Erro ao deletar funcionário: {str(e)}")
