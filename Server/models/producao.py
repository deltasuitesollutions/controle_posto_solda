"""
Modelo para a entidade ProducaoRegistro
"""
from typing import Dict, Any, Optional, List, Tuple
from Server.models.database import DatabaseConnection
from datetime import datetime


class ProducaoRegistro:
    """Modelo que representa um registro de produção"""
    
    def __init__(
        self, 
        posto_id: int,
        funcionario_id: int, 
        modelo_id: int, 
        turno: str, 
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
        self.registro_id: Optional[int] = registro_id
        self.sublinha_id: Optional[int] = sublinha_id
        self.posto_id: int = posto_id
        self.funcionario_id: int = funcionario_id
        self.operacao_id: Optional[int] = operacao_id
        self.modelo_id: int = modelo_id
        self.peca_id: Optional[int] = peca_id
        self.turno: str = turno
        self.inicio: Optional[str] = inicio
        self.fim: Optional[str] = fim
        self.quantidade: Optional[int] = quantidade
        self.codigo_producao: Optional[str] = codigo_producao
        self.comentarios: Optional[str] = comentarios
        self.data_inicio: Optional[str] = data_inicio
        self.hora_inicio: Optional[str] = hora_inicio
    
    def to_dict(self, include_relations: bool = False) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        result: Dict[str, Any] = {
            "registro_id": self.registro_id,
            "posto_id": self.posto_id,
            "funcionario_id": self.funcionario_id,
            "modelo_id": self.modelo_id,
            "turno": self.turno,
            "inicio": self.inicio,
            "fim": self.fim,
            "data_inicio": self.data_inicio,
            "hora_inicio": self.hora_inicio,
            "quantidade": self.quantidade
        }
        
        if include_relations:
            from Server.models.funcionario import Funcionario
            from Server.models.modelo import Modelo
            from Server.models.posto import Posto
            
            funcionario = Funcionario.buscar_por_matricula(self.funcionario_id) if isinstance(self.funcionario_id, str) else None
            if not funcionario and isinstance(self.funcionario_id, int):
                # Tentar buscar por ID
                funcionarios = Funcionario.listar_todos()
                funcionario = next((f for f in funcionarios if f.funcionario_id == self.funcionario_id), None)
            
            modelo = Modelo.buscar_por_id(self.modelo_id)
            posto = Posto.buscar_por_id(self.posto_id)
            
            result["operador"] = funcionario.nome if funcionario else None
            result["modelo_descricao"] = modelo.nome if modelo else None
            result["posto_nome"] = posto.nome if posto else None
        
        return result
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'ProducaoRegistro':
        """Cria um objeto ProducaoRegistro a partir de um dicionário"""
        return ProducaoRegistro(
            registro_id=data.get('registro_id'),
            posto_id=data.get('posto_id', 0),
            funcionario_id=data.get('funcionario_id', 0),
            modelo_id=data.get('modelo_id', 0),
            turno=str(data.get('turno', '')),
            inicio=data.get('inicio'),
            fim=data.get('fim'),
            data_inicio=data.get('data_inicio'),
            hora_inicio=data.get('hora_inicio'),
            quantidade=data.get('quantidade'),
            sublinha_id=data.get('sublinha_id'),
            operacao_id=data.get('operacao_id'),
            peca_id=data.get('peca_id'),
            codigo_producao=data.get('codigo_producao'),
            comentarios=data.get('comentarios')
        )
    
    @staticmethod
    def from_row(row: Tuple[Any, ...]) -> 'ProducaoRegistro':
        """Cria um objeto ProducaoRegistro a partir de uma linha do banco"""
        from datetime import time, date, datetime
        
        # Ordem esperada: registro_id, sublinha_id, posto_id, funcionario_id, operacao_id, 
        # modelo_id, peca_id, turno, inicio, fim, quantidade, codigo_producao, comentarios, 
        # criado_em, atualizado_em, data_inicio, hora_inicio, mes_ano
        row_len = len(row)
        
        # Converter inicio (pode ser time object do PostgreSQL)
        inicio = row[8] if row_len > 8 else None
        if isinstance(inicio, time):
            inicio = inicio.strftime('%H:%M')
        elif inicio:
            inicio_str = str(inicio)
            if len(inicio_str) >= 8 and inicio_str.count(':') >= 2:
                inicio = inicio_str[:5]
            else:
                inicio = inicio_str
        
        # Converter fim (pode ser time object do PostgreSQL)
        fim = row[9] if row_len > 9 else None
        if isinstance(fim, time):
            fim = fim.strftime('%H:%M')
        elif fim:
            fim_str = str(fim)
            if len(fim_str) >= 8 and fim_str.count(':') >= 2:
                fim = fim_str[:5]
            else:
                fim = fim_str
        
        # Converter data_inicio (pode ser date object do PostgreSQL)
        data_inicio = row[15] if row_len > 15 else None
        if isinstance(data_inicio, date):
            data_inicio = data_inicio.strftime('%Y-%m-%d')
        elif data_inicio and not isinstance(data_inicio, str):
            data_inicio = str(data_inicio)
        
        # Converter hora_inicio (pode ser time object do PostgreSQL)
        hora_inicio = row[16] if row_len > 16 else None
        if isinstance(hora_inicio, time):
            hora_inicio = hora_inicio.strftime('%H:%M')
        elif hora_inicio:
            hora_inicio_str = str(hora_inicio)
            if len(hora_inicio_str) >= 8 and hora_inicio_str.count(':') >= 2:
                hora_inicio = hora_inicio_str[:5]
            else:
                hora_inicio = hora_inicio_str
        
        return ProducaoRegistro(
            registro_id=row[0] if row_len > 0 and row[0] is not None else None,
            sublinha_id=row[1] if row_len > 1 and row[1] is not None else None,
            posto_id=int(row[2]) if row_len > 2 and row[2] is not None else 0,
            funcionario_id=int(row[3]) if row_len > 3 and row[3] is not None else 0,
            operacao_id=row[4] if row_len > 4 and row[4] is not None else None,
            modelo_id=int(row[5]) if row_len > 5 and row[5] is not None else 0,
            peca_id=row[6] if row_len > 6 and row[6] is not None else None,
            turno=str(row[7]) if row_len > 7 and row[7] is not None else '',
            inicio=inicio,
            fim=fim,
            quantidade=row[10] if row_len > 10 and row[10] is not None else None,
            codigo_producao=row[11] if row_len > 11 and row[11] is not None else None,
            comentarios=row[12] if row_len > 12 and row[12] is not None else None,
            data_inicio=data_inicio,
            hora_inicio=hora_inicio
        )
    
    def save(self) -> 'ProducaoRegistro':
        """Salva o registro de produção no banco de dados"""
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            data_atual = datetime.now().strftime('%Y-%m-%d')
            hora_atual = datetime.now().strftime('%H:%M')
            
            # Se não tiver data_inicio, usar data atual
            if not self.data_inicio:
                self.data_inicio = data_atual
            
            # Se não tiver hora_inicio, usar hora atual
            if not self.hora_inicio:
                self.hora_inicio = hora_atual
            
            # Se não tiver inicio, usar hora_inicio
            if not self.inicio:
                self.inicio = self.hora_inicio
            
            if self.registro_id:
                # Atualizar
                campos = [
                    "posto_id = %s",
                    "funcionario_id = %s",
                    "modelo_id = %s",
                    "turno = %s",
                    "inicio = %s",
                    "fim = %s",
                    "data_inicio = %s",
                    "hora_inicio = %s"
                ]
                valores: List[Any] = [
                    self.posto_id,
                    self.funcionario_id,
                    self.modelo_id,
                    self.turno,
                    self.inicio,
                    self.fim,
                    self.data_inicio,
                    self.hora_inicio
                ]
                
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
                
                valores.append(self.registro_id)
                query = f"UPDATE registros_producao SET {', '.join(campos)}, atualizado_em = CURRENT_TIMESTAMP WHERE registro_id = %s"
                cursor.execute(query, tuple(valores))
            else:
                # Inserir com RETURNING registro_id para PostgreSQL
                campos = ["posto_id", "funcionario_id", "modelo_id", "turno", "inicio", "data_inicio", "hora_inicio"]
                valores_inserir: List[Any] = [
                    self.posto_id,
                    self.funcionario_id,
                    self.modelo_id,
                    self.turno,
                    self.inicio,
                    self.data_inicio,
                    self.hora_inicio
                ]
                placeholders = ["%s"] * len(campos)
                
                if self.fim:
                    campos.append("fim")
                    valores_inserir.append(self.fim)
                    placeholders.append("%s")
                if self.quantidade is not None:
                    campos.append("quantidade")
                    valores_inserir.append(self.quantidade)
                    placeholders.append("%s")
                if self.sublinha_id is not None:
                    campos.append("sublinha_id")
                    valores_inserir.append(self.sublinha_id)
                    placeholders.append("%s")
                if self.operacao_id is not None:
                    campos.append("operacao_id")
                    valores_inserir.append(self.operacao_id)
                    placeholders.append("%s")
                if self.peca_id is not None:
                    campos.append("peca_id")
                    valores_inserir.append(self.peca_id)
                    placeholders.append("%s")
                if self.codigo_producao:
                    campos.append("codigo_producao")
                    valores_inserir.append(self.codigo_producao)
                    placeholders.append("%s")
                if self.comentarios:
                    campos.append("comentarios")
                    valores_inserir.append(self.comentarios)
                    placeholders.append("%s")
                
                query = f"INSERT INTO registros_producao ({', '.join(campos)}, criado_em) VALUES ({', '.join(placeholders)}, CURRENT_TIMESTAMP) RETURNING registro_id"
                cursor.execute(query, tuple(valores_inserir))
                result = cursor.fetchone()
                if result:
                    self.registro_id = result[0] if isinstance(result, tuple) else result
                else:
                    raise Exception("Falha ao obter ID do registro inserido")
            
            conn.commit()
            
            # Verificar se o registro foi realmente salvo
            if self.registro_id:
                cursor.execute(f"SELECT registro_id FROM registros_producao WHERE registro_id = %s", (self.registro_id,))
                verificado = cursor.fetchone()
                if not verificado:
                    raise Exception(f"Registro {self.registro_id} não foi encontrado no banco após inserção")
            
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
                      modelo_id, peca_id, turno, inicio, fim, quantidade, codigo_producao, 
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
                # Buscar registro aberto por ID
                query = """SELECT registro_id, sublinha_id, posto_id, funcionario_id, operacao_id, 
                          modelo_id, peca_id, turno, inicio, fim, quantidade, codigo_producao, 
                          comentarios, criado_em, atualizado_em, data_inicio, hora_inicio, mes_ano
                          FROM registros_producao 
                          WHERE registro_id = %s AND fim IS NULL"""
                cursor.execute(query, (registro_id,))
                row = cursor.fetchone()
            elif posto and funcionario_matricula:
                # Buscar posto_id pelo nome
                postos = Posto.listar_todos()
                posto_obj = next((p for p in postos if p.nome == posto), None)
                if not posto_obj:
                    return None
                
                # Buscar funcionario_id pela matrícula
                funcionario = Funcionario.buscar_por_matricula(funcionario_matricula)
                if not funcionario:
                    return None
                
                # Buscar registro aberto
                query = """SELECT registro_id, sublinha_id, posto_id, funcionario_id, operacao_id, 
                          modelo_id, peca_id, turno, inicio, fim, quantidade, codigo_producao, 
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
        turno: Optional[str] = None
    ) -> List['ProducaoRegistro']:
        """Lista registros de produção com filtros"""
        if not DatabaseConnection.table_exists('registros_producao'):
            return []
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        try:
            query = """SELECT registro_id, sublinha_id, posto_id, funcionario_id, operacao_id, 
                      modelo_id, peca_id, turno, inicio, fim, quantidade, codigo_producao, 
                      comentarios, criado_em, atualizado_em, data_inicio, hora_inicio, mes_ano
                      FROM registros_producao
                      WHERE 1=1"""
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
            if turno:
                query += " AND turno = %s"
                turno_value = int(turno) if isinstance(turno, str) and turno.isdigit() else turno
                params.append(turno_value)
            
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
        turno: Optional[str] = None
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
        if not self.registro_id:
            raise Exception("Registro não possui ID")
        query = "DELETE FROM registros_producao WHERE registro_id = %s"
        DatabaseConnection.execute_query(query, (self.registro_id,))
        self.registro_id = None
    
    @staticmethod
    def criar(
        posto: str, 
        funcionario_matricula: str, 
        produto: str, 
        data: str, 
        hora_inicio: str, 
        turno: str, 
        tag_rfid_id: Optional[int] = None, 
        status: str = 'em_producao',
        operacao_id: Optional[int] = None,
        peca_id: Optional[int] = None,
        codigo_producao: Optional[str] = None,
        quantidade: Optional[int] = None
    ) -> 'ProducaoRegistro':
        """Método estático para criar um novo registro de produção
        
        Args:
            posto: Nome do posto
            funcionario_matricula: Matrícula do funcionário
            produto: Código do produto/modelo
            data: Data de início (formato YYYY-MM-DD)
            hora_inicio: Hora de início (formato HH:MM)
            turno: Turno (1 ou 2)
            tag_rfid_id: ID da tag RFID (opcional)
            status: Status do registro (opcional, padrão: 'em_producao')
            operacao_id: ID da operação (opcional)
            peca_id: ID da peça (opcional)
            codigo_producao: Código de produção (opcional)
            quantidade: Quantidade produzida (opcional)
        """
        from Server.models.posto import Posto
        from Server.models.funcionario import Funcionario
        from Server.models.modelo import Modelo
        
        # Buscar IDs
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
        
        print(f"[PRODUCAO MODEL] Criando ProducaoRegistro - Posto: {posto} (ID: {posto_obj.posto_id}), Funcionário: {funcionario_matricula} (ID: {funcionario.funcionario_id}), Modelo: {produto} (ID: {modelo.id}), Data: {data}, Hora: {hora_inicio}, Turno: {turno}, Operação: {operacao_id}, Peça: {peca_id}, Quantidade: {quantidade}")
        
        try:
            registro = ProducaoRegistro(
                posto_id=posto_obj.posto_id,
                funcionario_id=funcionario.funcionario_id,
                modelo_id=modelo.id,
                turno=turno,
                inicio=hora_inicio,
                data_inicio=data,
                hora_inicio=hora_inicio,
                operacao_id=operacao_id,
                peca_id=peca_id,
                codigo_producao=codigo_producao,
                quantidade=quantidade
            )
            print(f"[PRODUCAO MODEL] Objeto ProducaoRegistro criado, chamando save()...")
            registro_salvo = registro.save()
            print(f"[PRODUCAO MODEL] Registro salvo com sucesso - ID: {registro_salvo.registro_id}")
            return registro_salvo
        except Exception as e:
            print(f"[PRODUCAO MODEL] Erro ao criar registro: {str(e)}")
            import traceback
            print(f"[PRODUCAO MODEL] Traceback: {traceback.format_exc()}")
            raise
