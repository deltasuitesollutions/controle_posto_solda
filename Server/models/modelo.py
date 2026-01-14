from typing import Dict, Any, Optional, List
from Server.models.database import DatabaseConnection

class Modelo:
    """Modelo que representa um modelo/peca"""

    def __init__(self, codigo: str, nome: str, id: Optional[int] = None):
        self.id = id
        self.codigo = codigo
        self.nome = nome

    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "id": self.id,
            "codigo": self.codigo,
            "nome": self.nome
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Modelo':
        """Cria um objeto Modelo a partir de um dicionário"""
        return Modelo(
            id=data.get('id'),
            codigo=data.get('codigo', ''),
            nome=data.get('nome', '')
        )
    
    def salvar(self) -> None:
        """Salva o modelo no banco de dados"""
        if self.id is None:
            query = "INSERT INTO modelos (codigo, nome) VALUES (%s, %s) RETURNING id"
            params = (self.codigo, self.nome)
            resultado = DatabaseConnection.execute_query(query, params, fetch_one=True)

            if resultado:
                self.id = resultado[0]
        else:
            query = "UPDATE modelos SET codigo = %s, nome = %s WHERE id = %s"
            params = (self.codigo, self.nome, self.id)
            DatabaseConnection.execute_query(query, params)

    @classmethod
    def buscar_por_id(cls, id: int) -> Optional['Modelo']:
        """Busca um modelo pelo Id"""
        query = "SELECT id, codigo, nome FROM modelos WHERE id = %s"
        resultado = DatabaseConnection.execute_query(query, (id,), fetch_one=True)

        if not resultado:
            return None
        
        return cls(
            id=resultado[0],
            codigo=resultado[1],
            nome=resultado[2]
        )
    
    @classmethod
    def buscar_por_codigo(cls, codigo: str) -> Optional['Modelo']:
        """Busca um modelo pelo código"""
        query = "SELECT id, codigo, nome FROM modelos WHERE codigo = %s"
        resultado = DatabaseConnection.execute_query(query, (codigo,), fetch_one=True)

        if not resultado:
            return None
        
        return cls(
            id=resultado[0],
            codigo=resultado[1],
            nome=resultado[2]
        )
    
    @classmethod
    def listar_todos(cls) -> List['Modelo']:
        """Lista todos os modelos"""
        query = "SELECT id, codigo, nome FROM modelos ORDER BY codigo"
        resultados = DatabaseConnection.execute_query(query, fetch_all=True)

        modelos = []
        if resultados:
            for resultado in resultados:
                modelos.append(cls(
                    id=resultado[0],
                    codigo=resultado[1],
                    nome=resultado[2]
                ))
        return modelos
    
    def deletar(self) -> None:
        """Deleta o modelo do banco de dados"""
        if self.id is None:
            raise ValueError("Modelo não foi salvo no banco de dados")
        
        # Primeiro deletar as peças associadas
        from Server.models.peca import Peca
        Peca.deletar_por_modelo_id(self.id)

        # Depois deletar o modelo
        query = "DELETE FROM modelos WHERE id = %s"
        DatabaseConnection.execute_query(query, (self.id,))

        self.id = None

    @classmethod
    def criar(cls, codigo: str, nome: str) -> 'Modelo':
        """Cria e salva um novo modelo"""
        modelo = cls(codigo=codigo, nome=nome)
        modelo.salvar()
        return modelo