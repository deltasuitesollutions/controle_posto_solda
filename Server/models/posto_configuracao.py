"""
Modelo para a entidade PostoConfiguracao
"""
from typing import Dict, Any, Optional, List, Tuple
from Server.models.database import DatabaseConnection
from datetime import datetime


class PostoConfiguracao:
    """Modelo que representa a configuração de um posto (operador e peça associados)"""
    
    def __init__(
        self, 
        posto: str, 
        funcionario_matricula: Optional[str] = None, 
        modelo_codigo: Optional[str] = None, 
        turno: Optional[int] = None,
        data_atualizacao: Optional[str] = None, 
        id: Optional[int] = None
    ) -> None:
        self.id: Optional[int] = id
        self.posto: str = posto
        self.funcionario_matricula: Optional[str] = funcionario_matricula
        self.modelo_codigo: Optional[str] = modelo_codigo
        self.turno: Optional[int] = turno
        self.data_atualizacao: str = data_atualizacao or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    def to_dict(self, include_relations: bool = False) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        result: Dict[str, Any] = {
            "id": self.id,
            "posto": self.posto,
            "funcionario_matricula": self.funcionario_matricula,
            "modelo_codigo": self.modelo_codigo,
            "turno": self.turno,
            "data_atualizacao": self.data_atualizacao
        }
        
        if include_relations:
            from Server.models.funcionario import Funcionario
            from Server.models.modelo import Modelo
            
            if self.funcionario_matricula:
                funcionario = Funcionario.buscar_por_matricula(self.funcionario_matricula)
                result["funcionario_nome"] = funcionario.nome if funcionario else None
            
            if self.modelo_codigo:
                modelo = Modelo.buscar_por_codigo(self.modelo_codigo)
                result["modelo_descricao"] = modelo.descricao if modelo else None
        
        return result
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'PostoConfiguracao':
        """Cria um objeto PostoConfiguracao a partir de um dicionário"""
        posto_val = data.get('posto')
        if posto_val is None:
            posto_val = ''
        return PostoConfiguracao(
            id=data.get('id'),
            posto=posto_val,
            funcionario_matricula=data.get('funcionario_matricula'),
            modelo_codigo=data.get('modelo_codigo'),
            turno=data.get('turno'),
            data_atualizacao=data.get('data_atualizacao')
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'PostoConfiguracao':
        """Cria um objeto PostoConfiguracao a partir de uma linha do banco"""
        from datetime import datetime
        
        # Converter data_atualizacao (pode ser datetime object do PostgreSQL)
        data_atualizacao = row[5] if len(row) > 5 else None
        if isinstance(data_atualizacao, datetime):
            data_atualizacao = data_atualizacao.strftime('%Y-%m-%d %H:%M:%S')
        elif data_atualizacao and not isinstance(data_atualizacao, str):
            data_atualizacao = str(data_atualizacao)
        
        posto_val = str(row[1]) if len(row) > 1 and row[1] is not None else ''
        funcionario_matricula_val = str(row[2]) if len(row) > 2 and row[2] is not None else None
        modelo_codigo_val = str(row[3]) if len(row) > 3 and row[3] is not None else None
        turno_val = int(row[4]) if len(row) > 4 and row[4] is not None else None
        
        return PostoConfiguracao(
            id=row[0] if len(row) > 0 else None,
            posto=posto_val,
            funcionario_matricula=funcionario_matricula_val,
            modelo_codigo=modelo_codigo_val,
            turno=turno_val,
            data_atualizacao=data_atualizacao
        )
    
    def save(self) -> 'PostoConfiguracao':
        """Salva ou atualiza a configuração no banco de dados"""
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            if self.id:
                # Atualizar
                query = """UPDATE posto_configuracao 
                          SET posto = %s, funcionario_matricula = %s, modelo_codigo = %s, 
                              turno = %s, data_atualizacao = %s
                          WHERE id = %s"""
                cursor.execute(query, (
                    self.posto, 
                    self.funcionario_matricula, 
                    self.modelo_codigo,
                    self.turno,
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    self.id
                ))
            else:
                # Verificar se já existe configuração para este posto
                cursor.execute("SELECT id FROM posto_configuracao WHERE posto = %s", (self.posto,))
                existing = cursor.fetchone()
                
                if existing:
                    # Atualizar existente
                    self.id = existing[0]
                    query = """UPDATE posto_configuracao 
                              SET funcionario_matricula = %s, modelo_codigo = %s, 
                                  turno = %s, data_atualizacao = %s
                              WHERE posto = %s"""
                    cursor.execute(query, (
                        self.funcionario_matricula, 
                        self.modelo_codigo,
                        self.turno,
                        datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        self.posto
                    ))
                else:
                    # Inserir novo com RETURNING id para PostgreSQL
                    query = """INSERT INTO posto_configuracao 
                              (posto, funcionario_matricula, modelo_codigo, turno, data_atualizacao)
                              VALUES (%s, %s, %s, %s, %s) RETURNING id"""
                    cursor.execute(query, (
                        self.posto, 
                        self.funcionario_matricula, 
                        self.modelo_codigo,
                        self.turno,
                        datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    ))
                    result = cursor.fetchone()
                    if result:
                        self.id = result[0] if isinstance(result, tuple) else result
            
            conn.commit()
            return self
        except Exception as e:
            conn.rollback()
            raise Exception(f"Erro ao salvar configuração de posto: {str(e)}")
        finally:
            conn.close()
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['PostoConfiguracao']:
        """Busca uma configuração pelo ID"""
        query = """SELECT id, posto, funcionario_matricula, modelo_codigo, turno, data_atualizacao 
                  FROM posto_configuracao WHERE id = ?"""
        row = DatabaseConnection.execute_query(query, (id,), fetch_one=True)
        if not row:
            return None
        return PostoConfiguracao.from_row(row)
    
    @staticmethod
    def buscar_por_posto(posto: str) -> Optional['PostoConfiguracao']:
        """Busca a configuração de um posto específico"""
        # Verificar se a tabela existe antes de tentar buscar
        if not DatabaseConnection.table_exists('posto_configuracao'):
            return None
        
        try:
            query = """SELECT id, posto, funcionario_matricula, modelo_codigo, turno, data_atualizacao 
                      FROM posto_configuracao WHERE posto = ?"""
            row = DatabaseConnection.execute_query(query, (posto,), fetch_one=True)
            if not row:
                return None
            return PostoConfiguracao.from_row(row)
        except Exception as e:
            # Se houver erro (tabela não existe, etc), retornar None
            print(f"Aviso: Erro ao buscar configuração do posto {posto}: {str(e)}")
            return None
    
    @staticmethod
    def buscar_posto_do_funcionario(funcionario_matricula: str) -> Optional['PostoConfiguracao']:
        """Busca a configuração MAIS RECENTE do posto para um funcionário específico
        
        Retorna a configuração que:
        - Tem o funcionario_matricula especificado
        - Tem modelo_codigo IS NOT NULL (produto configurado)
        - É a mais recente (ordenada por data_atualizacao DESC)
        
        Args:
            funcionario_matricula: Matrícula do funcionário
            
        Returns:
            PostoConfiguracao mais recente ou None se não encontrado
        """
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = """SELECT id, posto, funcionario_matricula, modelo_codigo, turno, data_atualizacao 
                      FROM posto_configuracao 
                      WHERE funcionario_matricula = %s 
                      AND modelo_codigo IS NOT NULL
                      ORDER BY data_atualizacao DESC 
                      LIMIT 1"""
            cursor.execute(query, (funcionario_matricula,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            config = PostoConfiguracao.from_row(row)
            return config
        except Exception as e:
            import traceback
            raise
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def listar_todas() -> List['PostoConfiguracao']:
        """Lista todas as configurações de postos"""
        query = """SELECT id, posto, funcionario_matricula, modelo_codigo, turno, data_atualizacao 
                  FROM posto_configuracao ORDER BY posto"""
        rows = DatabaseConnection.execute_query(query, fetch_all=True)
        if not rows or not isinstance(rows, list):
            return []
        return [PostoConfiguracao.from_row(row) for row in rows]
    
    @staticmethod
    def criar(
        posto: str, 
        funcionario_matricula: Optional[str] = None, 
        modelo_codigo: Optional[str] = None,
        turno: Optional[int] = None
    ) -> 'PostoConfiguracao':
        """Método estático para criar ou atualizar uma configuração de posto"""
        config = PostoConfiguracao(
            posto=posto,
            funcionario_matricula=funcionario_matricula,
            modelo_codigo=modelo_codigo,
            turno=turno
        )
        return config.save()
    
    def delete(self) -> None:
        """Remove a configuração do banco de dados"""
        if not self.id:
            raise Exception("Configuração não possui ID")
        query = "DELETE FROM posto_configuracao WHERE id = ?"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None

