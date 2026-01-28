from Server.models.database import DatabaseConnection
from typing import Dict, Any, Optional, List

class Linha:
    def __init__(self, nome: str, linha_id: Optional[int] = None):
        self.linha_id = linha_id
        self.nome = nome

    def to_dict(self) -> Dict[str, Any]:
        return {
            'linha_id': self.linha_id,
            'nome': self.nome
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Linha':
        return Linha(
            linha_id=data.get('linha_id'),
            nome=data.get('nome', '')
        )
    
    def salvar(self) -> None:
        if self.linha_id is None:
            query = "INSERT INTO linhas (nome) VALUES (%s) RETURNING linha_id"
            params = (self.nome,)
            resultado = DatabaseConnection.execute_query(query, params=params, fetch_one=True)

            if resultado:
                self.linha_id = resultado[0]
        else:
            query = "UPDATE linhas SET nome = %s WHERE linha_id = %s"
            params = (self.nome, self.linha_id)
            DatabaseConnection.execute_query(query, params)

    @classmethod
    def listar_todas(cls) -> List['Linha']:
        query = "SELECT linha_id, nome FROM linhas ORDER BY nome"
        resultados = DatabaseConnection.execute_query(query, fetch_all=True)

        linhas = []
        if resultados:
            for resultado in resultados:
                linhas.append(cls(
                    linha_id=resultado[0],
                    nome=resultado[1]
                ))
        return linhas
    
    @classmethod
    def buscar_por_nome(cls, nome: str) -> Optional['Linha']:
        query = "SELECT linha_id, nome FROM linhas WHERE nome = %s"
        resultado = DatabaseConnection.execute_query(query, (nome,), fetch_one=True)

        if resultado:
            return cls(linha_id=resultado[0], nome=resultado[1])
        return None
    
    @classmethod
    def buscar_por_nome_parcial(cls, nome: str) -> List['Linha']:
        query = "SELECT linha_id, nome FROM linhas WHERE nome ILIKE %s ORDER BY nome"
        resultado = DatabaseConnection.execute_query(query, (f'%{nome}%',), fetch_all=True)

        linhas = []
        if resultado:
            for row in resultado:
                linhas.append(cls(linha_id=row[0], nome=row[1]))
        return linhas
    
    @classmethod
    def buscar_por_id(cls, linha_id: int) -> Optional['Linha']:
        query = "SELECT linha_id, nome FROM linhas WHERE linha_id = %s"
        resultado = DatabaseConnection.execute_query(query, (linha_id,), fetch_one=True)

        if resultado:
            return cls(linha_id=resultado[0], nome=resultado[1])
        return None
    
    @classmethod
    def existe_nome(cls, nome: str, excluir_id: Optional[int] = None) -> bool:
        if excluir_id:
            query = "SELECT 1 FROM linhas WHERE nome = %s AND linha_id != %s"
            params = (nome, excluir_id)
        else:
            query = "SELECT 1 FROM linhas WHERE nome = %s"
            params = (nome,)
        
        resultado = DatabaseConnection.execute_query(query, params, fetch_one=True)
        return resultado is not None
    
    def deletar(self) -> bool:
        if self.linha_id is None:
            raise ValueError('Linha não foi salva no banco de dados.')
        
        from Server.models.sublinha import Sublinha
        sublinhas = Sublinha.buscar_por_linha(self.linha_id)
        
        # Excluir todas as sublinhas associadas primeiro
        if sublinhas:
            for sublinha in sublinhas:
                sublinha.deletar()
        
        # Agora excluir a linha
        query = "DELETE FROM linhas WHERE linha_id = %s"
        DatabaseConnection.execute_query(query, (self.linha_id,))
        self.linha_id = None
        return True
    
    @classmethod
    def deletar_por_id(cls, linha_id: int) -> bool:
        from Server.models.sublinha import Sublinha
        sublinhas = Sublinha.buscar_por_linha(linha_id)
        
        if sublinhas:
            return False
        
        query = "DELETE FROM linhas WHERE linha_id = %s"
        DatabaseConnection.execute_query(query, (linha_id,))
        return True
    
    def atualizar_nome(self, novo_nome: str) -> None:
        self.nome = novo_nome
        self.salvar()
    
    @classmethod
    def contar_total(cls) -> int:
        query = "SELECT COUNT(*) FROM linhas"
        resultado = DatabaseConnection.execute_query(query, fetch_one=True)
        return resultado[0] if resultado else 0