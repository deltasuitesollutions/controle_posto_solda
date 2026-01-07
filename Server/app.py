"""
Aplicação Flask - Motor principal 

"""
import os
import sys
import secrets
import logging
from datetime import timedelta
from pathlib import Path
from typing import Optional

from flask import Flask, send_from_directory, abort
from flask_cors import CORS


def get_base_dir() -> Path:
   return Path(__file__).parent.parent.resolve()


def setup_python_path(base_dir: Path) -> None:
    """
    Configura o Python path para incluir o diretório base.
    
    Args:
        base_dir: Diretório base do projeto
    """
    base_dir_str = str(base_dir)
    if base_dir_str not in sys.path:
        sys.path.insert(0, base_dir_str)


# Inicializar paths
BASE_DIR = get_base_dir()
setup_python_path(BASE_DIR)
WEB_DIR = BASE_DIR / 'Web' / 'dist'

def setup_logging() -> None:
    """Configura o sistema de logging da aplicação."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def inicializar_banco_dados() -> bool:
    logger = logging.getLogger(__name__)
    
    try:
        from Server.models.database import DatabaseConnection
        conn = DatabaseConnection.get_connection()
        conn.close()
        logger.info("✓ Conexão com banco de dados PostgreSQL estabelecida!")
        return True
    except Exception as e:
        logger.warning(f"Banco de dados não encontrado ou não acessível: {e}")
        logger.info("Tentando criar banco de dados automaticamente...")
        
        try:
            from database.setup_database import criar_banco_dados
            original_dir = os.getcwd()
            os.chdir(BASE_DIR)
            criar_banco_dados(force_recreate=False)
            os.chdir(original_dir)
            logger.info("✓ Banco de dados criado com sucesso!")
            return True
        except Exception as setup_error:
            logger.error(f"Falha ao criar banco de dados: {setup_error}")
            logger.info("Execute manualmente: python database/setup_database.py")
            logger.info("Certifique-se de que o PostgreSQL está rodando e o banco 'ManpowerControl' existe")
            return False


def create_app(config: Optional[dict] = None) -> Flask:
    app = Flask(__name__)
    
    # Configurações de segurança
    app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    
    # Configurações adicionais
    if config:
        app.config.update(config)
    
    # Configurar CORS
    configure_cors(app)
    
    # Registrar blueprints
    register_blueprints(app)
    
    # Registrar rotas do Web (SPA)
    register_web_routes(app)
    
    return app


def configure_cors(app: Flask) -> None:
    
    # Configura CORS para a aplicação Flask.
    try:
        CORS(app, supports_credentials=True)
    except ImportError:
        logging.warning("flask-cors não instalado. CORS não estará disponível.")


def register_blueprints(app: Flask) -> None:
    
    # Registra todos os blueprints dos controllers na aplicação.
    try:
        from Server.controller import (
            producao_controller,
            registros_controller,
            tags_controller,
            csv_controller,
            funcionarios_controller,
            modelos_controller,
            limpeza_controller,
            posto_configuracao_controller,
            auth_controller
        )
        
        # Registrar blueprints em ordem lógica
        blueprints = [
            (auth_controller.auth_bp, 'Autenticação'),
            (producao_controller.producao_bp, 'Produção'),
            (registros_controller.registros_bp, 'Registros'),
            (tags_controller.tags_bp, 'Tags RFID'),
            (csv_controller.csv_bp, 'Exportação CSV'),
            (funcionarios_controller.funcionarios_bp, 'Funcionários'),
            (modelos_controller.modelos_bp, 'Modelos'),
            (limpeza_controller.limpeza_bp, 'Limpeza'),
            (posto_configuracao_controller.posto_configuracao_bp, 'Configuração de Postos'),
        ]
        
        for blueprint, name in blueprints:
            app.register_blueprint(blueprint)
            logging.debug(f"Blueprint '{name}' registrado: {blueprint.url_prefix}")
            
        logging.info(f"Total de {len(blueprints)} blueprints registrados")
        
    except ImportError as e:
        logging.error(f"Erro ao importar controllers: {e}")
        raise


def register_web_routes(app: Flask) -> None:
    """
    Registra rotas para servir arquivos estáticos do Web (SPA).
    
    Args:
        app: Instância da aplicação Flask
    """
    @app.route('/', defaults={'filename': 'index.html'})
    @app.route('/<path:filename>')
    def serve_web_files(filename: str):
        """
        Serve arquivos estáticos da pasta Web/dist buildada.
        
        Para SPAs (Single Page Applications), todas as rotas não encontradas
        são redirecionadas para index.html, permitindo que o React Router
        funcione corretamente.
        
        Args:
            filename: Caminho do arquivo solicitado
            
        Returns:
            Response: Arquivo solicitado ou index.html para rotas do SPA
        """
        # Ignora requisições para /api (são tratadas pelos blueprints)
        if filename.startswith('api/'):
            abort(404, description="Rota API não encontrada")
        
        try:
            file_path = WEB_DIR / filename
            file_path = file_path.resolve()
            
            # Verificação de segurança: garantir que o arquivo está dentro do diretório Web/dist
            try:
                file_path.relative_to(WEB_DIR.resolve())
            except ValueError:
                abort(403, description="Acesso negado")
            
            # Se o arquivo existe, servir diretamente
            if file_path.exists() and file_path.is_file():
                return send_from_directory(str(WEB_DIR), filename)
            
            # Para SPAs, redirecionar todas as rotas não encontradas para index.html
            # Isso permite que o React Router funcione corretamente
            index_path = WEB_DIR / 'index.html'
            if index_path.exists():
                return send_from_directory(str(WEB_DIR), 'index.html')
            
            abort(404, description=f"Arquivo não encontrado: {filename}")
            
        except Exception as e:
            logging.error(f"Erro ao servir arquivo {filename}: {e}")
            abort(500, description=f"Erro ao carregar arquivo: {str(e)}")


# ============================================================================
# Inicialização da Aplicação
# ============================================================================

def main() -> None:
    """Função principal para inicializar e executar a aplicação."""
    # Configurar logging
    setup_logging()
    logger = logging.getLogger(__name__)
    
    # Inicializar banco de dados
    if not inicializar_banco_dados():
        logger.warning("Banco de dados não foi inicializado. A aplicação pode não funcionar corretamente.")
    
    # Criar aplicação
    app = create_app()
    
    # Configurações do servidor de desenvolvimento
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '8000'))
    debug = os.getenv('FLASK_ENV') != 'production'
    
    logger.info(f"Iniciando servidor Flask em http://{host}:{port}")
    logger.info(f"Modo debug: {debug}")
    logger.info(f"Web dir: {WEB_DIR}")
    logger.info(f"Web dir existe: {WEB_DIR.exists()}")
    
    # Executar aplicação
    app.run(debug=debug, host=host, port=port)


# ============================================================================
# Instância Global da Aplicação
# ============================================================================

# Criar instância da aplicação para uso em outros módulos
app = create_app()

# Inicializar banco de dados na importação (apenas se não estiver em modo de teste)
if __name__ != '__main__' and os.getenv('FLASK_ENV') != 'test':
    setup_logging()
    inicializar_banco_dados()


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == '__main__':
    main()
