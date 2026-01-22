"""
Modelo para a entidade ProducaoRegistro
"""
from typing import Optional, List, Tuple, Any
from Server.models.database import DatabaseConnection
from datetime import datetime, time, date


def _format_time(value: Any) -> Optional[str]:
    """Converte time object ou string para formato HH:MM"""
    if value is None:
        return None
    if isinstance(value, time):
        return value.strftime('%H:%M')
    if isinstance(value, str):
        if ':' in value:
            if len(value) >= 8 and value.count(':') >= 2:
                return value[:5]
            if len(value) == 5 and value.count(':') == 1:
                return value
    return None


def _format_date(value: Any) -> Optional[str]:
    """Converte date object para string YYYY-MM-DD"""
    if value is None:
        return None
    if isinstance(value, date):
        return value.strftime('%Y-%m-%d')
    if isinstance(value, str):
        return value
    return str(value)


def _build_timestamp(date_str: Optional[str], time_str: Optional[str]) -> Optional[str]:
    """Constrói timestamp no formato YYYY-MM-DD HH:MM:SS"""
    if not time_str:
        return None
    date_part = date_str or datetime.now().strftime('%Y-%m-%d')
    time_part = time_str.strip()
    
    # Se já tem data e hora juntos, retornar como está
    if ' ' in time_part:
        parts = time_part.split()
        if len(parts) >= 2:
            date_check = parts[0]
            if len(date_check) == 10 and date_check.count('-') == 2:
                time_part = parts[1]
            else:
                time_part = parts[-1]
    
    # Normalizar hora para HH:MM:SS
    if ':' in time_part:
        if time_part.count(':') == 1:
            time_part = f"{time_part}:00"
        elif time_part.count(':') == 2 and len(time_part) == 5:
            time_part = f"{time_part}:00"
    
    return f"{date_part} {time_part}"


