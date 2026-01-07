"""
Service para exportação de dados
"""
from typing import Optional, List, Tuple, Dict, Any, Union
from datetime import datetime, date
from Server.models import ProducaoRegistro, DatabaseConnection, Funcionario, Modelo


def buscar_registros(
    data_inicio: Optional[str] = None, 
    data_fim: Optional[str] = None, 
    posto: Optional[str] = None, 
    turno: Optional[str] = None
) -> List[Tuple[Any, ...]]:
    """Busca registros para exportação"""
    try:
        if not DatabaseConnection.table_exists('producao_registros'):
            raise Exception("Tabela producao_registros não encontrada")
        
        # Buscar todos os registros (sem limite para exportação)
        registros = ProducaoRegistro.listar(limit=10000, offset=0, data=None, posto=posto, turno=turno)
        
       
        if data_inicio or data_fim:
            registros_filtrados = []
            for registro in registros:
                if not registro.data:
                    continue
                
                try:
                    data_registro = datetime.strptime(registro.data, '%Y-%m-%d').date()
                    
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
        for registro in registros:
            funcionario = Funcionario.buscar_por_matricula(registro.funcionario_matricula)
            modelo = Modelo.buscar_por_codigo(registro.produto) if registro.produto else None
            
            rows.append((
                registro.posto,
                registro.funcionario_matricula,
                funcionario.nome if funcionario else None,
                registro.produto,
                modelo.descricao if modelo else None,
                registro.data,
                registro.hora_inicio,
                registro.hora_fim,
                registro.turno
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
    posto, matricula, nome, modelo_cod, modelo_desc, data_val, hora_inicio, hora_fim, turno = row
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
        'turno': turno or ''
    }
