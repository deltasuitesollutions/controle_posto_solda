"""
Controller para rotas de produção
"""
from typing import Union, Tuple
from flask import Blueprint, jsonify, request, Response
from Server.services import producao_service

producao_bp = Blueprint('producao', __name__, url_prefix='/api/producao')


@producao_bp.route('/entrada', methods=['POST'])
def registrar_entrada() -> Union[Response, Tuple[Response, int]]:
    """Registra entrada do operador na cabine"""
    data = request.json
    
    if not data or not data.get('posto'):
        return jsonify({
            "status": "error", 
            "message": "Campo obrigatório: posto"
        }), 400
    
    try:
        resultado = producao_service.registrar_entrada(
            posto=data['posto'],
            funcionario_matricula=data.get('funcionario_matricula'),
            produto=data.get('produto'),
            modelo_codigo=data.get('modelo_codigo'),
            operacao=data.get('operacao'),
            peca=data.get('peca'),
            codigo=data.get('codigo'),
            quantidade=data.get('quantidade')
        )
        
        # Notificar mudança via WebSocket
        try:
            from Server.websocket_manager import enviar_atualizacao_dashboard
            enviar_atualizacao_dashboard()
        except Exception as ws_error:
            print(f"Erro ao notificar via WebSocket: {ws_error}")
        
        return jsonify({
            "status": "success", 
            "message": f"Entrada registrada para {resultado.get('funcionario_matricula', 'operador')}",
            **resultado
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@producao_bp.route('/saida', methods=['POST'])
def registrar_saida() -> Union[Response, Tuple[Response, int]]:
    """Registra saída do operador da cabine"""
    data = request.json
    
    if not data:
        return jsonify({
            "status": "error",
            "message": "Dados não fornecidos"
        }), 400
    
    if not data.get('registro_id') and (not data.get('posto') or not data.get('funcionario_matricula')):
        return jsonify({
            "status": "error",
            "message": "É necessário fornecer registro_id ou posto/funcionario_matricula"
        }), 400
    
    try:
        resultado = producao_service.registrar_saida(
            registro_id=data.get('registro_id'),
            posto=data.get('posto'),
            funcionario_matricula=data.get('funcionario_matricula'),
            quantidade=data.get('quantidade')
        )
        
        # Notificar mudança via WebSocket
        try:
            from Server.websocket_manager import enviar_atualizacao_dashboard
            enviar_atualizacao_dashboard()
        except Exception as ws_error:
            print(f"Erro ao notificar via WebSocket: {ws_error}")
        
        return jsonify({
            "status": "success", 
            "message": f"Saída registrada para registro {resultado['registro_id']}",
            **resultado
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@producao_bp.route('/registro-aberto', methods=['GET'])
def buscar_registro_aberto() -> Union[Response, Tuple[Response, int]]:
    """Busca registro aberto para um posto e funcionário"""
    posto = request.args.get('posto')
    funcionario_matricula = request.args.get('funcionario_matricula')
    
    if not posto or not funcionario_matricula:
        return jsonify({
            "status": "error",
            "message": "É necessário fornecer posto e funcionario_matricula"
        }), 400
    
    try:
        resultado = producao_service.buscar_registro_aberto(
            posto=posto,
            funcionario_matricula=funcionario_matricula
        )
        
        return jsonify({
            "status": "success",
            "registro": resultado
        })
    except Exception as e:
        if "Nenhum registro" in str(e):
            return jsonify({
                "status": "success",
                "registro": None
            })
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@producao_bp.route('/', methods=['POST'])
def registrar_producao() -> Union[Response, Tuple[Response, int]]:
    """Endpoint de compatibilidade - registra entrada"""
    return registrar_entrada()
