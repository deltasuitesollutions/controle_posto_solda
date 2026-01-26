from typing import Tuple, Union
from flask import Blueprint, Response, request, jsonify
from Server.services import csv_service

try:
    from Server.services import excel_service
except ImportError:
    excel_service = None

csv_bp = Blueprint('csv', __name__, url_prefix='/api/exportar')

#CSV
@csv_bp.route('/csv', methods=['GET'])
def exportar_csv() -> Union[Response, Tuple[Response, int]]:
    try:
        csv_content = csv_service.exportar_registros_csv(
            data_inicio=request.args.get('data_inicio'),
            data_fim=request.args.get('data_fim'),
            posto=request.args.get('posto'),
        )
        
        nome_arquivo = csv_service.gerar_nome_arquivo()
        if not nome_arquivo.endswith('.csv'):
            nome_arquivo = nome_arquivo.rstrip('_') + '.csv'
        
        if isinstance(csv_content, bytes):
            csv_bytes = csv_content
        else:
            csv_bytes = '\ufeff'.encode('utf-8') + csv_content.encode('utf-8')
        
        response = Response(csv_bytes, mimetype='text/csv; charset=utf-8')
        response.headers['Content-Disposition'] = f'attachment; filename="{nome_arquivo}"'
        return response
        
    except Exception as e:
        print(f"Erro ao exportar CSV: {e}")
        return jsonify({"error": str(e)}), 500

# EXCEL
@csv_bp.route('/excel', methods=['GET'])
def exportar_excel() -> Union[Response, Tuple[Response, int]]:
    if excel_service is None:
        return jsonify({"error": "Biblioteca openpyxl não instalada"}), 500
    
    try:
        excel_file = excel_service.exportar_registros_excel(
            data_inicio=request.args.get('data_inicio'),
            data_fim=request.args.get('data_fim'),
            posto=request.args.get('posto'),
        )
        
        nome_arquivo = excel_service.gerar_nome_arquivo_excel()
        
        response = Response(
            excel_file.read(),
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response.headers['Content-Disposition'] = f'attachment; filename="{nome_arquivo}"'
        return response
        
    except Exception as e:
        print(f"Erro ao exportar Excel: {e}")
        return jsonify({"error": str(e)}), 500

