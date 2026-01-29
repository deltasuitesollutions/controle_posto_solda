import csv
import io
from typing import Optional
from datetime import datetime
try:
    from zoneinfo import ZoneInfo
    TZ_MANAUS = ZoneInfo('America/Manaus')
except ImportError:
    import pytz
    TZ_MANAUS = pytz.timezone('America/Manaus')
from Server.services.export_service import buscar_registros, processar_linha

def exportar_registros_csv(
    data_inicio: Optional[str] = None, 
    data_fim: Optional[str] = None, 
    posto: Optional[str] = None
) -> bytes:
    rows = buscar_registros(data_inicio, data_fim, posto)
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL, lineterminator='\r\n')
    
    writer.writerow(['Posto', 'Operação', 'Inicio', 'Fim', 'Data', 'Produto', 'Peça', 'Código', 'Matrícula', 'Operador'])
    
    for row in rows:
        try:
            dados = processar_linha(row)
            writer.writerow([
                dados['posto'],
                dados['operacao_nome'],
                dados['hora_inicio'],
                dados['hora_fim'],
                dados['data_str'],
                dados['modelo_desc'],
                dados['peca_nome'],
                dados['codigo_producao'],
                dados['matricula'],
                dados['nome']
            ])
        except Exception as e:
            print(f"Erro ao escrever linha CSV: {e}")
            continue
    
    csv_content = output.getvalue()
    output.close()
    
    return csv_content.encode('utf-8-sig')

def gerar_nome_arquivo() -> str:
    timestamp = datetime.now(TZ_MANAUS).strftime("%d%m%Y_%H%M%S")
    return f"registros_producao_{timestamp}.csv"
