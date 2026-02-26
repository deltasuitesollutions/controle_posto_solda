from Server.models.database import DatabaseConnection
from typing import Dict, Any, Optional, List

class Produto:
    def __init__(self, nome: str, id: Optional[int] = None, data_criacao: Optional[str] = None):
        self.id = id
        self.nome = nome
        self.data_criacao = data_criacao

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'nome': self.nome,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao and hasattr(self.data_criacao, 'isoformat') else str(self.data_criacao) if self.data_criacao else None
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Produto':
        return Produto(
            id=data.get('id'),
            nome=data.get('nome', '')
        )
    
    def salvar(self) -> None:
        if self.id is None:
            # Sempre criar novo produto (mesmo que exista um deletado)
            # A constraint UNIQUE parcial permite isso
            # Incluir data_criacao explicitamente para garantir data atual
            query = "INSERT INTO produtos (nome, data_criacao) VALUES (%s, CURRENT_TIMESTAMP) RETURNING produto_id"
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
        query = "SELECT produto_id, nome, COALESCE(data_criacao, CURRENT_TIMESTAMP) as data_criacao FROM produtos WHERE COALESCE(deleted, FALSE) = FALSE ORDER BY nome"
        resultados = DatabaseConnection.execute_query(query, fetch_all=True)

        produtos = []
        if resultados:
            for resultado in resultados:
                produto = cls(
                    id=resultado[0],
                    nome=resultado[1]
                )
                if len(resultado) > 2:
                    produto.data_criacao = resultado[2]
                produtos.append(produto)
        return produtos
    
    @classmethod
    def buscarNome(cls, nome: str) -> Optional['Produto']:
        """Busca produto por nome, apenas não deletados"""
        query = "SELECT produto_id, nome FROM produtos WHERE nome = %s AND COALESCE(deleted, FALSE) = FALSE"
        resultado = DatabaseConnection.execute_query(query, (nome,), fetch_one=True)
        
        if resultado:
            return cls(id=resultado[0], nome=resultado[1])
        return None
    
    @classmethod
    def buscarNomeIncluindoDeletados(cls, nome: str) -> Optional['Produto']:
        """Busca produto por nome, incluindo deletados"""
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
        """Faz soft delete do produto (marca como deletado, mas não remove do banco)"""
        if self.id is None:
            raise ValueError("Produto não foi salvo no banco de dados")

        try:
            produto_id = self.id
            query = "UPDATE produtos SET deleted = TRUE WHERE produto_id = %s"
            DatabaseConnection.execute_query(query, (produto_id,))
        except ValueError as e:
            raise e
        except Exception as e:
            raise RuntimeError(f'Erro ao deletar produto ID {produto_id}: {e}')


    