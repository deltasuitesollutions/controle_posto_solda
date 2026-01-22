from Server.models.database import DatabaseConnection
from typing import Dict, Any, Optional, List

class Sublinha:
    def __init__(self, nome: str, linha_id: int, sublinha_id: Optional[int] = None, linha_nome: Optional[str] = None):
        self.sublinha_id = sublinha_id
        self.linha_id = linha_id
        self.nome = nome
        self.linha_nome = linha_nome

    def to_dict(self) -> Dict[str, Any]:
        result = {
            'sublinha_id': self.sublinha_id,
            'linha_id': self.linha_id,
            'nome': self.nome
        }
        if self.linha_nome:
            result['linha_nome'] = self.linha_nome
        return result
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Sublinha':
        return Sublinha(
            sublinha_id=data.get('sublinha_id'),
            linha_id=data.get('linha_id'),
            nome=data.get('nome', ''),
            linha_nome=data.get('linha_nome')
        )
    
    def salvar(self) -> None:
        if self.sublinha_id is None:
            query = """
                INSERT INTO sublinhas (nome, linha_id)
                VALUES (%s, %s) RETURNING sublinha_id
            """
            params = (self.nome, self.linha_id)
            resultado = DatabaseConnection.execute_query(query, params, fetch_one=True)

            if resultado:
                self.sublinha_id = resultado[0]
        else:
            query = "UPDATE sublinhas SET nome = %s, linha_id = %s WHERE sublinha_id = %s"
            params = (self.nome, self.linha_id, self.sublinha_id)
            DatabaseConnection.execute_query(query, params)

    @classmethod
    def listar_todas(cls, com_linha: bool = False) -> List['Sublinha']:
        if com_linha:
            query = """
                SELECT s.sublinha_id, s.linha_id, s.nome, l.nome as linha_nome
                FROM sublinhas s
                LEFT JOIN linhas l ON s.linha_id = l.linha_id
                ORDER BY l.nome, s.nome
            """
            resultados = DatabaseConnection.execute_query(query, fetch_all=True)
            
            sublinhas = []
            if resultados:
                for resultado in resultados:
                    sublinha = cls(
                        sublinha_id=resultado[0],
                        linha_id=resultado[1],
                        nome=resultado[2],
                        linha_nome=resultado[3] if len(resultado) > 3 else None
                    )
                    sublinhas.append(sublinha)
            return sublinhas
        else:
            query = "SELECT sublinha_id, linha_id, nome FROM sublinhas ORDER BY nome"
            resultados = DatabaseConnection.execute_query(query, fetch_all=True)

            sublinhas = []
            if resultados:
                for resultado in resultados:
                    sublinhas.append(cls(
                        sublinha_id=resultado[0],
                        linha_id=resultado[1],
                        nome=resultado[2]
                    ))
            return sublinhas
    
    @classmethod
    def buscar_por_id(cls, sublinha_id: int) -> Optional['Sublinha']:
        query = "SELECT sublinha_id, linha_id, nome FROM sublinhas WHERE sublinha_id = %s"
        resultado = DatabaseConnection.execute_query(query, (sublinha_id,), fetch_one=True)

        if resultado:
            return cls(
                sublinha_id=resultado[0],
                linha_id=resultado[1],
                nome=resultado[2]
            )
        return None
    
    @classmethod
    def buscar_por_nome(cls, nome: str) -> List['Sublinha']:
        query = "SELECT sublinha_id, linha_id, nome FROM sublinhas WHERE nome = %s ORDER BY nome"
        resultados = DatabaseConnection.execute_query(query, (nome,), fetch_all=True)

        sublinhas = []
        if resultados:
            for resultado in resultados:
                sublinhas.append(cls(
                    sublinha_id=resultado[0],
                    linha_id=resultado[1],
                    nome=resultado[2]
                ))
        return sublinhas
    
    @classmethod
    def buscar_por_nome_parcial(cls, nome: str) -> List['Sublinha']:
        query = "SELECT sublinha_id, linha_id, nome FROM sublinhas WHERE nome ILIKE %s ORDER BY nome"
        resultados = DatabaseConnection.execute_query(query, (f'%{nome}%',), fetch_all=True)

        sublinhas = []
        if resultados:
            for resultado in resultados:
                sublinhas.append(cls(
                    sublinha_id=resultado[0],
                    linha_id=resultado[1],
                    nome=resultado[2]
                ))
        return sublinhas
    
    @classmethod
    def buscar_por_linha(cls, linha_id: int) -> List['Sublinha']:
        query = "SELECT sublinha_id, linha_id, nome FROM sublinhas WHERE linha_id = %s ORDER BY nome"
        resultados = DatabaseConnection.execute_query(query, (linha_id,), fetch_all=True)

        sublinhas = []
        if resultados:
            for resultado in resultados:
                sublinhas.append(cls(
                    sublinha_id=resultado[0],
                    linha_id=resultado[1],
                    nome=resultado[2]
                ))
        return sublinhas
    
    @classmethod
    def existe_nome_na_linha(cls, nome: str, linha_id: int, excluir_id: Optional[int] = None) -> bool:
        if excluir_id:
            query = "SELECT 1 FROM sublinhas WHERE nome = %s AND linha_id = %s AND sublinha_id != %s"
            params = (nome, linha_id, excluir_id)
        else:
            query = "SELECT 1 FROM sublinhas WHERE nome = %s AND linha_id = %s"
            params = (nome, linha_id)
        
        resultado = DatabaseConnection.execute_query(query, params, fetch_one=True)
        return resultado is not None
    
    def deletar(self) -> bool:
        if self.sublinha_id is None:
            raise ValueError("Sublinha não existe no banco de dados")
        
        query = "DELETE FROM sublinhas WHERE sublinha_id = %s"
        DatabaseConnection.execute_query(query, (self.sublinha_id,))
        self.sublinha_id = None
        return True
    
    @classmethod
    def deletar_por_id(cls, sublinha_id: int) -> bool:
        query = "DELETE FROM sublinhas WHERE sublinha_id = %s"
        DatabaseConnection.execute_query(query, (sublinha_id,))
        return True
    
    def atualizar(self, novo_nome: Optional[str] = None, nova_linha_id: Optional[int] = None) -> None:
        if novo_nome is not None:
            self.nome = novo_nome
        if nova_linha_id is not None:
            self.linha_id = nova_linha_id
        self.salvar()
    
    @classmethod
    def contar_total(cls) -> int:
        query = "SELECT COUNT(*) FROM sublinhas"
        resultado = DatabaseConnection.execute_query(query, fetch_one=True)
        return resultado[0] if resultado else 0
    
    @classmethod
    def contar_por_linha(cls, linha_id: int) -> int:
        query = "SELECT COUNT(*) FROM sublinhas WHERE linha_id = %s"
        resultado = DatabaseConnection.execute_query(query, (linha_id,), fetch_one=True)
        return resultado[0] if resultado else 0
    
    def obter_info_linha(self) -> Dict[str, Any]:
        from Server.models.linha import Linha
        linha = Linha.buscar_por_id(self.linha_id)
        if linha:
            return linha.to_dict()
        return {}