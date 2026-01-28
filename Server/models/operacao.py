from typing import Dict, Any, Optional, List, Tuple
from Server.models.database import DatabaseConnection


class Operacao:
    """Modelo que representa uma operação"""

    def __init__(
        self,
        codigo_operacao: str,
        produto_id: int,
        modelo_id: int,
        sublinha_id: int,
        posto_id: int,
        peca_id: Optional[int] = None,
        operacao_id: Optional[int] = None,
        nome: Optional[str] = None
    ):
        self.operacao_id = operacao_id
        self.codigo_operacao = codigo_operacao
        self.nome = nome
        self.produto_id = produto_id
        self.modelo_id = modelo_id
        self.sublinha_id = sublinha_id
        self.posto_id = posto_id
        self.peca_id = peca_id

    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "operacao_id": self.operacao_id,
            "codigo_operacao": self.codigo_operacao,
            "nome": self.nome,
            "produto_id": self.produto_id,
            "modelo_id": self.modelo_id,
            "sublinha_id": self.sublinha_id,
            "posto_id": self.posto_id,
            "peca_id": self.peca_id
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Operacao':
        """Cria um objeto Operacao a partir de um dicionário"""
        return Operacao(
            operacao_id=data.get('operacao_id'),
            codigo_operacao=data.get('codigo_operacao', ''),
            nome=data.get('nome'),
            produto_id=data.get('produto_id'),
            modelo_id=data.get('modelo_id'),
            sublinha_id=data.get('sublinha_id'),
            posto_id=data.get('posto_id'),
            peca_id=data.get('peca_id')
        )

    @staticmethod
    def from_row(row: Tuple[Any, ...], tem_coluna_nome: bool = False) -> 'Operacao':
        """Cria um objeto Operacao a partir de uma linha do banco"""
        # Se tem coluna nome: operacao_id, codigo_operacao, nome, produto_id, modelo_id, sublinha_id, posto_id, peca_id
        # Se não tem: operacao_id, codigo_operacao, produto_id, modelo_id, sublinha_id, posto_id, peca_id
        
        if tem_coluna_nome and len(row) >= 8:
            # Com coluna nome
            return Operacao(
                operacao_id=row[0] if len(row) > 0 and row[0] is not None else None,
                codigo_operacao=str(row[1]) if len(row) > 1 and row[1] is not None else '',
                nome=str(row[2]) if len(row) > 2 and row[2] is not None else None,
                produto_id=int(row[3]) if len(row) > 3 and row[3] is not None else 0,
                modelo_id=int(row[4]) if len(row) > 4 and row[4] is not None else 0,
                sublinha_id=int(row[5]) if len(row) > 5 and row[5] is not None else 0,
                posto_id=int(row[6]) if len(row) > 6 and row[6] is not None else 0,
                peca_id=int(row[7]) if len(row) > 7 and row[7] is not None else None
            )
        else:
            # Sem coluna nome (compatibilidade com versão antiga)
            return Operacao(
                operacao_id=row[0] if len(row) > 0 and row[0] is not None else None,
                codigo_operacao=str(row[1]) if len(row) > 1 and row[1] is not None else '',
                nome=None,  # Não existe coluna nome
                produto_id=int(row[2]) if len(row) > 2 and row[2] is not None else 0,
                modelo_id=int(row[3]) if len(row) > 3 and row[3] is not None else 0,
                sublinha_id=int(row[4]) if len(row) > 4 and row[4] is not None else 0,
                posto_id=int(row[5]) if len(row) > 5 and row[5] is not None else 0,
                peca_id=int(row[6]) if len(row) > 6 and row[6] is not None else None
            )

    def salvar(self) -> None:
        """Salva a operação no banco de dados"""
        # Verificar se a coluna nome existe
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'operacoes'
                AND column_name = 'nome'
            """)
            tem_coluna_nome = cursor.fetchone() is not None
            
            if self.operacao_id is None:
                if tem_coluna_nome:
                    query = """
                        INSERT INTO operacoes (codigo_operacao, nome, produto_id, modelo_id, sublinha_id, posto_id, peca_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING operacao_id
                    """
                    params = (
                        self.codigo_operacao,
                        self.nome or self.codigo_operacao,
                        self.produto_id,
                        self.modelo_id,
                        self.sublinha_id,
                        self.posto_id,
                        self.peca_id
                    )
                else:
                    query = """
                        INSERT INTO operacoes (codigo_operacao, produto_id, modelo_id, sublinha_id, posto_id, peca_id)
                        VALUES (%s, %s, %s, %s, %s, %s) RETURNING operacao_id
                    """
                    params = (
                        self.codigo_operacao,
                        self.produto_id,
                        self.modelo_id,
                        self.sublinha_id,
                        self.posto_id,
                        self.peca_id
                    )
                resultado = DatabaseConnection.execute_query(query, params, fetch_one=True)
                if resultado:
                    self.operacao_id = resultado[0]
            else:
                if tem_coluna_nome:
                    query = """
                        UPDATE operacoes 
                        SET codigo_operacao = %s, nome = %s, produto_id = %s, modelo_id = %s, 
                            sublinha_id = %s, posto_id = %s, peca_id = %s
                        WHERE operacao_id = %s
                    """
                    params = (
                        self.codigo_operacao,
                        self.nome or self.codigo_operacao,
                        self.produto_id,
                        self.modelo_id,
                        self.sublinha_id,
                        self.posto_id,
                        self.peca_id,
                        self.operacao_id
                    )
                else:
                    query = """
                        UPDATE operacoes 
                        SET codigo_operacao = %s, produto_id = %s, modelo_id = %s, 
                            sublinha_id = %s, posto_id = %s, peca_id = %s
                        WHERE operacao_id = %s
                    """
                    params = (
                        self.codigo_operacao,
                        self.produto_id,
                        self.modelo_id,
                        self.sublinha_id,
                        self.posto_id,
                        self.peca_id,
                        self.operacao_id
                    )
                DatabaseConnection.execute_query(query, params)
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def buscar_por_id(cls, operacao_id: int) -> Optional['Operacao']:
        """Busca uma operação pelo ID"""
        # Verificar se a coluna nome existe
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'operacoes'
                AND column_name = 'nome'
            """)
            tem_coluna_nome = cursor.fetchone() is not None
            
            if tem_coluna_nome:
                query = """
                    SELECT operacao_id, codigo_operacao, nome, produto_id, modelo_id, 
                           sublinha_id, posto_id, peca_id
                    FROM operacoes WHERE operacao_id = %s
                """
            else:
                query = """
                    SELECT operacao_id, codigo_operacao, produto_id, modelo_id, 
                           sublinha_id, posto_id, peca_id
                    FROM operacoes WHERE operacao_id = %s
                """
            resultado = DatabaseConnection.execute_query(query, (operacao_id,), fetch_one=True)
            if not resultado:
                return None
            return cls.from_row(resultado, tem_coluna_nome)
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def listar_todas(cls) -> List['Operacao']:
        """Lista todas as operações"""
        # Verificar se a coluna nome existe
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'operacoes'
                AND column_name = 'nome'
            """)
            tem_coluna_nome = cursor.fetchone() is not None
            
            if tem_coluna_nome:
                query = """
                    SELECT operacao_id, codigo_operacao, nome, produto_id, modelo_id, 
                           sublinha_id, posto_id, peca_id
                    FROM operacoes ORDER BY nome, codigo_operacao
                """
            else:
                query = """
                    SELECT operacao_id, codigo_operacao, produto_id, modelo_id, 
                           sublinha_id, posto_id, peca_id
                    FROM operacoes ORDER BY codigo_operacao
                """
            resultados = DatabaseConnection.execute_query(query, fetch_all=True)
            if not resultados:
                return []
            return [cls.from_row(row, tem_coluna_nome) for row in resultados]
        finally:
            cursor.close()
            conn.close()

    def deletar(self) -> None:
        """Deleta a operação do banco de dados"""
        if self.operacao_id is None:
            raise ValueError("Operação não foi salva no banco de dados")
        query = "DELETE FROM operacoes WHERE operacao_id = %s"
        DatabaseConnection.execute_query(query, (self.operacao_id,))
        self.operacao_id = None

    @classmethod
    def criar(
        cls,
        codigo_operacao: str,
        produto_id: int,
        modelo_id: int,
        sublinha_id: int,
        posto_id: int,
        peca_id: Optional[int] = None,
        nome: Optional[str] = None
    ) -> 'Operacao':
        """Cria e salva uma nova operação"""
        operacao = cls(
            codigo_operacao=codigo_operacao,
            nome=nome,
            produto_id=produto_id,
            modelo_id=modelo_id,
            sublinha_id=sublinha_id,
            posto_id=posto_id,
            peca_id=peca_id
        )
        operacao.salvar()
        return operacao

