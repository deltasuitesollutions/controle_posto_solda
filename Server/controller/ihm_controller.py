"""
Controller para rotas do IHM (Interface Homem-Máquina)
"""
from typing import Dict, Any, Union, Tuple
from flask import Blueprint, jsonify, request, Response
from Server.services import funcionarios_service, modelos_service, producao_service
from Server.models import Funcionario, Modelo

ihm_bp = Blueprint('ihm', __name__, url_prefix='/api/ihm')


@ihm_bp.route('/validar-rfid', methods=['POST'])
def validar_rfid() -> Union[Response, Tuple[Response, int]]:
    """Valida um código RFID e retorna informações do funcionário
    
    Request body:
    {
        "codigo": "123456"
    }
    
    Response (sucesso):
    {
        "status": "success",
        "funcionario": {
            "nome": "João Silva",
            "matricula": "12345",
            "tag_id": "123456"
        }
    }
    
    Response (erro):
    {
        "status": "error",
        "message": "Tag RFID não encontrada ou funcionário inativo"
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('codigo'):
            return jsonify({
                "status": "error",
                "message": "Código RFID não fornecido"
            }), 400
        
        codigo = data.get('codigo', '').strip()
        
        # Buscar funcionário pela tag
        funcionario = funcionarios_service.buscar_funcionario_por_tag(codigo)
        
        if not funcionario:
            return jsonify({
                "status": "error",
                "message": "Tag RFID não encontrada ou não associada a nenhum funcionário"
            }), 404
        
        # Verificar se funcionário está ativo
        if not funcionario.get('ativo', True):
            return jsonify({
                "status": "error",
                "message": "Funcionário inativo. Verifique a liberação com o seu líder"
            }), 403
        
        return jsonify({
            "status": "success",
            "funcionario": {
                "nome": funcionario.get('nome'),
                "matricula": funcionario.get('matricula'),
                "tag_id": funcionario.get('tag_id') or funcionario.get('tag')
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@ihm_bp.route('/operacoes', methods=['GET'])
def listar_operacoes_ihm() -> Union[Response, Tuple[Response, int]]:
    """Lista todas as operações cadastradas no formato esperado pelo IHM
    
    Response:
    [
        {
            "codigo": "OP001",
            "nome": "Operação 1",
            "posto": "P1"
        }
    ]
    """
    try:
        from Server.services import operacao_service
        
        operacoes = operacao_service.listar_operacoes()
        
        # Debug: verificar se operações foram retornadas
        print(f"[IHM] Operações retornadas: {len(operacoes) if operacoes else 0}")
        
        # Formatar para o formato esperado pelo IHM
        # Usar o campo 'operacao' que contém o codigo_operacao
        operacoes_formatadas = []
        operacoes_unicas = set()  # Para evitar duplicatas
        
        for op in operacoes:
            codigo_operacao = op.get('operacao', '')
            posto = op.get('posto', '')
            if codigo_operacao and codigo_operacao not in operacoes_unicas:
                operacoes_unicas.add(codigo_operacao)
                operacoes_formatadas.append({
                    "codigo": codigo_operacao,
                    "nome": codigo_operacao,
                    "posto": posto  # Incluir o posto na resposta
                })
        
        # Ordenar por código
        operacoes_formatadas.sort(key=lambda x: x['codigo'])
        
        print(f"[IHM] Operações formatadas: {len(operacoes_formatadas)}")
        
        return jsonify(operacoes_formatadas)
        
    except Exception as e:
        import traceback
        print(f"[IHM] Erro ao listar operações: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@ihm_bp.route('/postos', methods=['GET'])
def listar_postos_ihm() -> Union[Response, Tuple[Response, int]]:
    """Lista todos os postos no formato esperado pelo IHM
    
    Response:
    [
        {
            "codigo": "P1",
            "nome": "P1"
        }
    ]
    """
    try:
        from Server.services import posto_service
        
        postos = posto_service.listar_postos()
        
        # Formatar para o formato esperado pelo IHM
        postos_formatados = []
        for posto in postos:
            nome = posto.get('nome', '')
            postos_formatados.append({
                "codigo": nome,
                "nome": nome
            })
        
        return jsonify(postos_formatados)
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@ihm_bp.route('/produtos', methods=['GET'])
def listar_produtos_ihm() -> Union[Response, Tuple[Response, int]]:
    """Lista todos os produtos no formato esperado pelo IHM
    
    Response:
    [
        {
            "id": "1",
            "codigo": "PROD001",
            "nome": "Produto 1"
        }
    ]
    """
    try:
        from Server.services import produto_service
        
        produtos = produto_service.listar_produtos()
        
        # Formatar para o formato esperado pelo IHM
        produtos_formatados = []
        for produto in produtos:
            produtos_formatados.append({
                "id": str(produto.get('id', '')),
                "codigo": produto.get('nome', ''),
                "nome": produto.get('nome', '')
            })
        
        return jsonify(produtos_formatados)
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@ihm_bp.route('/modelos', methods=['GET'])
def listar_modelos_ihm() -> Union[Response, Tuple[Response, int]]:
    """Lista todos os modelos com seus subprodutos (peças) no formato esperado pelo IHM
    
    Response:
    [
        {
            "id": "1",
            "codigo": "MOD001",
            "descricao": "Modelo 1",
            "subprodutos": [
                {
                    "id": "1",
                    "codigo": "PEC001",
                    "descricao": "Peça 1"
                }
            ]
        }
    ]
    """
    try:
        modelos = modelos_service.listar_modelos()
        
        # Debug: verificar se modelos foram retornados
        print(f"[IHM] Modelos retornados: {len(modelos) if modelos else 0}")
        
        # Formatar para o formato esperado pelo IHM
        modelos_formatados = []
        for modelo in modelos:
            # Converter peças para subprodutos
            subprodutos = []
            pecas = modelo.get('pecas', [])
            
            for peca in pecas:
                subprodutos.append({
                    "id": str(peca.get('id', '')),
                    "codigo": peca.get('codigo', ''),
                    "descricao": peca.get('nome', peca.get('codigo', ''))
                })
            
            modelos_formatados.append({
                "id": str(modelo.get('id', '')),
                "codigo": modelo.get('codigo', modelo.get('nome', '')),
                "descricao": modelo.get('nome', modelo.get('codigo', '')),
                "subprodutos": subprodutos
            })
        
        print(f"[IHM] Modelos formatados: {len(modelos_formatados)}")
        
        return jsonify(modelos_formatados)
        
    except Exception as e:
        import traceback
        print(f"[IHM] Erro ao listar modelos: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@ihm_bp.route('/registrar-producao', methods=['POST'])
def registrar_producao_ihm() -> Union[Response, Tuple[Response, int]]:
    """Registra produção do IHM
    
    Request body:
    {
        "operacao": "P1",  // posto
        "produto": "PROD001",  // código do produto
        "modelo": "MOD001",  // código do modelo
        "peca": "PEC001",  // código da peça
        "codigo": "PEC001",  // código (mesmo da peça)
        "quantidade": 10,
        "operador": "João Silva"  // nome do operador
    }
    
    Response:
    {
        "status": "success",
        "message": "Produção registrada com sucesso",
        "registro_id": 123
    }
    """
    try:
        data = request.get_json()
        
        # Validações
        if not data:
            return jsonify({
                "status": "error",
                "message": "Dados não fornecidos"
            }), 400
        
        codigo_operacao = data.get('operacao')  # código da operação cadastrada
        produto = data.get('produto')
        modelo = data.get('modelo')
        peca = data.get('peca')
        codigo = data.get('codigo')
        quantidade = data.get('quantidade')
        operador = data.get('operador')
        
        # Validações obrigatórias
        if not codigo_operacao:
            return jsonify({
                "status": "error",
                "message": "Operação é obrigatória"
            }), 400
        
        # Buscar a operação cadastrada para obter o posto associado
        from Server.services import operacao_service
        from Server.models.operacao import Operacao
        
        # Buscar operação pelo código
        operacoes = operacao_service.listar_operacoes()
        operacao_encontrada = None
        for op in operacoes:
            if op.get('operacao') == codigo_operacao:
                operacao_encontrada = op
                break
        
        if not operacao_encontrada:
            return jsonify({
                "status": "error",
                "message": f"Operação '{codigo_operacao}' não encontrada"
            }), 404
        
        # Obter o posto da operação
        posto = operacao_encontrada.get('posto', '')
        
        if not posto:
            return jsonify({
                "status": "error",
                "message": f"Operação '{codigo_operacao}' não possui posto associado"
            }), 400
        
        if not modelo:
            return jsonify({
                "status": "error",
                "message": "Modelo é obrigatório"
            }), 400
        
        if not quantidade or quantidade <= 0:
            return jsonify({
                "status": "error",
                "message": "Quantidade deve ser maior que zero"
            }), 400
        
        # Buscar funcionário pelo nome do operador
        funcionario_matricula = None
        if operador:
            # Buscar funcionário pelo nome
            funcionarios = funcionarios_service.listar_todos_funcionarios()
            funcionario_encontrado = None
            for func in funcionarios:
                if func.get('nome') == operador:
                    funcionario_encontrado = func
                    break
            
            if funcionario_encontrado:
                funcionario_matricula = funcionario_encontrado.get('matricula')
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Operador '{operador}' não encontrado"
                }), 404
        
        # Usar modelo como produto se produto não foi fornecido
        produto_codigo = produto or modelo
        
        # Registrar entrada de produção
        resultado = producao_service.registrar_entrada(
            posto=posto,
            funcionario_matricula=funcionario_matricula,
            modelo_codigo=produto_codigo
        )
        
        # TODO: Em uma versão futura, podemos salvar informações adicionais como:
        # - peca
        # - codigo
        # - quantidade
        # em uma tabela de detalhes de produção
        
        return jsonify({
            "status": "success",
            "message": "Produção registrada com sucesso",
            "registro_id": resultado.get('registro_id'),
            "data": resultado.get('data'),
            "hora_inicio": resultado.get('hora_inicio'),
            "turno": resultado.get('turno')
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

