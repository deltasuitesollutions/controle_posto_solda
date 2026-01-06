"""
Módulo de modelos do backend
"""
from backend.models.database import DatabaseConnection
from backend.models.funcionario import Funcionario
from backend.models.modelo import Modelo
from backend.models.posto import Posto
from backend.models.tag_rfid import TagRFID
from backend.models.producao import ProducaoRegistro
from backend.models.posto_configuracao import PostoConfiguracao
from backend.models.usuario import Usuario
__all__ = [
    'DatabaseConnection',
    'Funcionario',
    'Modelo',
    'Posto',
    'TagRFID',
    'ProducaoRegistro',
    'PostoConfiguracao',
    'Usuario'
]

