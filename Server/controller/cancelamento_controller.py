"""
Controller para gerenciar cancelamentos de operações
"""
from flask import Blueprint, jsonify, request
from Server.services import cancelamento_service
from Server.utils.audit_helper import obter_usuario_id_da_requisicao
from typing import Union, Tuple

cancelamento_bp = Blueprint('cancelamento', __name__, url_prefix='/api/cancelamentos')


@cancelamento_bp.route('/operacoes-iniciadas', methods=['GET'])
def listar_operacoes_iniciadas() -> Union[dict, Tuple[dict, int]]:
    """Lista operações iniciadas por dia"""
    try:
        data = request.args.get('data', type=str)
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        resultado = cancelamento_service.listar_operacoes_iniciadas_por_dia(
            data=data,
            limit=limit,
            offset=offset
        )
        
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@cancelamento_bp.route('', methods=['POST'])
def cancelar_operacao() -> Union[dict, Tuple[dict, int]]:
    """Cancela uma operação"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"erro": "Dados não enviados"}), 400
        
        registro_id = data.get('registro_id')
        motivo = data.get('motivo')
        
        if not registro_id:
            return jsonify({"erro": "ID do registro é obrigatório"}), 400
        
        if not motivo or not motivo.strip():
            return jsonify({"erro": "Motivo do cancelamento é obrigatório"}), 400
        
        usuario_id = obter_usuario_id_da_requisicao()
        
        resultado = cancelamento_service.cancelar_operacao(
            registro_id=registro_id,
            motivo=motivo.strip(),
            cancelado_por_usuario_id=usuario_id
        )
        
        return jsonify(resultado), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@cancelamento_bp.route('', methods=['GET'])
def listar_cancelamentos() -> Union[dict, Tuple[dict, int]]:
    """Lista cancelamentos com filtros"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        data_inicio = request.args.get('data_inicio', type=str)
        data_fim = request.args.get('data_fim', type=str)
        
        resultado = cancelamento_service.listar_cancelamentos(
            limit=limit,
            offset=offset,
            data_inicio=data_inicio,
            data_fim=data_fim
        )
        
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@cancelamento_bp.route('/exportar-csv', methods=['GET'])
def exportar_cancelamentos_csv() -> Union[dict, Tuple[dict, int]]:
    """Exporta cancelamentos em formato CSV"""
    try:
        data_inicio = request.args.get('data_inicio', type=str)
        data_fim = request.args.get('data_fim', type=str)
        
        # Buscar todos os cancelamentos (sem limite)
        resultado = cancelamento_service.listar_cancelamentos(
            limit=10000,  # Limite alto para exportação
            offset=0,
            data_inicio=data_inicio,
            data_fim=data_fim
        )
        
        cancelamentos = resultado.get('cancelamentos', [])
        
        # Criar CSV
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Cabeçalho
        writer.writerow([
            'ID Cancelamento',
            'ID Registro',
            'Data Início',
            'Hora Início',
            'Funcionário',
            'Matrícula',
            'Posto',
            'Modelo',
            'Código Modelo',
            'Operação',
            'Quantidade',
            'Motivo Cancelamento',
            'Cancelado Por',
            'Data Cancelamento'
        ])
        
        # Dados
        for cancelamento in cancelamentos:
            writer.writerow([
                cancelamento.get('id', ''),
                cancelamento.get('registro_id', ''),
                cancelamento.get('data_inicio', ''),
                cancelamento.get('hora_inicio', ''),
                cancelamento.get('funcionario', {}).get('nome', '') if cancelamento.get('funcionario') else '',
                cancelamento.get('funcionario', {}).get('matricula', '') if cancelamento.get('funcionario') else '',
                cancelamento.get('posto', {}).get('nome', '') if cancelamento.get('posto') else '',
                cancelamento.get('modelo', {}).get('nome', '') if cancelamento.get('modelo') else '',
                cancelamento.get('modelo', {}).get('codigo', '') if cancelamento.get('modelo') else '',
                cancelamento.get('operacao', {}).get('nome', '') if cancelamento.get('operacao') else '',
                cancelamento.get('quantidade', ''),
                cancelamento.get('motivo', ''),
                cancelamento.get('usuario_cancelou', {}).get('nome', '') if cancelamento.get('usuario_cancelou') else '',
                cancelamento.get('data_cancelamento', '')
            ])
        
        from flask import Response
        response = Response(
            '\ufeff' + output.getvalue(),  # BOM para Excel
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename=cancelamentos_{data_inicio or "todos"}.csv'
            }
        )
        
        return response
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

