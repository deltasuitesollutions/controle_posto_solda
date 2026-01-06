"""
Controller para rotas de produção
"""
from typing import Dict, Any, Tuple, Optional, Union
from flask import Blueprint, jsonify, request, Response
from backend.services import producao_service

producao_bp = Blueprint('producao', __name__, url_prefix='/api/producao')

@producao_bp.route('/entrada', methods=['POST'])
def registrar_entrada() -> Union[Response, Tuple[Response, int]]:
    """Registra entrada do operador na cabine
    
    Se funcionario_matricula ou modelo_codigo não forem fornecidos,
    o sistema busca da configuração do posto.
    """
    try:
        data: Optional[Dict[str, Any]] = request.json
        
        if not data or not data.get('posto'):
            return jsonify({
                "status": "error", 
                "message": "Campo obrigatório: posto"
            }), 400
        
        resultado = producao_service.registrar_entrada(
            posto=data['posto'],
            funcionario_matricula=data.get('funcionario_matricula'),
            produto=data.get('produto'),
            modelo_codigo=data.get('modelo_codigo')  # Compatibilidade
        )
        
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
    try:
        data: Optional[Dict[str, Any]] = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Dados não fornecidos"
            }), 400
        
        # Validação de que pelo menos registro_id ou posto/funcionario_matricula foram fornecidos
        if not data.get('registro_id') and (not data.get('posto') or not data.get('funcionario_matricula')):
            return jsonify({
                "status": "error",
                "message": "É necessário fornecer registro_id ou posto/funcionario_matricula"
            }), 400
        
        resultado = producao_service.registrar_saida(
            registro_id=data.get('registro_id'),
            posto=data.get('posto'),
            funcionario_matricula=data.get('funcionario_matricula')
        )
        
        return jsonify({
            "status": "success", 
            "message": f"Saída registrada para registro {resultado['registro_id']}",
            **resultado
        })
        
    except Exception as e:
        import traceback
        print(f"Erro ao registrar saída: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@producao_bp.route('/', methods=['POST'])
def registrar_producao() -> Union[Response, Tuple[Response, int]]:
    """Endpoint de compatibilidade - registra entrada"""
    return registrar_entrada()