class ProducaoRegistro:
    """Modelo que representa um registro de produção"""
    
    def __init__(
        self, 
        posto_id: int,
        funcionario_id: int, 
        modelo_id: int, 
        inicio: Optional[str] = None,
        fim: Optional[str] = None,
        data_inicio: Optional[str] = None,
        hora_inicio: Optional[str] = None,
        quantidade: Optional[int] = None,
        sublinha_id: Optional[int] = None,
        operacao_id: Optional[int] = None,
        peca_id: Optional[int] = None,
        codigo_producao: Optional[str] = None,
        comentarios: Optional[str] = None,
        registro_id: Optional[int] = None
    ) -> None:
        self.registro_id = registro_id
        self.sublinha_id = sublinha_id
        self.posto_id = posto_id
        self.funcionario_id = funcionario_id
        self.operacao_id = operacao_id
        self.modelo_id = modelo_id
        self.peca_id = peca_id
        self.inicio = inicio
        self.fim = fim
        self.quantidade = quantidade
        self.codigo_producao = codigo_producao
        self.comentarios = comentarios
        self.data_inicio = data_inicio
        self.hora_inicio = hora_inicio
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'ProducaoRegistro':
        """Cria um objeto ProducaoRegistro a partir de uma linha do banco"""
        row_len = len(row)
        
        return ProducaoRegistro(
            registro_id=row[0] if row_len > 0 and row[0] is not None else None,
            sublinha_id=row[1] if row_len > 1 and row[1] is not None else None,
            posto_id=int(row[2]) if row_len > 2 and row[2] is not None else 0,
            funcionario_id=int(row[3]) if row_len > 3 and row[3] is not None else 0,
            operacao_id=row[4] if row_len > 4 and row[4] is not None else None,
            modelo_id=int(row[5]) if row_len > 5 and row[5] is not None else 0,
            peca_id=row[6] if row_len > 6 and row[6] is not None else None,
            inicio=_format_time(row[7] if row_len > 7 else None),
            fim=_format_time(row[8] if row_len > 8 else None),
            quantidade=row[9] if row_len > 9 and row[9] is not None else None,
            codigo_producao=row[10] if row_len > 10 and row[10] is not None else None,
            comentarios=row[11] if row_len > 11 and row[11] is not None else None,
            data_inicio=_format_date(row[14] if row_len > 14 else None),
            hora_inicio=_format_time(row[15] if row_len > 15 else None)
        )
    
    def save(self) -> 'ProducaoRegistro':
        """Salva o registro de produção no banco de dados"""
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            data_atual = datetime.now().strftime('%Y-%m-%d')
            
            if self.registro_id:
                # UPDATE
                campos = ["posto_id = %s", "funcionario_id = %s", "modelo_id = %s"]
                valores = [self.posto_id, self.funcionario_id, self.modelo_id]
                
                if self.inicio is not None:
                    inicio_value = _build_timestamp(self.data_inicio, self.inicio)
                    if inicio_value:
                        campos.append("inicio = CAST(%s AS TIMESTAMP)")
                        valores.append(inicio_value)
                
                fim_value = _build_timestamp(self.data_inicio, self.fim) if self.fim else None
                if fim_value:
                    campos.append("fim = CAST(%s AS TIMESTAMP)")
                    valores.append(fim_value)
                
                # data_inicio é uma coluna gerada, não pode ser atualizada manualmente
                # hora_inicio também pode ser gerada, então não atualizamos
                
                if self.quantidade is not None:
                    campos.append("quantidade = %s")
                    valores.append(self.quantidade)
                
                if self.sublinha_id is not None:
                    campos.append("sublinha_id = %s")
                    valores.append(self.sublinha_id)
                
                if self.operacao_id is not None:
                    campos.append("operacao_id = %s")
                    valores.append(self.operacao_id)
                
                if self.peca_id is not None:
                    campos.append("peca_id = %s")
                    valores.append(self.peca_id)
                
                if self.codigo_producao:
                    campos.append("codigo_producao = %s")
                    valores.append(self.codigo_producao)
                
                if self.comentarios:
                    campos.append("comentarios = %s")
                    valores.append(self.comentarios)
                
                where_clause = "WHERE registro_id = %s AND fim IS NULL" if fim_value else "WHERE registro_id = %s"
                valores.append(self.registro_id)
                
                query = f"UPDATE registros_producao SET {', '.join(campos)}, atualizado_em = CURRENT_TIMESTAMP {where_clause}"
                cursor.execute(query, tuple(valores))
                
                if fim_value and cursor.rowcount == 0:
                    raise Exception(f"Registro {self.registro_id} já está fechado ou não existe")
            else:
                # INSERT
                from Server.models.posto import Posto
                
                sublinha_id_value = self.sublinha_id
                if not sublinha_id_value:
                    posto_obj = Posto.buscar_por_id(self.posto_id)
                    if posto_obj:
                        sublinha_id_value = posto_obj.sublinha_id
                
                campos = ["posto_id", "funcionario_id", "modelo_id", "sublinha_id"]
                valores = [self.posto_id, self.funcionario_id, self.modelo_id, sublinha_id_value]
                placeholders = ["%s"] * len(campos)
                
                inicio_value = _build_timestamp(self.data_inicio, self.inicio) if self.inicio else None
                if inicio_value:
                    campos.append("inicio")
                    valores.append(inicio_value)
                    placeholders.append("CAST(%s AS TIMESTAMP)")
                
                fim_value = _build_timestamp(self.data_inicio, self.fim) if self.fim else None
                if fim_value:
                    campos.append("fim")
                    valores.append(fim_value)
                    placeholders.append("CAST(%s AS TIMESTAMP)")
                
                if self.quantidade is not None:
                    campos.append("quantidade")
                    valores.append(self.quantidade)
                    placeholders.append("%s")
                
                if self.operacao_id is not None:
                    campos.append("operacao_id")
                    valores.append(self.operacao_id)
                    placeholders.append("%s")
                
                if self.peca_id is not None:
                    campos.append("peca_id")
                    valores.append(self.peca_id)
                    placeholders.append("%s")
                
                if self.codigo_producao:
                    campos.append("codigo_producao")
                    valores.append(self.codigo_producao)
                    placeholders.append("%s")
                
                if self.comentarios:
                    campos.append("comentarios")
                    valores.append(self.comentarios)
                    placeholders.append("%s")
                
                query = f"INSERT INTO registros_producao ({', '.join(campos)}, criado_em) VALUES ({', '.join(placeholders)}, CURRENT_TIMESTAMP) RETURNING registro_id"
                cursor.execute(query, tuple(valores))
                result = cursor.fetchone()
                if result:
                    self.registro_id = result[0] if isinstance(result, tuple) else result
                else:
                    raise Exception("Falha ao obter ID do registro inserido")
            
            conn.commit()
            return self
        except Exception as e:
            conn.rollback()
            raise Exception(f"Erro ao salvar registro de produção: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['ProducaoRegistro']:
        """Busca um registro pelo ID"""
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = """SELECT registro_id, sublinha_id, posto_id, funcionario_id, operacao_id, 
                      modelo_id, peca_id, inicio, fim, quantidade, codigo_producao, 
                      comentarios, criado_em, atualizado_em, data_inicio, hora_inicio, mes_ano
                      FROM registros_producao WHERE registro_id = %s"""
            cursor.execute(query, (id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            return ProducaoRegistro.from_row(row)
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def buscar_registro_aberto(
        posto: Optional[str] = None, 
        funcionario_matricula: Optional[str] = None, 
        registro_id: Optional[int] = None
    ) -> Optional['ProducaoRegistro']:
        """Busca um registro em aberto (sem hora_fim)"""
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            from Server.models.posto import Posto
            from Server.models.funcionario import Funcionario
            
            if registro_id:
                query = """SELECT registro_id, sublinha_id, posto_id, funcionario_id, operacao_id, 
                          modelo_id, peca_id, inicio, fim, quantidade, codigo_producao, 
                          comentarios, criado_em, atualizado_em, data_inicio, hora_inicio, mes_ano
                          FROM registros_producao 
                          WHERE registro_id = %s AND fim IS NULL"""
                cursor.execute(query, (registro_id,))
                row = cursor.fetchone()
            elif posto and funcionario_matricula:
                postos = Posto.listar_todos()
                posto_obj = next((p for p in postos if p.nome == posto), None)
                if not posto_obj:
                    return None
                
                funcionario = Funcionario.buscar_por_matricula(funcionario_matricula)
                if not funcionario:
                    return None
                
                query = """SELECT registro_id, sublinha_id, posto_id, funcionario_id, operacao_id, 
                          modelo_id, peca_id, inicio, fim, quantidade, codigo_producao, 
                          comentarios, criado_em, atualizado_em, data_inicio, hora_inicio, mes_ano
                          FROM registros_producao 
                          WHERE posto_id = %s AND funcionario_id = %s AND fim IS NULL
                          ORDER BY registro_id DESC LIMIT 1"""
                cursor.execute(query, (posto_obj.posto_id, funcionario.funcionario_id))
                row = cursor.fetchone()
            else:
                raise Exception("É necessário fornecer registro_id ou posto/funcionario_matricula")
            
            if not row:
                return None
            
            return ProducaoRegistro.from_row(row)
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def verificar_registro_aberto(posto: str, funcionario_matricula: str, data: str) -> bool:
        """Verifica se existe um registro em aberto"""
        from Server.models.posto import Posto
        from Server.models.funcionario import Funcionario
        
        postos = Posto.listar_todos()
        posto_obj = next((p for p in postos if p.nome == posto), None)
        if not posto_obj:
            return False
        
        funcionario = Funcionario.buscar_por_matricula(funcionario_matricula)
        if not funcionario:
            return False
        
        query = """SELECT COUNT(*) FROM registros_producao 
                   WHERE posto_id = %s AND funcionario_id = %s 
                   AND data_inicio = %s AND fim IS NULL"""
        result = DatabaseConnection.execute_query(
            query, (posto_obj.posto_id, funcionario.funcionario_id, data), fetch_one=True
        )
        if result and isinstance(result, tuple) and len(result) > 0:
            return bool(result[0] > 0)
        return False
    
    @staticmethod
    def listar(
        limit: int = 100, 
        offset: int = 0, 
        data: Optional[str] = None, 
        posto: Optional[str] = None, 
        operacao_id: Optional[int] = None
    ) -> List['ProducaoRegistro']:
        """Lista registros de produção com filtros"""
        if not DatabaseConnection.table_exists('registros_producao'):
            return []
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = """SELECT registro_id, sublinha_id, posto_id, funcionario_id, operacao_id, 
                      modelo_id, peca_id, inicio, fim, quantidade, codigo_producao, 
                      comentarios, criado_em, atualizado_em, data_inicio, hora_inicio, mes_ano
                      FROM registros_producao WHERE 1=1"""
            params = []
            
            if data:
                query += " AND data_inicio = %s"
                params.append(data)
            if posto:
                from Server.models.posto import Posto
                postos = Posto.listar_todos()
                posto_obj = next((p for p in postos if p.nome == posto), None)
                if posto_obj:
                    query += " AND posto_id = %s"
                    params.append(posto_obj.posto_id)
            if operacao_id is not None:
                query += " AND operacao_id = %s"
                params.append(operacao_id)
            
            query += " ORDER BY registro_id DESC LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            return [ProducaoRegistro.from_row(row) for row in rows]
        except Exception as e:
            raise Exception(f"Erro ao listar registros de produção: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def contar(
        data: Optional[str] = None, 
        posto: Optional[str] = None, 
        operacao_id: Optional[int] = None
    ) -> int:
        """Conta registros de produção com filtros"""
        if not DatabaseConnection.table_exists('registros_producao'):
            return 0
        
        query = "SELECT COUNT(*) FROM registros_producao WHERE 1=1"
        params = []
        
        if data:
            query += " AND data_inicio = %s"
            params.append(data)
        if posto:
            from Server.models.posto import Posto
            postos = Posto.listar_todos()
            posto_obj = next((p for p in postos if p.nome == posto), None)
            if posto_obj:
                query += " AND posto_id = %s"
                params.append(posto_obj.posto_id)
        if operacao_id is not None:
            query += " AND operacao_id = %s"
            params.append(operacao_id)
        
        result = DatabaseConnection.execute_query(query, tuple(params), fetch_one=True)
        if result and isinstance(result, tuple) and len(result) > 0:
            count = result[0]
            return int(count) if count is not None else 0
        return 0
    
    @staticmethod
    def deletar_por_id(registro_id: int) -> bool:
        """Deleta um registro de produção pelo ID"""
        if not DatabaseConnection.table_exists('registros_producao'):
            return False
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = "DELETE FROM registros_producao WHERE registro_id = %s"
            cursor.execute(query, (registro_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            raise Exception(f"Erro ao deletar registro de produção: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def criar(
        posto: str, 
        funcionario_matricula: str, 
        produto: str, 
        data: str, 
        hora_inicio: str, 
        operacao_id: Optional[int] = None,
        peca_id: Optional[int] = None,
        codigo_producao: Optional[str] = None,
        quantidade: Optional[int] = None
    ) -> 'ProducaoRegistro':
        """Cria um novo registro de produção"""
        from Server.models.posto import Posto
        from Server.models.funcionario import Funcionario
        from Server.models.modelo import Modelo
        
        postos = Posto.listar_todos()
        posto_obj = next((p for p in postos if p.nome == posto), None)
        if not posto_obj:
            raise Exception(f"Posto '{posto}' não encontrado")
        
        funcionario = Funcionario.buscar_por_matricula(funcionario_matricula)
        if not funcionario:
            raise Exception(f"Funcionário com matrícula '{funcionario_matricula}' não encontrado")
        
        modelo = Modelo.buscar_por_codigo(produto)
        if not modelo:
            raise Exception(f"Modelo '{produto}' não encontrado")
        
        registro = ProducaoRegistro(
            posto_id=posto_obj.posto_id,
            funcionario_id=funcionario.funcionario_id,
            modelo_id=modelo.id,
            inicio=hora_inicio,
            fim=None,
            data_inicio=data,
            hora_inicio=hora_inicio,
            sublinha_id=posto_obj.sublinha_id,
            operacao_id=operacao_id,
            peca_id=peca_id,
            codigo_producao=codigo_producao,
            quantidade=quantidade
        )
        return registro.save()
