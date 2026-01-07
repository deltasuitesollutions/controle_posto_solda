"""
Service para lógica de negócio de produção
"""
from typing import Dict, Any, Optional
from datetime import datetime
from Server.models import ProducaoRegistro, DatabaseConnection


def determinar_turno(hora_atual: str) -> int:
    """Determina o turno baseado na hora atual"""
    # Turno 1: 6:50-16:40, Turno 2: 16:38-01:58
    hora_minuto = int(hora_atual.split(':')[0]) * 60 + int(hora_atual.split(':')[1])
    if 410 <= hora_minuto < 1000:
        return 1
    elif hora_minuto >= 998 or hora_minuto < 118:
        return 2
    return 1


def verificar_registro_aberto(posto: str, funcionario_matricula: str, data_atual: str) -> bool:
    """Verifica se existe um registro em aberto"""
    try:
        return ProducaoRegistro.verificar_registro_aberto(posto, funcionario_matricula, data_atual)
    except Exception as e:
        raise Exception(f"Erro ao verificar registro aberto: {str(e)}")


def registrar_entrada(posto: str, funcionario_matricula: Optional[str] = None, produto: Optional[str] = None, modelo_codigo: Optional[str] = None) -> Dict[str, Any]:
    """Registra a entrada de um funcionário em um posto
    
    Se produto não for fornecido, busca da configuração do posto.
    Se funcionario_matricula não for fornecido, busca da configuração do posto.
    Aceita 'modelo_codigo' para compatibilidade, mas usa 'produto' internamente.
    """
    try:
        from Server.models import PostoConfiguracao
        
        data_atual = datetime.now().strftime('%Y-%m-%d')
        hora_atual = datetime.now().strftime('%H:%M')
        
        # Usar produto ou modelo_codigo (compatibilidade)
        if not produto:
            produto = modelo_codigo
        
        # Buscar configuração do posto se necessário
        config = PostoConfiguracao.buscar_por_posto(posto)
        
        # Se não foi fornecido funcionario_matricula, usar da configuração
        if not funcionario_matricula and config and config.funcionario_matricula:
            funcionario_matricula = config.funcionario_matricula
        
        # Se não foi fornecido produto, usar da configuração
        if not produto and config and config.modelo_codigo:
            produto = config.modelo_codigo
        
        # Usar turno da configuração se existir, senão calcular automaticamente
        if config and config.turno is not None:
            turno = str(config.turno)
        else:
            turno = str(determinar_turno(hora_atual))
        
        # Validações
        if not funcionario_matricula:
            raise Exception("Funcionário não informado e não há configuração para este posto")
        
        if not produto:
            raise Exception("Produto não informado e não há configuração para este posto")
        
        # Verificar se já existe registro aberto (sem considerar data, apenas posto + funcionário)
        registro_aberto_existente = ProducaoRegistro.buscar_registro_aberto(
            posto=posto,
            funcionario_matricula=funcionario_matricula
        )
        if registro_aberto_existente:
            raise Exception(f"Já existe um registro em aberto para este operador neste posto (ID: {registro_aberto_existente.id})")
        
        # Criar registro de entrada com todos os campos obrigatórios
        registro = ProducaoRegistro.criar(
            posto=posto,
            funcionario_matricula=funcionario_matricula,
            produto=produto,
            data=data_atual,
            hora_inicio=hora_atual,
            turno=turno,
            status='em_producao'
        )
        
        # Verificar se o registro realmente existe no banco
        if not registro.id:
            raise Exception("Registro criado mas não possui ID válido")
        
        # Buscar o registro do banco para confirmar
        registro_verificado = ProducaoRegistro.buscar_por_id(registro.id)
        if not registro_verificado:
            raise Exception(f"Registro {registro.id} não foi encontrado no banco de dados após criação")
        
        
        return {
            "registro_id": registro.id,
            "hora_inicio": hora_atual,
            "data": data_atual,
            "turno": turno,
            "funcionario_matricula": funcionario_matricula,
            "produto": produto
        }
    except Exception as e:
        raise Exception(f"Erro ao registrar entrada: {str(e)}")


def buscar_registro_aberto(
    posto: Optional[str] = None, 
    funcionario_matricula: Optional[str] = None, 
    registro_id: Optional[int] = None
) -> Dict[str, Any]:
    """Busca um registro em aberto"""
    try:
        registro = ProducaoRegistro.buscar_registro_aberto(
            posto=posto,
            funcionario_matricula=funcionario_matricula,
            registro_id=registro_id
        )
        
        if not registro:
            raise Exception(
                f"Nenhum registro em aberto encontrado. "
                f"Verifique se existe um registro de entrada para {funcionario_matricula or 'o funcionário'} no posto {posto or 'o posto'}."
            )
        
        return {
            "id": registro.id,
            "posto": registro.posto,
            "funcionario_matricula": registro.funcionario_matricula,
            "data": registro.data,
            "hora_inicio": registro.hora_inicio
        }
    except Exception as e:
        raise Exception(f"Erro ao buscar registro aberto: {str(e)}")


def calcular_duracao(hora_inicio_str: str, hora_fim_str: str) -> int:
    """Calcula a duração entre duas horas"""
    try:
        inicio_minutos = int(hora_inicio_str.split(':')[0]) * 60 + int(hora_inicio_str.split(':')[1])
        fim_minutos = int(hora_fim_str.split(':')[0]) * 60 + int(hora_fim_str.split(':')[1])
        duracao = fim_minutos - inicio_minutos
        if duracao < 0:
            duracao += 24 * 60  # passa meia-noite
        return duracao
    except:
        return 0


