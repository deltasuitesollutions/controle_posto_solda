"""
Service para lógica de negócio de modelos/produtos
"""
from typing import Dict, Any, List
from Server.models import Modelo, Subproduto


def listar_modelos() -> List[Dict[str, Any]]:
    """Lista todos os modelos/produtos"""
    try:
        modelos = Modelo.listar_todos()
        return [{"codigo": m.codigo, "descricao": m.descricao} for m in modelos]
    except Exception as e:
        raise Exception(f"Erro ao listar modelos: {str(e)}")


def listar_todos_modelos() -> List[Dict[str, Any]]:
    """Lista todos os modelos/produtos com ID e subprodutos"""
    try:
        modelos = Modelo.listar_todos(incluir_subprodutos=True)
        return [m.to_dict(incluir_subprodutos=True) for m in modelos]
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


def criar_modelo(codigo: str, descricao: str = '', subprodutos: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Cria um novo modelo/produto com seus subprodutos"""
    try:
        # Verificar se já existe modelo com o mesmo código
        modelo_existente = Modelo.buscar_por_codigo(codigo)
        if modelo_existente:
            raise Exception(f"Já existe um modelo com o código {codigo}")
        
        modelo = Modelo.criar(codigo=codigo, descricao=descricao)
        
        # Criar subprodutos se fornecidos
        if subprodutos and modelo.id:
            for subproduto_data in subprodutos:
                sub_codigo = subproduto_data.get('codigo', '')
                sub_descricao = subproduto_data.get('descricao', '')
                if sub_codigo:
                    Subproduto.criar(
                        modelo_id=modelo.id,
                        codigo=sub_codigo,
                        descricao=sub_descricao
                    )
        
        return modelo.to_dict(incluir_subprodutos=True)
    except Exception as e:
        raise Exception(f"Erro ao criar modelo: {str(e)}")


def atualizar_modelo(modelo_id: int, codigo: str, descricao: str = '', subprodutos: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Atualiza um modelo/produto existente e seus subprodutos"""
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
        
        # Atualizar subprodutos: deletar todos e recriar
        if modelo.id:
            # Deletar subprodutos existentes
            Subproduto.deletar_por_modelo_id(modelo.id)
            
            # Criar novos subprodutos se fornecidos
            if subprodutos:
                for subproduto_data in subprodutos:
                    sub_codigo = subproduto_data.get('codigo', '')
                    sub_descricao = subproduto_data.get('descricao', '')
                    if sub_codigo:
                        Subproduto.criar(
                            modelo_id=modelo.id,
                            codigo=sub_codigo,
                            descricao=sub_descricao
                        )
        
        return modelo.to_dict(incluir_subprodutos=True)
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
