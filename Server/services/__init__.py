"""
Services package - Lógica de negócio
"""

from backend.services import (
    producao_service,
    rfid_service,
    csv_service,
    funcionarios_service,
    modelos_service,
    limpeza_service,
    auth_service
)


try:
    from backend.services import excel_service
except ImportError:
    excel_service = None
    print("Aviso: openpyxl não instalado. Exportação Excel não estará disponível.")
