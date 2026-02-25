"""
Classe base para gerenciar conexões com o banco de dados PostgreSQL
"""
import psycopg2
import os
import json
from typing import Optional, Union, Tuple, List, Any, Dict, TYPE_CHECKING
from dotenv import load_dotenv

if TYPE_CHECKING:
    from psycopg2.extensions import connection as Connection
else:
    Connection = Any

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()


class DatabaseConnection:
    """Classe para gerenciar conexões com o banco de dados PostgreSQL"""
    
    _db_config: Optional[Dict[str, Any]] = None
    
    @classmethod
    def get_db_config(cls) -> Dict[str, Any]:
        """Retorna a configuração do banco de dados a partir de variáveis de ambiente ou arquivo JSON"""
        if cls._db_config is None:
            def safe_getenv(key: str, default: str = '') -> str:
                """Obtém variável de ambiente de forma segura, tratando encoding"""
                value = os.getenv(key, default)
                if value is None:
                    return default
                # Se já é string, garantir UTF-8
                if isinstance(value, str):
                    try:
                        # Tentar codificar/decodificar para garantir UTF-8 válido
                        value.encode('utf-8')
                        return value
                    except UnicodeEncodeError:
                        # Se falhar, usar replace para corrigir caracteres inválidos
                        return value.encode('utf-8', errors='replace').decode('utf-8')
                # Se for bytes, decodificar
                if isinstance(value, bytes):
                    try:
                        return value.decode('utf-8')
                    except UnicodeDecodeError:
                        try:
                            return value.decode('latin-1')
                        except UnicodeDecodeError:
                            return value.decode('utf-8', errors='replace')
                return str(value)
            
            # Primeiro, tentar ler das variáveis de ambiente
            host = safe_getenv('DB_HOST')
            port = safe_getenv('DB_PORT')
            # Tentar DB_NAME primeiro, depois POSTGRES_DB como fallback
            database = safe_getenv('DB_NAME') or safe_getenv('POSTGRES_DB')
            user = safe_getenv('DB_USER') or safe_getenv('POSTGRES_USER')
            password = safe_getenv('DB_PASSWORD') or safe_getenv('POSTGRES_PASSWORD')
            # Se port não estiver definido, tentar POSTGRES_PORT
            if not port:
                port = safe_getenv('POSTGRES_PORT')
            
            # Se o host for "postgres" (nome do serviço Docker), verificar se está rodando no Docker
            # Se não estiver no Docker, usar localhost como fallback
            if host == 'postgres':
                import socket
                try:
                    # Tentar resolver o hostname "postgres"
                    socket.gethostbyname('postgres')
                    # Se conseguir resolver, está no Docker, manter "postgres"
                except (socket.gaierror, OSError):
                    # Se não conseguir resolver, não está no Docker, usar localhost
                    print("[AVISO] Hostname 'postgres' não resolvido. Assumindo execução fora do Docker. Usando 'localhost'.")
                    host = 'localhost'
            
            # Se alguma variável não estiver definida, tentar ler do arquivo JSON
            if not host or not database or not user:
                try:
                    # Obter o diretório base (raiz do projeto)
                    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                    config_path = os.path.join(base_dir, 'config', 'database_config.json')
                    
                    if os.path.exists(config_path):
                        with open(config_path, 'r', encoding='utf-8') as f:
                            config_data = json.load(f)
                            db_config_from_json = config_data.get('database', {})
                            
                            # Usar valores do JSON apenas se não estiverem definidos nas variáveis de ambiente
                            if not host:
                                host = db_config_from_json.get('host', 'localhost')
                            if not port:
                                port = str(db_config_from_json.get('port', 5432))
                            if not database:
                                database = db_config_from_json.get('database', 'ManpowerControl')
                            if not user:
                                user = db_config_from_json.get('user', 'postgres')
                            if not password:
                                password = db_config_from_json.get('password', '')
                except Exception as e:
                    # Se houver erro ao ler o JSON, usar valores padrão
                    print(f"[AVISO] Erro ao ler database_config.json: {e}")
                    pass
            
            cls._db_config = {
                'host': host or 'localhost',
                'port': int(port) if port else 5432,
                'database': database or 'ManpowerControl',
                'user': user or 'postgres',
                'password': password or ''
            }
        
        return cls._db_config
    
    @classmethod
    def get_connection(cls) -> Connection:
        """Cria e retorna uma conexão com o banco de dados PostgreSQL"""
        config = cls.get_db_config()
        
        try:
            # Função auxiliar para garantir UTF-8 válido de forma mais robusta
            def ensure_utf8(value: Any) -> str:
                """Garante que o valor seja uma string UTF-8 válida"""
                if value is None:
                    return ''
                
                # Se for bytes, decodificar
                if isinstance(value, bytes):
                    # Tentar UTF-8 primeiro
                    try:
                        return value.decode('utf-8')
                    except UnicodeDecodeError:
                        # Tentar latin-1 (compatível com Windows)
                        try:
                            decoded = value.decode('latin-1')
                            # Re-encodar para UTF-8 para garantir consistência
                            return decoded.encode('utf-8', errors='replace').decode('utf-8')
                        except:
                            return value.decode('utf-8', errors='replace')
                
                # Se for string, garantir que seja UTF-8 válida
                str_value = str(value)
                try:
                    # Tentar codificar para verificar se é UTF-8 válido
                    str_value.encode('utf-8')
                    return str_value
                except UnicodeEncodeError:
                    # Se não for UTF-8 válido, converter usando latin-1 como intermediário
                    try:
                        # Converter para bytes usando latin-1 (não perde dados)
                        bytes_value = str_value.encode('latin-1')
                        # Decodificar para UTF-8
                        return bytes_value.decode('utf-8', errors='replace')
                    except:
                        # Último recurso: usar replace
                        return str_value.encode('utf-8', errors='replace').decode('utf-8')
            
            # Garantir que todos os parâmetros sejam strings seguras
            # Converter para ASCII quando possível, ou UTF-8 válido
            def safe_string(value: Any, default: str = '') -> str:
                """Converte um valor para string ASCII segura"""
                if value is None:
                    return default
                # Se for bytes, decodificar primeiro
                if isinstance(value, bytes):
                    try:
                        value = value.decode('utf-8')
                    except UnicodeDecodeError:
                        try:
                            value = value.decode('latin-1')
                        except:
                            value = value.decode('utf-8', errors='replace')
                # Converter para string
                str_value = str(value)
                # Tentar garantir que seja ASCII ou UTF-8 válido
                try:
                    # Se contém apenas ASCII, retornar direto
                    str_value.encode('ascii')
                    return str_value
                except UnicodeEncodeError:
                    # Se não for ASCII, garantir UTF-8 válido
                    try:
                        return str_value.encode('utf-8', errors='replace').decode('utf-8')
                    except:
                        return default
            
            host = safe_string(config.get('host', 'localhost'), 'localhost')
            database = safe_string(config.get('database', 'ManpowerControl'), 'ManpowerControl')
            user = safe_string(config.get('user', 'postgres'), 'postgres')
            password = safe_string(config.get('password', ''), '')
            
            port = config.get('port', 5432)
            if not isinstance(port, int):
                try:
                    port = int(port)
                except:
                    port = 5432
            
            # Criar conexão usando parâmetros nomeados diretamente
            # Isso evita problemas de encoding com connection strings
            try:
                # Garantir que todos os valores sejam strings simples (não bytes)
                # e que sejam ASCII ou UTF-8 válidos
                conn = psycopg2.connect(
                    host=str(host),
                    port=int(port),
                    database=str(database),
                    user=str(user),
                    password=str(password),
                    connect_timeout=10
                )
                # Configurar encoding após a conexão
                try:
                    conn.set_client_encoding('UTF8')
                except:
                    pass  # Se falhar, continuar mesmo assim
                # Configurar timezone para America/Manaus
                try:
                    cursor = conn.cursor()
                    cursor.execute("SET TIME ZONE 'America/Manaus'")
                    cursor.close()
                except:
                    pass  # Se falhar, continuar mesmo assim
                return conn
            except psycopg2.OperationalError as e:
                # Se falhar e o host não for localhost, tentar com localhost como fallback
                if host != 'localhost' and host != '127.0.0.1':
                    try:
                        print(f"[AVISO] Falha ao conectar em '{host}'. Tentando com 'localhost'...")
                        conn = psycopg2.connect(
                            host='localhost',
                            port=int(port),
                            database=str(database),
                            user=str(user),
                            password=str(password),
                            connect_timeout=10
                        )
                        try:
                            conn.set_client_encoding('UTF8')
                        except:
                            pass
                        # Configurar timezone para America/Manaus
                        try:
                            cursor = conn.cursor()
                            cursor.execute("SET TIME ZONE 'America/Manaus'")
                            cursor.close()
                        except:
                            pass
                        return conn
                    except psycopg2.OperationalError:
                        # Se também falhar com localhost, continuar com o erro original
                        pass
                
                # Erro operacional (servidor não está rodando, credenciais incorretas, etc.)
                try:
                    error_msg = str(e)
                except:
                    error_msg = "Erro ao conectar ao banco de dados PostgreSQL"
                raise Exception(f"Erro ao conectar ao banco de dados PostgreSQL. Verifique se o servidor está rodando e as credenciais estão corretas. Detalhes: {error_msg}")
            except (UnicodeDecodeError, UnicodeEncodeError) as encoding_err:
                # Erro de encoding - tentar com valores mais simples
                try:
                    # Usar valores padrão ASCII seguros
                    conn = psycopg2.connect(
                        host='localhost',
                        port=5432,
                        database='ManpowerControl',
                        user='postgres',
                        password='',
                        connect_timeout=10
                    )
                    return conn
                except:
                    raise Exception("Erro de codificação ao conectar ao banco de dados. Verifique se as credenciais contêm apenas caracteres ASCII.")
            except Exception as e:
                # Outros erros
                try:
                    error_msg = str(e)
                except:
                    error_msg = "Erro desconhecido"
                raise Exception(f"Erro ao conectar ao banco de dados: {error_msg}")
        except UnicodeDecodeError as e:
            # Capturar erro de encoding de forma segura
            try:
                error_repr = repr(e)
                error_msg = error_repr.encode('ascii', errors='replace').decode('ascii')
            except:
                error_msg = "Erro de codificação UTF-8"
            raise Exception(f"Erro de codificação ao conectar ao banco de dados: {error_msg}")
        except UnicodeEncodeError as e:
            try:
                error_repr = repr(e)
                error_msg = error_repr.encode('ascii', errors='replace').decode('ascii')
            except:
                error_msg = "Erro de codificação ao processar credenciais"
            raise Exception(f"Erro de codificação: {error_msg}")
        except psycopg2.OperationalError as e:
            try:
                error_msg = str(e).encode('utf-8', errors='replace').decode('utf-8')
            except:
                error_msg = "Erro de conexão com PostgreSQL"
            raise Exception(f"Erro de conexão com PostgreSQL. Verifique se o servidor está rodando e as credenciais estão corretas: {error_msg}")
        except psycopg2.Error as e:
            try:
                error_msg = str(e).encode('utf-8', errors='replace').decode('utf-8')
            except:
                error_msg = "Erro ao conectar ao banco de dados"
            raise Exception(f"Erro ao conectar ao banco de dados PostgreSQL: {error_msg}")
        except Exception as e:
            # Capturar qualquer outro erro de forma segura
            try:
                error_type = type(e).__name__
                error_msg = f"{error_type}: Erro ao conectar ao banco de dados"
            except:
                error_msg = "Erro desconhecido ao conectar ao banco de dados"
            raise Exception(error_msg)
    
    @classmethod
    def execute_query(
        cls, 
        query: str, 
        params: Optional[Union[Tuple[Any, ...], List[Any]]] = None, 
        fetch_one: bool = False, 
        fetch_all: bool = False
    ) -> Union[Optional[Tuple[Any, ...]], List[Tuple[Any, ...]], int]:
        """
        Executa uma query e retorna o resultado
        
        Args:
            query: Query SQL a ser executada (usa %s como placeholder ao invés de ?)
            params: Parâmetros para a query (tupla ou lista)
            fetch_one: Se True, retorna apenas uma linha
            fetch_all: Se True, retorna todas as linhas
            
        Returns:
            Resultado da query conforme os parâmetros:
            - Optional[Tuple[Any, ...]] se fetch_one=True
            - List[Tuple[Any, ...]] se fetch_all=True
            - int (lastrowid ou RETURNING id) caso contrário
        """
        # Converter placeholders de ? para %s (PostgreSQL usa %s)
        query = query.replace('?', '%s')
        
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            result: Union[Optional[Tuple[Any, ...]], List[Tuple[Any, ...]], int]
            
            if fetch_one:
                result = cursor.fetchone()
            elif fetch_all:
                result = cursor.fetchall() or []
            else:
                # Para INSERT, tentar pegar o ID retornado
                # Se a query tem RETURNING id, usar fetchone
                if 'RETURNING' in query.upper():
                    returned = cursor.fetchone()
                    if returned and isinstance(returned, tuple) and len(returned) > 0:
                        result = returned[0] if isinstance(returned[0], int) else 0
                    else:
                        result = 0
                else:
                    # Para INSERT sem RETURNING, retornar 0
                    # Os modelos devem usar RETURNING id para obter o ID inserido
                    result = 0
            
            # Garantir que o commit seja efetivo
            conn.commit()
            return result
        except psycopg2.ProgrammingError as e:
            conn.rollback()
            raise Exception(f"Erro de sintaxe SQL ou tabela não encontrada: {str(e)}")
        except psycopg2.OperationalError as e:
            conn.rollback()
            raise Exception(f"Erro operacional (tabela não existe?): {str(e)}")
        except psycopg2.Error as e:
            conn.rollback()
            raise Exception(f"Erro ao executar query: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    @classmethod
    def table_exists(cls, table_name: str) -> bool:
        """Verifica se uma tabela existe no banco de dados"""
        query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            )
        """
        result = cls.execute_query(query, (table_name,), fetch_one=True)
        if result and isinstance(result, tuple) and len(result) > 0:
            return bool(result[0])
        return False
    
    @classmethod
    def column_exists(cls, table_name: str, column_name: str) -> bool:
        """Verifica se uma coluna existe em uma tabela"""
        query = """
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = %s 
                AND column_name = %s
            )
        """
        result = cls.execute_query(query, (table_name, column_name), fetch_one=True)
        if result and isinstance(result, tuple) and len(result) > 0:
            return bool(result[0])
        return False

    # Usuários padrão (senhas SHA-256): admin123, operador123, master123
    _DEFAULT_USUARIOS = (
        ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrador', 'admin'),
        ('operador', '1725165c9a0b3698a3d01016e0d8205155820b8d7f21835ca64c0f81c728d880', 'Operador RFID', 'operador'),
        ('master', 'e7bc2f973afb8dfaf00fadfb19596741108be08ab4a107c6a799c429b684c64a', 'Master User', 'master'),
    )

    @classmethod
    def ensure_default_usuarios(cls) -> None:
        """Garante que os usuários padrão (admin, operador, master) existam. Chamado na subida do Server."""
        try:
            if not cls.table_exists('usuarios'):
                return
            for username, senha_hash, nome, role in cls._DEFAULT_USUARIOS:
                q = "SELECT 1 FROM usuarios WHERE username = %s"
                r = cls.execute_query(q, (username,), fetch_one=True)
                if not r or not r[0]:
                    ins = """
                        INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
                        VALUES (%s, %s, %s, %s, TRUE)
                        ON CONFLICT (username) DO UPDATE SET
                          senha_hash = EXCLUDED.senha_hash,
                          nome = EXCLUDED.nome,
                          role = EXCLUDED.role,
                          ativo = EXCLUDED.ativo,
                          data_atualizacao = CURRENT_TIMESTAMP
                    """
                    cls.execute_query(ins, (username, senha_hash, nome, role))
        except Exception as e:
            try:
                msg = str(e).encode('utf-8', errors='replace').decode('utf-8')
            except Exception:
                msg = "Erro ao garantir usuários padrão"
            print(f"[AVISO] ensure_default_usuarios: {msg}")

    @classmethod
    def fix_cancelamentos_fk(cls) -> None:
        """
        Remove a FK constraint problemática da tabela operacoes_canceladas.
        
        O problema: A FK com ON DELETE CASCADE deletava os cancelamentos
        quando o registro original era removido de registros_producao.
        
        Solução: Remover a FK pois o registro_id é apenas uma referência
        histórica e o registro original será deletado após o cancelamento.
        """
        try:
            if not cls.table_exists('operacoes_canceladas'):
                return
            
            conn = cls.get_connection()
            cursor = conn.cursor()
            
            try:
                # Verificar se existe FK para registros_producao
                cursor.execute("""
                    SELECT conname 
                    FROM pg_constraint 
                    WHERE conrelid = 'operacoes_canceladas'::regclass 
                    AND confrelid = 'registros_producao'::regclass
                """)
                result = cursor.fetchone()
                
                if result:
                    constraint_name = result[0]
                    # Remover a constraint
                    cursor.execute(f"ALTER TABLE operacoes_canceladas DROP CONSTRAINT {constraint_name}")
                    conn.commit()
                    print(f"[MIGRAÇÃO] FK constraint '{constraint_name}' removida da tabela operacoes_canceladas")
                
            except Exception as e:
                conn.rollback()
                print(f"[AVISO] Erro ao remover FK de operacoes_canceladas: {e}")
            finally:
                cursor.close()
                conn.close()
                
        except Exception as e:
            print(f"[AVISO] fix_cancelamentos_fk: {e}")

    @classmethod
    def ensure_dispositivo_nome_column(cls) -> None:
        """
        Garante que a coluna dispositivo_nome exista na tabela registros_producao.
        Esta coluna armazena o nome do dispositivo Raspberry diretamente no registro.
        """
        try:
            if not cls.table_exists('registros_producao'):
                return
            
            if cls.column_exists('registros_producao', 'dispositivo_nome'):
                return  # Coluna já existe
            
            conn = cls.get_connection()
            cursor = conn.cursor()
            
            try:
                # Adicionar a coluna
                cursor.execute("ALTER TABLE registros_producao ADD COLUMN dispositivo_nome TEXT")
                conn.commit()
                print("[MIGRAÇÃO] Coluna dispositivo_nome adicionada à tabela registros_producao")
                
                # Atualizar registros existentes com o nome do dispositivo da operação
                cursor.execute("""
                    UPDATE registros_producao r
                    SET dispositivo_nome = (
                        SELECT STRING_AGG(DISTINCT ot.toten_nome, ', ')
                        FROM operacao_totens ot
                        WHERE ot.operacao_id = r.operacao_id
                    )
                    WHERE r.dispositivo_nome IS NULL 
                    AND r.operacao_id IS NOT NULL
                    AND EXISTS (
                        SELECT 1 FROM operacao_totens ot WHERE ot.operacao_id = r.operacao_id
                    )
                """)
                conn.commit()
                print("[MIGRAÇÃO] Registros existentes atualizados com nome do dispositivo")
                
            except Exception as e:
                conn.rollback()
                print(f"[AVISO] Erro ao adicionar coluna dispositivo_nome: {e}")
            finally:
                cursor.close()
                conn.close()
                
        except Exception as e:
            print(f"[AVISO] ensure_dispositivo_nome_column: {e}")
