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
            query = "INSERT INTO modelos (nome) VALUES (%s) RETURNING modelo_id"
            params = (self.nome,)
            resultado = DatabaseConnection.execute_query(query, params, fetch_one=True)

            if resultado:
                self.id = resultado[0]
        else:
            query = "UPDATE modelos SET nome = %s WHERE modelo_id = %s"
            params = (self.nome, self.id)
            DatabaseConnection.execute_query(query, params)

    @classmethod
    def buscar_por_id(cls, id: int) -> Optional['Modelo']:
        """Busca um modelo pelo Id"""
        query = "SELECT modelo_id, nome FROM modelos WHERE modelo_id = %s"
        resultado = DatabaseConnection.execute_query(query, (id,), fetch_one=True)

        if not resultado:
            return None
        
        return cls(
            id=resultado[0],
            codigo=resultado[1],  # Usa nome como codigo para compatibilidade da API
            nome=resultado[1]
        )
    
    @classmethod
    def buscar_por_codigo(cls, codigo: str) -> Optional['Modelo']:
        """Busca um modelo pelo código (busca por nome já que codigo não existe no banco)"""
        # Como codigo não existe no banco, buscamos por nome
        query = "SELECT modelo_id, nome FROM modelos WHERE nome = %s"
        resultado = DatabaseConnection.execute_query(query, (codigo,), fetch_one=True)

        if not resultado:
            return None
        
        return cls(
            id=resultado[0],
            codigo=codigo,  # Mantém o codigo passado para compatibilidade
            nome=resultado[1]
        )
    
    @classmethod
    def listar_todos(cls) -> List['Modelo']:
        """Lista todos os modelos"""
        query = "SELECT modelo_id, nome FROM modelos ORDER BY nome"
        resultados = DatabaseConnection.execute_query(query, fetch_all=True)

        modelos = []
        if resultados:
            for resultado in resultados:
                modelos.append(cls(
                    id=resultado[0],
                    codigo=resultado[1],  # Usa nome como codigo para compatibilidade da API
                    nome=resultado[1]
                ))
        return modelos
    
    def deletar(self) -> None:
        """Deleta o modelo do banco de dados, suas peças e relações"""
        if self.id is None:
            raise ValueError("Modelo não foi salvo no banco de dados")
        
        modelo_id_temp = self.id  # Guardar o ID antes de deletar
        print(f'[MODELO.DELETAR] Iniciando deleção do modelo com ID: {modelo_id_temp}')
        
        # Usar uma única conexão para toda a operação
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            # 1. Buscar IDs das peças relacionadas ao modelo
            pecas_ids = []
            try:
                print(f'[MODELO.DELETAR] Buscando peças relacionadas ao modelo {modelo_id_temp}')
                query_buscar_pecas = "SELECT peca_id FROM modelo_pecas WHERE modelo_id = %s"
                cursor.execute(query_buscar_pecas, (modelo_id_temp,))
                resultados = cursor.fetchall()
                pecas_ids = [row[0] for row in resultados]
                print(f'[MODELO.DELETAR] Encontradas {len(pecas_ids)} peças relacionadas')
            except Exception as e:
                print(f"[MODELO.DELETAR] Aviso ao buscar peças: {e}")
            
            # 2. Deletar as peças da tabela pecas
            if pecas_ids:
                try:
                    print(f'[MODELO.DELETAR] Deletando {len(pecas_ids)} peças da tabela pecas')
                    # Deletar cada peça
                    for peca_id in pecas_ids:
                        query_deletar_peca = "DELETE FROM pecas WHERE peca_id = %s"
                        cursor.execute(query_deletar_peca, (peca_id,))
                    print(f'[MODELO.DELETAR] Peças deletadas com sucesso')
                except Exception as e:
                    print(f"[MODELO.DELETAR] Erro ao deletar peças: {e}")
                    raise
            
            # 3. Deletar relações com peças na tabela modelo_pecas
            try:
                print(f'[MODELO.DELETAR] Deletando relações modelo_pecas para modelo {modelo_id_temp}')
                query_relacoes = "DELETE FROM modelo_pecas WHERE modelo_id = %s"
                cursor.execute(query_relacoes, (modelo_id_temp,))
                print(f'[MODELO.DELETAR] Relações modelo_pecas deletadas')
            except Exception as e:
                print(f"[MODELO.DELETAR] Aviso ao deletar relações modelo_pecas: {e}")
                # Continua mesmo com erro
            
            # 4. Deletar o modelo
            query = "DELETE FROM modelos WHERE modelo_id = %s"
            print(f'[MODELO.DELETAR] Executando DELETE do modelo: {query} com params: ({modelo_id_temp},)')
            cursor.execute(query, (modelo_id_temp,))
            rows_deleted = cursor.rowcount
            print(f'[MODELO.DELETAR] DELETE executado. Linhas afetadas: {rows_deleted}')
            
            # Fazer commit de tudo de uma vez
            conn.commit()
            print(f'[MODELO.DELETAR] Commit realizado com sucesso')
            
            if rows_deleted == 0:
                print(f'[MODELO.DELETAR] AVISO: Nenhuma linha foi deletada!')
            else:
                print(f'[MODELO.DELETAR] Modelo e peças deletados com sucesso ({rows_deleted} linha(s) do modelo)')
                
        except Exception as e:
            print(f'[MODELO.DELETAR] ERRO ao executar DELETE: {e}')
            conn.rollback()
            import traceback
            traceback.print_exc()
            raise
        finally:
            cursor.close()
            conn.close()

        self.id = None

    @classmethod
    def criar(cls, codigo: str, nome: str) -> 'Modelo':
        """Cria e salva um novo modelo"""
        modelo = cls(codigo=codigo, nome=nome)
        modelo.salvar()
        return modelo