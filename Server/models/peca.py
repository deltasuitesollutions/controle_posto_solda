from typing import Dict, Any, Optional, List
from Server.models.database import DatabaseConnection

class Peca:
    """Modelo que representa uma peça de um modelo"""

    def __init__(self, modelo_id: int, codigo: str, nome: str, id: Optional[int] = None) -> None:
        self.id: Optional[int] = id
        self.modelo_id: int = modelo_id
        self.codigo: str = codigo
        self.nome: str = nome

    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "id": self.id,
            "modelo_id": self.modelo_id,
            "codigo": self.codigo,
            "nome": self.nome
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Peca':
        """Cria um objeto Peca a partir de um dicionário"""
        return Peca(
            id=data.get('id'),
            modelo_id=data.get('modelo_id'),
            codigo=data.get('codigo', ''),
            nome=data.get('nome', '')
        )
    
    def salvar(self) -> None:
        """Salvar peca no banco"""
        if self.id is None:
            query = """
                INSERT INTO pecas (modelo_id, codigo, nome) 
                VALUES (%s, %s, %s) RETURNING id
            """
            params = (self.modelo_id, self.codigo, self.nome)
            resultado = DatabaseConnection.execute_query(query, params, fetch_one=True)

            if resultado:
                self.id = resultado[0]
        else:
            query = "UPDATE pecas SET modelo_id = %s, codigo = %s, nome = %s WHERE id = %s"
            params = (self.modelo_id, self.codigo, self.nome, self.id)
            DatabaseConnection.execute_query(query, params)

    @classmethod
    def buscar_por_id(cls, id: int) -> Optional['Peca']:
        """Busca uma peça pelo Id"""
        query = "SELECT id, modelo_id, codigo, nome FROM pecas WHERE id = %s"
        resultado = DatabaseConnection.execute_query(query, (id,), fetch_one=True)

        if not resultado:
            return None
        
        return cls(
            id=resultado[0],
            modelo_id=resultado[1],
            codigo=resultado[2],
            nome=resultado[3]
        )
    
    @classmethod
    def buscar_por_modelo_id(cls, modelo_id: int) -> List['Peca']:
        """Busca peças pelo modelo_id"""
        query = "SELECT id, modelo_id, codigo, nome FROM pecas WHERE modelo_id = %s ORDER BY codigo"
        resultados = DatabaseConnection.execute_query(query, (modelo_id,), fetch_all=True)

        pecas = []
        if resultados:
            for resultado in resultados:
                pecas.append(cls(
                    id=resultado[0],
                    modelo_id=resultado[1],
                    codigo=resultado[2],
                    nome=resultado[3]
                ))
        return pecas
    
    @classmethod
    def listar_todas(cls) -> List['Peca']:
        """Lista todas as peças"""
        query = "SELECT id, modelo_id, codigo, nome FROM pecas ORDER BY codigo"
        resultados = DatabaseConnection.execute_query(query, fetch_all=True)

        pecas = []
        if resultados:
            for resultado in resultados:
                pecas.append(cls(
                    id=resultado[0],
                    modelo_id=resultado[1],
                    codigo=resultado[2],
                    nome=resultado[3]
                ))
        return pecas
    
    def deletar(self) -> None:
        """Deleta a peça do banco de dados"""
        if self.id is None:
            raise ValueError("Peça não foi salva no banco de dados")
        
        query = "DELETE FROM pecas WHERE id = %s"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None

    @classmethod
    def deletar_por_modelo_id(cls, modelo_id: int) -> None:
        """Deleta todas as peças de um modelo"""
        query = "DELETE FROM pecas WHERE modelo_id = %s"
        DatabaseConnection.execute_query(query, (modelo_id,))
    
    @classmethod
    def criar(cls, modelo_id: int, codigo: str, nome: str) -> 'Peca':
        """Criar uma nova peça"""
        peca = cls(modelo_id=modelo_id, codigo=codigo, nome=nome)
        peca.salvar()
        return peca