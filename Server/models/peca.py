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
        """Salvar peca no banco e criar relação na tabela modelo_pecas"""
        if self.id is None:
            query = """
                INSERT INTO pecas (codigo, nome) 
                VALUES (%s, %s) RETURNING peca_id
            """
            params = (self.codigo, self.nome)
            resultado = DatabaseConnection.execute_query(query, params, fetch_one=True)

            if resultado:
                self.id = resultado[0]
                
            # Criar relação na tabela modelo_pecas se tiver modelo_id
            if self.modelo_id and self.id:
                self._criar_relacao_modelo()
        else:
            query = "UPDATE pecas SET codigo = %s, nome = %s WHERE peca_id = %s"
            params = (self.codigo, self.nome, self.id)
            DatabaseConnection.execute_query(query, params)
            
            # Atualizar relação se modelo_id mudou
            if self.modelo_id and self.id:
                self._criar_relacao_modelo()
    
    def _criar_relacao_modelo(self) -> None:
        """Cria ou atualiza a relação entre peça e modelo na tabela modelo_pecas"""
        try:
            # Verificar se a relação já existe
            query_check = "SELECT 1 FROM modelo_pecas WHERE peca_id = %s AND modelo_id = %s"
            existe = DatabaseConnection.execute_query(query_check, (self.id, self.modelo_id), fetch_one=True)
            
            if not existe:
                # Criar relação
                query_insert = "INSERT INTO modelo_pecas (modelo_id, peca_id) VALUES (%s, %s)"
                DatabaseConnection.execute_query(query_insert, (self.modelo_id, self.id))
        except Exception as e:
            # Se a tabela modelo_pecas não existir, apenas ignorar (não é crítico)
            print(f"Aviso: Não foi possível criar relação modelo_pecas: {e}")

    @classmethod
    def buscar_por_id(cls, id: int) -> Optional['Peca']:
        """Busca uma peça pelo Id"""
        query = "SELECT peca_id, codigo, nome FROM pecas WHERE peca_id = %s"
        resultado = DatabaseConnection.execute_query(query, (id,), fetch_one=True)

        if not resultado:
            return None
        
        return cls(
            id=resultado[0],
            modelo_id=0,  # modelo_id não existe no banco, mantido para compatibilidade
            codigo=resultado[1],
            nome=resultado[2]
        )
    
    @classmethod
    def buscar_por_modelo_id(cls, modelo_id: int) -> List['Peca']:
        """Busca peças pelo modelo_id através da tabela modelo_pecas"""
        try:
            # Buscar através da tabela de relacionamento modelo_pecas
            query = """
                SELECT p.peca_id, p.codigo, p.nome 
                FROM pecas p
                INNER JOIN modelo_pecas mp ON p.peca_id = mp.peca_id
                WHERE mp.modelo_id = %s
                ORDER BY p.codigo
            """
            resultados = DatabaseConnection.execute_query(query, (modelo_id,), fetch_all=True)

            pecas = []
            if resultados:
                for resultado in resultados:
                    pecas.append(cls(
                        id=resultado[0],
                        modelo_id=modelo_id,
                        codigo=resultado[1],
                        nome=resultado[2]
                    ))
            return pecas
        except Exception as e:
            # Se a tabela modelo_pecas não existir, retornar lista vazia
            print(f"Aviso: Não foi possível buscar peças por modelo_id: {e}")
            return []
    
    @classmethod
    def listar_todas(cls) -> List['Peca']:
        """Lista todas as peças"""
        query = "SELECT peca_id, codigo, nome FROM pecas ORDER BY codigo"
        resultados = DatabaseConnection.execute_query(query, fetch_all=True)

        pecas = []
        if resultados:
            for resultado in resultados:
                pecas.append(cls(
                    id=resultado[0],
                    modelo_id=0,  # modelo_id não existe no banco, mantido para compatibilidade
                    codigo=resultado[1],
                    nome=resultado[2]
                ))
        return pecas
    
    def deletar(self) -> None:
        """Deleta a peça do banco de dados"""
        if self.id is None:
            raise ValueError("Peça não foi salva no banco de dados")
        
        query = "DELETE FROM pecas WHERE peca_id = %s"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None

    @classmethod
    def deletar_por_modelo_id(cls, modelo_id: int) -> None:
        """Deleta todas as relações de peças de um modelo na tabela modelo_pecas"""
        try:
            # Deletar apenas as relações, não as peças em si
            query = "DELETE FROM modelo_pecas WHERE modelo_id = %s"
            DatabaseConnection.execute_query(query, (modelo_id,))
        except Exception as e:
            # Se a tabela modelo_pecas não existir, apenas ignorar
            print(f"Aviso: Não foi possível deletar relações modelo_pecas: {e}")
    
    @classmethod
    def criar(cls, modelo_id: int, codigo: str, nome: str) -> 'Peca':
        """Criar uma nova peça"""
        peca = cls(modelo_id=modelo_id, codigo=codigo, nome=nome)
        peca.salvar()
        return peca