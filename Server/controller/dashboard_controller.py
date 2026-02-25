from flask import Blueprint, jsonify
from Server.services import dashboard_service

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('', methods=['GET'])
def obter_dados_dashboard():
    """
    Retorna os dados do dashboard com informações dos postos em uso
    """
    try:
        resultado = dashboard_service.buscar_postos_em_uso()
        return jsonify(resultado), 200
    except Exception as e:
        print(f'Erro ao obter dados do dashboard: {e}')
        return jsonify({'erro': 'Erro ao obter dados do dashboard'}), 500

