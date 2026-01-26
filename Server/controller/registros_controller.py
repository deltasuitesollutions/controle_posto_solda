from typing import Tuple, Union
from flask import Blueprint, jsonify, request, Response
from Server.services import registro_service

registros_bp = Blueprint('registros', __name__, url_prefix='/api/registros')

# LISTAR
@registros_bp.route('', methods=['GET'])
def listar_registros() -> Union[Response, Tuple[Response, int]]:
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        data_filtro = request.args.get('data')
        posto_filtro = request.args.get('posto')
        operacao_filtro = request.args.get('operacao')
        turno_filtro = request.args.get('turno')
        hora_inicio_filtro = request.args.get('hora_inicio')
        hora_fim_filtro = request.args.get('hora_fim')
        
        turnos_list = None
        if turno_filtro:
            if isinstance(turno_filtro, str):
                turnos_list = [t.strip() for t in turno_filtro.split(',') if t.strip()]
            elif isinstance(turno_filtro, list):
                turnos_list = turno_filtro
        
        resultado = registro_service.listar_registros(
            limit=limit,
            offset=offset,
            data=data_filtro,
            posto=posto_filtro,
            operacao=operacao_filtro,
            turno=turnos_list,
            hora_inicio=hora_inicio_filtro,
            hora_fim=hora_fim_filtro
        )
        
        return jsonify(resultado)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao listar registros: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500

# ATUALIZAR COMENTÁRIO
@registros_bp.route('/<int:registro_id>/comentario', methods=['PUT'])
def atualizar_comentario_registro(registro_id: int) -> Union[Response, Tuple[Response, int]]:
    try:
        data = request.get_json()
        comentario = data.get('comentario', '') if data else ''
        
        resultado = registro_service.atualizar_comentario(registro_id, comentario)
        
        # Notificar mudança via WebSocket
        try:
            from Server.websocket_manager import enviar_atualizacao_dashboard
            enviar_atualizacao_dashboard()
        except Exception as ws_error:
            print(f"Erro ao notificar via WebSocket: {ws_error}")
        
        return jsonify(resultado), 200
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro ao atualizar comentário: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500

