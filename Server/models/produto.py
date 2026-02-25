from Server.models.database import DatabaseConnection
from typing import Dict, Any, Optional, List

class Produto:
    def __init__(self, nome: str, id: Optional[int] = None):
        self.id = id
        self.nome = nome

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'nome': self.nome
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Produto':
        return Produto(
            id=data.get('id'),
            nome=data.get('nome', '')
        )
    
    def salvar(self) -> None:
        if self.id is None:
            query = "INSERT INTO produtos (nome) VALUES (%s) RETURNING produto_id"
            params = (self.nome,)
            resultado = DatabaseConnection.execute_query(query, params=params, fetch_one=True)

            if resultado:
                self.id = resultado[0]
        else:
            query = "UPDATE produtos SET nome = %s WHERE produto_id = %s"
            params = (self.nome, self.id)
            DatabaseConnection.execute_query(query, params)

    @classmethod
    def listarTodos(cls) -> List['Produto']:
        query = "SELECT produto_id, nome FROM produtos ORDER BY nome"
        resultados = DatabaseConnection.execute_query(query, fetch_all=True)

        produtos = []
        if resultados:
            for resultado in resultados:
                produtos.append(cls(
                    id=resultado[0],
                    nome=resultado[1]
                ))
        return produtos
    
    @classmethod
    def buscarNome(cls, nome: str) -> Optional['Produto']:
        query = "SELECT produto_id, nome FROM produtos WHERE nome = %s"
        resultado = DatabaseConnection.execute_query(query, (nome,), fetch_one=True)
        
        if resultado:
            return cls(id=resultado[0], nome=resultado[1])
        return None
    
    @classmethod
    def buscarId(cls, produto_id: int) -> Optional['Produto']:
        query = "SELECT produto_id, nome FROM produtos WHERE produto_id = %s"
        resultado = DatabaseConnection.execute_query(query, (produto_id,), fetch_one=True)
        
        if resultado:
            return cls(id=resultado[0], nome=resultado[1])
        return None
    
    def deletar(self) -> None:
        if self.id is None:
            raise ValueError("Produto não foi salvo no banco de dados")

        try:
            produto_id = self.id
            query = "DELETE FROM produtos WHERE produto_id = %s"
            DatabaseConnection.execute_query(query, (produto_id,))
            self.id = None
        except ValueError as e:
            raise e
        except Exception as e:
            raise RuntimeError(f'Erro ao deletar produto ID {produto_id}: {e}')


    