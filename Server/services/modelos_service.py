"""
Service para lógica de negócio de modelos/produtos
"""
from typing import Dict, Any, List
from Server.models import Modelo


def listar_modelos() -> List[Dict[str, Any]]:
    """Lista todos os modelos/produtos"""
    try:
        modelos = Modelo.listar_todos()
        return [{"codigo": m.codigo, "descricao": m.descricao} for m in modelos]
    except Exception as e:
        raise Exception(f"Erro ao listar modelos: {str(e)}")


def listar_todos_modelos() -> List[Dict[str, Any]]:
    """Lista todos os modelos/produtos com ID"""
    try:
        modelos = Modelo.listar_todos()
        return [m.to_dict() for m in modelos]
    except Exception as e:
        raise Exception(f"Erro ao listar todos os modelos: {str(e)}")


def buscar_modelo(codigo: str) -> Dict[str, Any]:
    """Busca um modelo pelo código"""
    try:
        modelo = Modelo.buscar_por_codigo(codigo)
        if not modelo:
            raise Exception("Modelo não encontrado")
        return {"codigo": modelo.codigo, "descricao": modelo.descricao}
    except Exception as e:
        raise Exception(f"Erro ao buscar modelo: {str(e)}")


def criar_modelo(codigo: str, descricao: str = '') -> Dict[str, Any]:
    """Cria um novo modelo/produto"""
    try:
        # Verificar se já existe modelo com o mesmo código
        modelo_existente = Modelo.buscar_por_codigo(codigo)
        if modelo_existente:
            raise Exception(f"Já existe um modelo com o código {codigo}")
        
        modelo = Modelo.criar(codigo=codigo, descricao=descricao)
        return modelo.to_dict()
    except Exception as e:
        raise Exception(f"Erro ao criar modelo: {str(e)}")


def atualizar_modelo(modelo_id: int, codigo: str, descricao: str = '') -> Dict[str, Any]:
    """Atualiza um modelo/produto existente"""
    try:
        modelo = Modelo.buscar_por_id(modelo_id)
        if not modelo:
            raise Exception(f"Modelo com ID {modelo_id} não encontrado")
        
        # Verificar se o código já existe em outro modelo
        modelo_com_codigo = Modelo.buscar_por_codigo(codigo)
        if modelo_com_codigo and modelo_com_codigo.id != modelo_id:
            raise Exception(f"Já existe outro modelo com o código {codigo}")
        
        modelo.codigo = codigo
        modelo.descricao = descricao
        modelo.save()
        
        return modelo.to_dict()
    except Exception as e:
        raise Exception(f"Erro ao atualizar modelo: {str(e)}")


def deletar_modelo(modelo_id: int) -> None:
    """Deleta um modelo/produto"""
    try:
        modelo = Modelo.buscar_por_id(modelo_id)
        if not modelo:
            raise Exception(f"Modelo com ID {modelo_id} não encontrado")
        
        modelo.delete()
    except Exception as e:
        raise Exception(f"Erro ao deletar modelo: {str(e)}")
