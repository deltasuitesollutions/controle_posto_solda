import logging
from flask import Flask

logger = logging.getLogger(__name__)

# BLUEPRINTS DA APLICAÇÃO
def register_blueprints(app: Flask):
    from Server.controller import (
        producao_controller,
        registros_controller,
        tags_controller,
        csv_controller,
        funcionarios_controller,
        modelos_controller,
        pecas_controller,
        produto_controller,
        linha_controller,
        sublinha_controller,
        posto_controller,
        operacao_controller,
        ihm_controller,
        dashboard_controller,
        usuarios_controller,
        cancelamento_controller,
        tags_temporarias_controller,
        dispositivo_raspberry_controller
    )
    
    app.register_blueprint(producao_controller.producao_bp)
    app.register_blueprint(registros_controller.registros_bp)
    app.register_blueprint(tags_controller.tags_bp)
    app.register_blueprint(csv_controller.csv_bp)
    app.register_blueprint(funcionarios_controller.funcionarios_bp)
    app.register_blueprint(modelos_controller.modelos_bp)
    app.register_blueprint(pecas_controller.pecas_bp)
    app.register_blueprint(produto_controller.produtos_bp)
    app.register_blueprint(linha_controller.linhas_bp)
    app.register_blueprint(sublinha_controller.sublinhas_bp)
    app.register_blueprint(posto_controller.postos_bp)
    app.register_blueprint(operacao_controller.operacoes_bp)
    app.register_blueprint(ihm_controller.ihm_bp)
    app.register_blueprint(dashboard_controller.dashboard_bp)
    app.register_blueprint(usuarios_controller.usuarios_bp)
    app.register_blueprint(cancelamento_controller.cancelamento_bp)
    app.register_blueprint(tags_temporarias_controller.tags_temporarias_bp)
    app.register_blueprint(dispositivo_raspberry_controller.dispositivo_raspberry_bp)
    
    logger.info(f"Registrados {len(app.blueprints)} blueprints")

