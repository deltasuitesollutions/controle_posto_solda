from typing import Optional, List, Tuple, Dict, Any, Union
from datetime import datetime, date
from Server.models import ProducaoRegistro, DatabaseConnection, Funcionario, Modelo


def buscar_registros(
    data_inicio: Optional[str] = None, 
    data_fim: Optional[str] = None, 
    posto: Optional[str] = None
) -> List[Tuple[Any, ...]]:
    """Busca registros para exportação"""
    try:
        if not DatabaseConnection.table_exists('registros_producao'):
            raise Exception("Tabela registros_producao não encontrada")
        
        # Buscar todos os registros (sem limite para exportação)
        registros = ProducaoRegistro.listar(limit=10000, offset=0, data=None, posto=posto)
        
       
        if data_inicio or data_fim:
            registros_filtrados = []
            for registro in registros:
                if not registro.data_inicio:
                    continue
                
                try:
                    data_registro = datetime.strptime(registro.data_inicio, '%Y-%m-%d').date()
                    
                    # Verificar filtro de data_inicio
                    if data_inicio:
                        if isinstance(data_inicio, str):
                            data_inicio_obj = datetime.strptime(data_inicio, '%Y-%m-%d').date()
                        else:
                            continue
                        if data_registro < data_inicio_obj:
                            continue
                    
                    # Verificar filtro de data_fim
                    if data_fim:
                        if isinstance(data_fim, str):
                            data_fim_obj = datetime.strptime(data_fim, '%Y-%m-%d').date()
                        else:
                            continue
                        if data_registro > data_fim_obj:
                            continue
                    
                    registros_filtrados.append(registro)
                except (ValueError, TypeError) as e:
                    continue
            
            registros = registros_filtrados
        
        # Converter para formato de tupla 
        rows = []
        
        # Cache para buscar dados relacionados apenas uma vez
        from Server.models.posto import Posto
        from Server.models.peca import Peca
        from Server.models.operacao import Operacao
        
        funcionarios_cache = {f.funcionario_id: f for f in Funcionario.listar_todos()}
        postos_cache = {p.posto_id: p for p in Posto.listar_todos()}
        
        for registro in registros:
            funcionario = funcionarios_cache.get(registro.funcionario_id)
            modelo = Modelo.buscar_por_id(registro.modelo_id)
            posto_obj = postos_cache.get(registro.posto_id)
            
            # Buscar peça se existir
            peca_nome = ''
            peca_codigo = ''
            if registro.peca_id:
                try:
                    peca = Peca.buscar_por_id(registro.peca_id)
                    if peca:
                        peca_nome = peca.nome or ''
                        peca_codigo = peca.codigo or ''
                except:
                    pass
            
            # Usar codigo_producao se disponível, senão usar código da peça
            codigo_producao = registro.codigo_producao or peca_codigo
            
            # Buscar operação se existir
            operacao_nome = ''
            if registro.operacao_id:
                try:
                    operacao = Operacao.buscar_por_id(registro.operacao_id)
                    if operacao:
                        operacao_nome = operacao.nome or operacao.codigo_operacao or ''
                except:
                    pass
            
            rows.append((
                posto_obj.nome if posto_obj else None,
                funcionario.matricula if funcionario else None,
                funcionario.nome if funcionario else None,
                modelo.codigo if modelo else None,
                modelo.descricao if modelo else None,
                registro.data_inicio,
                registro.hora_inicio or registro.inicio,
                registro.fim,
                peca_nome,
                codigo_producao,
                operacao_nome
            ))
        
        # Ordenar por data e hora (descendente)
        rows.sort(key=lambda x: (x[5] or '', x[6] or ''), reverse=True)
        
        return rows
    except Exception as e:
        raise Exception(f"Erro ao buscar registros: {str(e)}")


def formatar_data(data_valor: Union[str, date, datetime, None]) -> Tuple[Optional[date], str]:
    """Formata uma data para exibição"""
    if not data_valor:
        return None, ''
    
    if isinstance(data_valor, (date, datetime)):
        data_obj = data_valor if isinstance(data_valor, date) else data_valor.date()
        return data_obj, data_obj.strftime('%d/%m/%Y')
    
    if isinstance(data_valor, str):
        data_valor = data_valor.strip()
        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%Y/%m/%d', '%d-%m-%Y']:
            try:
                data_obj = datetime.strptime(data_valor, fmt).date()
                return data_obj, data_obj.strftime('%d/%m/%Y')
            except (ValueError, TypeError):
                continue
    
    return None, str(data_valor) if data_valor else ''


def processar_linha(row: Tuple[Any, ...]) -> Dict[str, Any]:
    """Processa uma linha de dados para exportação"""
    # Campos obrigatórios (índices 0-7)
    posto = row[0] if len(row) > 0 else None
    matricula = row[1] if len(row) > 1 else None
    nome = row[2] if len(row) > 2 else None
    modelo_cod = row[3] if len(row) > 3 else None
    modelo_desc = row[4] if len(row) > 4 else None
    data_val = row[5] if len(row) > 5 else None
    hora_inicio = row[6] if len(row) > 6 else None
    hora_fim = row[7] if len(row) > 7 else None
    
    # Campos adicionais (índices 8-10)
    peca_nome = row[8] if len(row) > 8 else ''
    codigo_producao = row[9] if len(row) > 9 else ''
    operacao_nome = row[10] if len(row) > 10 else ''
    
    data_obj, data_str = formatar_data(data_val)
    
    return {
        'posto': posto or '',
        'matricula': matricula or '',
        'nome': nome or '',
        'modelo_cod': modelo_cod or '',
        'modelo_desc': modelo_desc or '',
        'data_obj': data_obj,
        'data_str': data_str,
        'hora_inicio': hora_inicio or '',
        'hora_fim': hora_fim or '',
        'peca_nome': peca_nome or '',
        'codigo_producao': codigo_producao or '',
        'operacao_nome': operacao_nome or ''
    }
