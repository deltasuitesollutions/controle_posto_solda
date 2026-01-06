"""
Modelo para a entidade ProducaoRegistro
"""
from typing import Dict, Any, Optional, List, Tuple
from backend.models.database import DatabaseConnection
from datetime import datetime


class ProducaoRegistro:
    """Modelo que representa um registro de produção"""
    
    def __init__(
        self, 
        posto: str, 
        funcionario_matricula: str, 
        produto: str, 
        data: str, 
        hora_inicio: str, 
        turno: str, 
        hora_fim: Optional[str] = None, 
        tag_rfid_id: Optional[int] = None, 
        status: str = 'em_producao', 
        data_criacao: Optional[str] = None, 
        id: Optional[int] = None
    ) -> None:
        self.id: Optional[int] = id
        self.posto: str = posto
        self.funcionario_matricula: str = funcionario_matricula
        self.produto: str = produto
        self.data: str = data
        self.hora_inicio: str = hora_inicio
        self.hora_fim: Optional[str] = hora_fim
        self.turno: str = turno
        self.tag_rfid_id: Optional[int] = tag_rfid_id
        self.status: str = status
        self.data_criacao: str = data_criacao or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    def to_dict(self, include_relations: bool = False) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        result: Dict[str, Any] = {
            "id": self.id,
            "posto": self.posto,
            "funcionario_matricula": self.funcionario_matricula,
            "produto": self.produto,
            "data": self.data,
            "hora_inicio": self.hora_inicio,
            "hora_fim": self.hora_fim,
            "turno": self.turno,
            "tag_rfid_id": self.tag_rfid_id,
            "status": self.status,
            "data_criacao": self.data_criacao
        }
        
        if include_relations:
            from backend.models.funcionario import Funcionario
            from backend.models.modelo import Modelo
            
            funcionario = Funcionario.buscar_por_matricula(self.funcionario_matricula)
            result["operador"] = funcionario.nome if funcionario else None
            
            modelo = Modelo.buscar_por_codigo(self.produto)
            result["modelo_descricao"] = modelo.descricao if modelo else None
        
        return result
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'ProducaoRegistro':
        """Cria um objeto ProducaoRegistro a partir de um dicionário"""
        # Suporta tanto 'produto' quanto 'modelo_codigo' para compatibilidade
        produto = data.get('produto') or data.get('modelo_codigo') or ''
        return ProducaoRegistro(
            id=data.get('id'),
            posto=data.get('posto') or '',
            funcionario_matricula=data.get('funcionario_matricula') or '',
            produto=produto,
            data=data.get('data') or '',
            hora_inicio=data.get('hora_inicio') or '',
            turno=str(data.get('turno', '')),
            hora_fim=data.get('hora_fim'),
            tag_rfid_id=data.get('tag_rfid_id'),
            status=data.get('status', 'em_producao'),
            data_criacao=data.get('data_criacao')
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'ProducaoRegistro':
        """Cria um objeto ProducaoRegistro a partir de uma linha do banco"""
        # Ordem esperada: id, posto, funcionario_matricula, produto, data, 
        # hora_inicio, hora_fim, turno, tag_rfid_id, status, data_criacao
        from datetime import time, date, datetime
        
        row_len = len(row)
        
        # Converter hora_inicio (pode ser time object do PostgreSQL)
        hora_inicio = row[5] if row_len > 5 else ''
        if isinstance(hora_inicio, time):
            hora_inicio = hora_inicio.strftime('%H:%M')
        elif hora_inicio:
            hora_inicio_str = str(hora_inicio)
            # Se tiver formato HH:MM:SS, remover os segundos
            if len(hora_inicio_str) >= 8 and hora_inicio_str.count(':') >= 2:
                hora_inicio = hora_inicio_str[:5]  # Pega apenas HH:MM
            else:
                hora_inicio = hora_inicio_str
        
        # Converter hora_fim (pode ser time object do PostgreSQL)
        hora_fim = row[6] if row_len > 6 else None
        if isinstance(hora_fim, time):
            hora_fim = hora_fim.strftime('%H:%M')
        elif hora_fim:
            hora_fim_str = str(hora_fim)
            # Se tiver formato HH:MM:SS, remover os segundos
            if len(hora_fim_str) >= 8 and hora_fim_str.count(':') >= 2:
                hora_fim = hora_fim_str[:5]  # Pega apenas HH:MM
            else:
                hora_fim = hora_fim_str
        
        # Converter data (pode ser date object do PostgreSQL)
        data = row[4] if row_len > 4 else ''
        if isinstance(data, date):
            data = data.strftime('%Y-%m-%d')
        elif data and not isinstance(data, str):
            data = str(data)
        
        # Converter data_criacao (pode ser datetime object do PostgreSQL)
        data_criacao = row[10] if row_len > 10 else None
        if isinstance(data_criacao, datetime):
            data_criacao = data_criacao.strftime('%Y-%m-%d %H:%M:%S')
        elif data_criacao and not isinstance(data_criacao, str):
            data_criacao = str(data_criacao)
        
        return ProducaoRegistro(
            id=row[0] if row_len > 0 else None,
            posto=row[1] if row_len > 1 else '',
            funcionario_matricula=row[2] if row_len > 2 else '',
            produto=row[3] if row_len > 3 else '',
            data=data,
            hora_inicio=hora_inicio,
            hora_fim=hora_fim,
            turno=row[7] if row_len > 7 else '',
            tag_rfid_id=row[8] if row_len > 8 else None,
            status=row[9] if row_len > 9 else 'em_producao',
            data_criacao=data_criacao
        )
    
    def save(self) -> 'ProducaoRegistro':
        """Salva o registro de produção no banco de dados"""
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            # Verificar se colunas existem usando information_schema (PostgreSQL)
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'producao_registros'
            """)
            colunas = [row[0] for row in cursor.fetchall()]
            has_status = 'status' in colunas
            has_tag_rfid = 'tag_rfid_id' in colunas
            has_data_criacao = 'data_criacao' in colunas
            
            # Verificar se usa 'produto' ou 'modelo_codigo' (compatibilidade)
            usa_produto = 'produto' in colunas
            campo_produto = 'produto' if usa_produto else 'modelo_codigo'
            
            if self.id:
                # Atualizar
                campos = ["posto = %s", "funcionario_matricula = %s", f"{campo_produto} = %s",
                         "data = %s", "hora_inicio = %s", "hora_fim = %s", "turno = %s"]
                valores: List[Any] = [self.posto, self.funcionario_matricula, self.produto,
                          self.data, self.hora_inicio, self.hora_fim, self.turno]
                
                if has_status:
                    campos.append("status = %s")
                    valores.append(self.status)
                if has_tag_rfid:
                    campos.append("tag_rfid_id = %s")
                    valores.append(self.tag_rfid_id)
                
                valores.append(self.id)
                query = f"UPDATE producao_registros SET {', '.join(campos)} WHERE id = %s"
                cursor.execute(query, tuple(valores))
                rows_affected = cursor.rowcount
            else:
                # Inserir com RETURNING id para PostgreSQL
                campos = ["posto", "funcionario_matricula", campo_produto, "data", 
                         "hora_inicio", "turno"]
                valores_inserir: List[Any] = [self.posto, self.funcionario_matricula, self.produto,
                          self.data, self.hora_inicio, self.turno]
                placeholders = ["%s"] * len(campos)
                
                if has_status:
                    campos.append("status")
                    valores_inserir.append(self.status)
                    placeholders.append("%s")
                if has_tag_rfid and self.tag_rfid_id:
                    campos.append("tag_rfid_id")
                    valores_inserir.append(self.tag_rfid_id)
                    placeholders.append("%s")
                if self.hora_fim:
                    campos.append("hora_fim")
                    valores_inserir.append(self.hora_fim)
                    placeholders.append("%s")
                
                query = f"INSERT INTO producao_registros ({', '.join(campos)}) VALUES ({', '.join(placeholders)}) RETURNING id"
                cursor.execute(query, tuple(valores_inserir))
                result = cursor.fetchone()
                if result:
                    self.id = result[0] if isinstance(result, tuple) else result
                else:
                    raise Exception("Falha ao obter ID do registro inserido")
            
            conn.commit()
            
            # Verificar se o registro foi realmente salvo
            if self.id:
                cursor.execute(f"SELECT id FROM producao_registros WHERE id = %s", (self.id,))
                verificado = cursor.fetchone()
                if not verificado:
                    raise Exception(f"Registro {self.id} não foi encontrado no banco após inserção")
                else:
                    print(f"[PRODUCAO MODEL] Verificação OK - Registro {self.id} encontrado no banco")
            
            return self
        except Exception as e:
            conn.rollback()
            raise Exception(f"Erro ao salvar registro de produção: {str(e)}")
        finally:
            conn.close()
    
    @staticmethod
    def buscar_por_id(id: int) -> Optional['ProducaoRegistro']:
        """Busca um registro pelo ID"""
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            # Verificar quais colunas existem usando information_schema (PostgreSQL)
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'producao_registros'
            """)
            colunas = [row[0] for row in cursor.fetchall()]
            has_status = 'status' in colunas
            has_tag_rfid = 'tag_rfid_id' in colunas
            has_data_criacao = 'data_criacao' in colunas
            
            # Verificar se usa 'produto' ou 'modelo_codigo' (compatibilidade)
            usa_produto = 'produto' in colunas
            campo_produto = 'produto' if usa_produto else 'modelo_codigo'
            
            # Construir query dinamicamente
            campos = ["id", "posto", "funcionario_matricula", campo_produto, "data", "hora_inicio", "hora_fim", "turno"]
            
            if has_tag_rfid:
                campos.append("tag_rfid_id")
            else:
                campos.append("NULL as tag_rfid_id")
            
            if has_status:
                campos.append("status")
            else:
                campos.append("'em_producao' as status")
            
            if has_data_criacao:
                campos.append("data_criacao")
            else:
                campos.append("NULL as data_criacao")
            
            query = f"SELECT {', '.join(campos)} FROM producao_registros WHERE id = %s"
            cursor.execute(query, (id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            return ProducaoRegistro.from_row(row)
        finally:
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
        data_atual = datetime.now().strftime('%Y-%m-%d')
        
        try:
            # Verificar quais colunas existem usando information_schema (PostgreSQL)
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'producao_registros'
            """)
            colunas = [row[0] for row in cursor.fetchall()]
            has_status = 'status' in colunas
            has_tag_rfid = 'tag_rfid_id' in colunas
            has_data_criacao = 'data_criacao' in colunas
            
            # Verificar se usa 'produto' ou 'modelo_codigo' (compatibilidade)
            usa_produto = 'produto' in colunas
            campo_produto = 'produto' if usa_produto else 'modelo_codigo'
            
            # Construir campos dinamicamente
            campos = ["id", "posto", "funcionario_matricula", campo_produto, "data", "hora_inicio", "hora_fim", "turno"]
            
            if has_tag_rfid:
                campos.append("tag_rfid_id")
            else:
                campos.append("NULL as tag_rfid_id")
            
            if has_status:
                campos.append("status")
            else:
                campos.append("'em_producao' as status")
            
            if has_data_criacao:
                campos.append("data_criacao")
            else:
                campos.append("NULL as data_criacao")
            
            campos_str = ', '.join(campos)
            
            if registro_id:
                # Buscar registro aberto por ID
                where_conditions = ["id = %s", "hora_fim IS NULL"]
                params = [registro_id]
                
                # Se a coluna status existe, também verificar que não está finalizado
                if has_status:
                    where_conditions.append("(status IS NULL OR status = 'em_producao')")
                
                query = f"""SELECT {campos_str}
                           FROM producao_registros 
                           WHERE {' AND '.join(where_conditions)}"""
                cursor.execute(query, tuple(params))
                row = cursor.fetchone()
            elif posto and funcionario_matricula:
                # Buscar registro aberto considerando APENAS posto, funcionario_matricula e hora_fim IS NULL
                # NÃO considerar produto, data ou turno
                # Verificar também o status se a coluna existir
                where_conditions = ["posto = %s", "funcionario_matricula = %s", "hora_fim IS NULL"]
                params = [posto, funcionario_matricula]
                
                # Se a coluna status existe, também verificar que não está finalizado
                if has_status:
                    where_conditions.append("(status IS NULL OR status = 'em_producao')")
                
                query = f"""SELECT {campos_str}
                           FROM producao_registros 
                           WHERE {' AND '.join(where_conditions)}
                           ORDER BY id DESC LIMIT 1"""
                cursor.execute(query, tuple(params))
                row = cursor.fetchone()
            else:
                raise Exception("É necessário fornecer registro_id ou posto/funcionario_matricula")
            
            if not row:
                return None
            
            return ProducaoRegistro.from_row(row)
        finally:
            conn.close()
    
    @staticmethod
    def verificar_registro_aberto(posto: str, funcionario_matricula: str, data: str) -> bool:
        """Verifica se existe um registro em aberto"""
        query = """SELECT COUNT(*) FROM producao_registros 
                   WHERE posto = %s AND funcionario_matricula = %s 
                   AND data = %s AND hora_fim IS NULL"""
        result = DatabaseConnection.execute_query(
            query, (posto, funcionario_matricula, data), fetch_one=True
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
        turno: Optional[str] = None
    ) -> List['ProducaoRegistro']:
        """Lista registros de produção com filtros"""
        # Verificar se a tabela existe
        if not DatabaseConnection.table_exists('producao_registros'):
            return []
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            # Verificar quais colunas existem usando information_schema (PostgreSQL)
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'producao_registros'
            """)
            colunas = [row[0] for row in cursor.fetchall()]
            
            if not colunas:
                return []
            
            has_status = 'status' in colunas
            has_tag_rfid = 'tag_rfid_id' in colunas
            has_data_criacao = 'data_criacao' in colunas
            
            # Verificar se usa 'produto' ou 'modelo_codigo' (compatibilidade)
            usa_produto = 'produto' in colunas
            campo_produto = 'pr.produto' if usa_produto else 'pr.modelo_codigo'
            
            # Construir query dinamicamente
            campos = ["pr.id", "pr.posto", "pr.funcionario_matricula", campo_produto, "pr.data", "pr.hora_inicio", "pr.hora_fim", "pr.turno"]
            
            if has_tag_rfid:
                campos.append("pr.tag_rfid_id")
            else:
                campos.append("NULL as tag_rfid_id")
            
            if has_status:
                campos.append("pr.status")
            else:
                campos.append("'em_producao' as status")
            
            if has_data_criacao:
                campos.append("pr.data_criacao")
            else:
                campos.append("NULL as data_criacao")
            
            query = f"""SELECT {', '.join(campos)}
                       FROM producao_registros pr
                       WHERE 1=1"""
            params = []
            
            if data:
                query += " AND pr.data = %s"
                params.append(data)
            if posto:
                query += " AND pr.posto = %s"
                params.append(posto)
            if turno:
                query += " AND pr.turno = %s"
                # Converter turno para inteiro se for string
                turno_value = int(turno) if isinstance(turno, str) and turno.isdigit() else turno
                params.append(turno_value)
            
            query += " ORDER BY pr.id DESC LIMIT %s OFFSET %s"
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
        turno: Optional[str] = None
    ) -> int:
        """Conta registros de produção com filtros"""
        # Verificar se a tabela existe
        if not DatabaseConnection.table_exists('producao_registros'):
            return 0
        
        query = "SELECT COUNT(*) FROM producao_registros WHERE 1=1"
        params = []
        
        if data:
            query += " AND data = %s"
            params.append(data)
        if posto:
            query += " AND posto = %s"
            params.append(posto)
        if turno:
            query += " AND turno = %s"
            params.append(turno)
        
        result = DatabaseConnection.execute_query(query, tuple(params), fetch_one=True)
        if result and isinstance(result, tuple) and len(result) > 0:
            count = result[0]
            return int(count) if count is not None else 0
        return 0
    
    def delete(self) -> None:
        """Remove o registro do banco de dados"""
        if not self.id:
            raise Exception("Registro não possui ID")
        query = "DELETE FROM producao_registros WHERE id = %s"
        DatabaseConnection.execute_query(query, (self.id,))
        self.id = None
    
    @staticmethod
    def criar(
        posto: str, 
        funcionario_matricula: str, 
        produto: str, 
        data: str, 
        hora_inicio: str, 
        turno: str, 
        tag_rfid_id: Optional[int] = None, 
        status: str = 'em_producao'
    ) -> 'ProducaoRegistro':
        """Método estático para criar um novo registro de produção"""
        print(f"[PRODUCAO MODEL] Criando ProducaoRegistro - Posto: {posto}, Funcionário: {funcionario_matricula}, Produto: {produto}, Data: {data}, Hora: {hora_inicio}, Turno: {turno}")
        try:
            registro = ProducaoRegistro(
                posto=posto,
                funcionario_matricula=funcionario_matricula,
                produto=produto,
                data=data,
                hora_inicio=hora_inicio,
                turno=turno,
                tag_rfid_id=tag_rfid_id,
                status=status
            )
            print(f"[PRODUCAO MODEL] Objeto ProducaoRegistro criado, chamando save()...")
            registro_salvo = registro.save()
            print(f"[PRODUCAO MODEL] Registro salvo com sucesso - ID: {registro_salvo.id}")
            return registro_salvo
        except Exception as e:
            print(f"[PRODUCAO MODEL] Erro ao criar registro: {str(e)}")
            import traceback
            print(f"[PRODUCAO MODEL] Traceback: {traceback.format_exc()}")
            raise