def registrar_saida(
    registro_id: Optional[int] = None, 
    posto: Optional[str] = None, 
    funcionario_matricula: Optional[str] = None
) -> Dict[str, Any]:
    """Registra a saída de um funcionário de um posto"""
    try:
    
        registro = buscar_registro_aberto(
            posto=posto,
            funcionario_matricula=funcionario_matricula,
            registro_id=registro_id
        )
        
        registro_obj = ProducaoRegistro.buscar_por_id(registro["id"])
        if not registro_obj:
            raise Exception("Registro não encontrado")
        
        # Verificar se o registro já está fechado
        if registro_obj.hora_fim:
            raise Exception(f"Registro {registro_obj.id} já está fechado (hora_fim: {registro_obj.hora_fim})")
        
        hora_atual = datetime.now().strftime('%H:%M')
        hora_inicio = registro_obj.hora_inicio or '00:00'
        duracao = calcular_duracao(hora_inicio, hora_atual)
        
        
        # Atualizar registro
        registro_obj.hora_fim = hora_atual
        registro_obj.status = 'finalizado'
        registro_obj.save()
        
        
        # Verificar se realmente foi salvo
        registro_verificado = ProducaoRegistro.buscar_por_id(registro_obj.id)
        if registro_verificado and not registro_verificado.hora_fim:
            raise Exception(f"ERRO CRÍTICO: Registro {registro_obj.id} não foi fechado corretamente no banco de dados")
        
        return {
            "registro_id": registro_obj.id,
            "hora_fim": hora_atual,
            "duracao_minutos": duracao
        }
    except Exception as e:
        import traceback
        raise Exception(f"Erro ao registrar saída: {str(e)}")


def listar_registros(
    limit: int = 100, 
    offset: int = 0, 
    data: Optional[str] = None, 
    posto: Optional[str] = None, 
    turno: Optional[str] = None
) -> Dict[str, Any]:
    """Lista registros de produção com formatação"""
    try:
        registros = ProducaoRegistro.listar(limit=limit, offset=offset, data=data, posto=posto, turno=turno)
        total = ProducaoRegistro.contar(data=data, posto=posto, turno=turno)
        
        meses_pt = {
            1: 'janeiro', 2: 'fevereiro', 3: 'março', 4: 'abril',
            5: 'maio', 6: 'junho', 7: 'julho', 8: 'agosto',
            9: 'setembro', 10: 'outubro', 11: 'novembro', 12: 'dezembro'
        }
        
        registros_formatados = []
        for registro in registros:
            # Buscar dados relacionados
            from Server.models import Funcionario, Modelo
            
            funcionario = Funcionario.buscar_por_matricula(registro.funcionario_matricula)
            modelo = Modelo.buscar_por_codigo(registro.produto) if registro.produto else None
            
            funcionario_nome = funcionario.nome if funcionario else 'N/A'
            modelo_descricao = modelo.descricao if modelo else 'N/A'
            
            # Garantir que hora_inicio seja string sem segundos
            hora_inicio = str(registro.hora_inicio) if registro.hora_inicio else 'N/A'
            # Remover segundos se existirem (formato HH:MM:SS -> HH:MM)
            if hora_inicio and len(hora_inicio) >= 8 and hora_inicio.count(':') >= 2:
                hora_inicio = hora_inicio[:5]  # Pega apenas HH:MM
            
            # Converter turno para int para uso numérico, mas manter como string se necessário
            turno_str = str(registro.turno) if registro.turno is not None else '1'
            turno = int(turno_str) if turno_str.isdigit() else 1
            
            # Formatar data
            data_formatada = registro.data
            try:
                if registro.data:
                    # Se data já é string, usar diretamente
                    if isinstance(registro.data, str):
                        data_obj = datetime.strptime(registro.data, '%Y-%m-%d')
                    else:
                        # Se for date object, converter
                        data_obj = registro.data
                    data_formatada = f"{data_obj.day} de {meses_pt[data_obj.month]}"
            except:
                pass
            
            # Garantir que hora_fim seja string ou None, sem segundos
            hora_fim_str = str(registro.hora_fim) if registro.hora_fim else None
            # Remover segundos se existirem (formato HH:MM:SS -> HH:MM)
            if hora_fim_str and len(hora_fim_str) >= 8 and hora_fim_str.count(':') >= 2:
                hora_fim_str = hora_fim_str[:5]  # Pega apenas HH:MM
            
            # Formatar período e texto
            if hora_fim_str:
                periodo = f"{hora_inicio} às {hora_fim_str}"
                texto_periodo = f"de {hora_inicio} às {hora_fim_str}"
            else:
                periodo = hora_inicio
                texto_periodo = f"de {hora_inicio} (em andamento)"
            
            texto_registro = f"No {turno}° turno, {texto_periodo}, do dia {data_formatada}, o {funcionario_nome}, matrícula {registro.funcionario_matricula}, produziu o {modelo_descricao}."
            
            registros_formatados.append({
                "id": registro.id,
                "turno": turno,
                "periodo": periodo,
                "texto_registro": texto_registro,
                "hora_inicio": hora_inicio,
                "hora_fim": hora_fim_str,
                "data": data_formatada,
                "data_raw": str(registro.data) if registro.data else None,
                "funcionario": {
                    "nome": funcionario_nome,
                    "matricula": registro.funcionario_matricula
                },
                "modelo": {
                    "codigo": registro.produto,
                    "descricao": modelo_descricao
                },
                "posto": registro.posto
            })
        
        return {
            "registros": registros_formatados,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise Exception(f"Erro ao listar registros: {str(e)}")
